import type { StandardSchemaV1 } from "@standard-schema/spec";
import {
  type HermodServiceConstructor,
  HermodServiceDiscovery,
  type HermodServiceRecord,
} from "@asgard/hermod";

export class HeimdallHandler<
  TInput extends HeimdallBaseSchema,
  TResponse extends HeimdallBaseSchema,
  TServices extends HermodServiceConstructor[] = [],
> {
  static isStandardSchema(schema: unknown): schema is StandardSchemaV1 {
    if (!schema || typeof schema !== "object" || !("~standard" in schema)) {
      return false;
    }

    const standardSchema = schema["~standard"];

    if (!standardSchema || typeof standardSchema !== "object") {
      return false;
    }

    return "validate" in standardSchema &&
      typeof standardSchema.validate === "function";
  }

  static async parseSchema<
    TSchema extends HeimdallBaseSchema,
    T,
  >(
    schema: TSchema,
    data: T,
  ): Promise<HeimdallValidationSchemaOutput<TSchema>> {
    if (!HeimdallHandler.isStandardSchema(schema)) {
      return HeimdallHandler.parseObjectSchemas(
        data,
        schema,
      ) as HeimdallValidationSchemaOutput<TSchema>;
    }

    const validated = await schema["~standard"].validate(data);

    if (validated.issues) {
      throw validated.issues;
    }

    return validated.value as HeimdallValidationSchemaOutput<TSchema>;
  }

  static async parseObjectSchemas<
    TSchemas extends HeimdallHandlerObjectSchema,
  >(
    i: unknown,
    schemas: TSchemas,
  ): Promise<HeimdallHandlerObjectSchemaOutput<TSchemas>> {
    if (!i || typeof i !== "object") {
      throw new Error("Input should be an object");
    }

    const input = i as Record<string, unknown>;

    const keys = Object.keys(input);
    const validated = {} as HeimdallHandlerObjectSchemaOutput<TSchemas>;
    const issues: Record<string, readonly StandardSchemaV1.Issue[]> = {};
    let hasIssues = false;

    for await (const k of keys) {
      const key = k as keyof TSchemas;
      const schema = schemas[key];
      if (!schema) continue;
      const value = input[k];
      const response = await schema?.["~standard"].validate(value);

      if (response.issues) {
        hasIssues = true;
        issues[k] = response.issues;
        continue;
      }

      validated[key] = response.value as HeimdallValidationOutput<
        typeof schema
      >;
    }

    if (hasIssues) {
      throw issues;
    }

    return validated;
  }

  protected services: TServices;
  protected readonly input: TInput;
  protected readonly response: TResponse;
  protected readonly serviceDiscovery: HermodServiceDiscovery<
    HermodServiceRecord<TServices>
  >;

  protected readonly handler: HeimdallHandlerType<
    TInput,
    TResponse,
    TServices
  >;
  constructor(options: HeimdallHandlerOptions<TInput, TResponse, TServices>) {
    this.handler = options.handler;
    this.services = options.services;
    this.input = options.input;
    this.response = options.response;
    this.serviceDiscovery = options.serviceDiscovery ??
      HermodServiceDiscovery.getInstance();
  }

  parseInput(
    input: unknown,
  ): Promise<HeimdallValidationSchemaOutput<TInput>> {
    return HeimdallHandler.parseSchema(this.input, input);
  }

  run: HeimdallHandlerRunner<
    TInput,
    TResponse
  > = async (input) => {
    const data = await HeimdallHandler.parseSchema(this.input, input);

    const services = await this.serviceDiscovery.register(this.services);

    const response = await this.handler({
      input: data,
      services,
    });

    const output = await HeimdallHandler.parseSchema(this.response, response);

    return output;
  };
}

export type HeimdallHandlerObjectSchema = {
  [k: string]: StandardSchemaV1;
};

export type HeimdallBaseSchema = HeimdallHandlerObjectSchema | StandardSchemaV1;

export type HeimdallHandlerSchema<T> = T extends StandardSchemaV1 ? T
  : (T extends HeimdallHandlerObjectSchema ? T : never);

export type HeimdallValidationOutput<
  T extends StandardSchemaV1,
> = StandardSchemaV1.InferOutput<T>;

export type HeimdallHandlerObjectSchemaOutput<
  TInput extends HeimdallHandlerObjectSchema,
> = {
  [k in keyof TInput]: HeimdallValidationOutput<TInput[k]>;
};

export type HeimdallValidationSchemaOutput<
  TSchema,
> = TSchema extends HeimdallHandlerObjectSchema
  ? HeimdallHandlerObjectSchemaOutput<TSchema>
  : (TSchema extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<TSchema>
    : never);

export type HeimdalltHandlerEvent<
  TInput extends HeimdallBaseSchema,
  TServices extends HermodServiceConstructor[] = [],
> = {
  input: HeimdallValidationSchemaOutput<TInput>;
  services: HermodServiceRecord<TServices>;
};

export type HeimdallHandlerType<
  TInput extends HeimdallBaseSchema,
  TResponse extends HeimdallBaseSchema,
  TServices extends HermodServiceConstructor[] = [],
> = (
  input: HeimdalltHandlerEvent<
    TInput,
    TServices
  >,
) => Promise<
  HeimdallValidationSchemaOutput<TResponse>
>;

export type HeimdallHandlerRunner<
  TInput extends HeimdallBaseSchema,
  TResponse extends HeimdallBaseSchema,
> = (
  input: HeimdallValidationSchemaOutput<TInput>,
) => Promise<
  HeimdallValidationSchemaOutput<TResponse>
>;

export type HeimdallHandlerOptions<
  TInput extends HeimdallBaseSchema,
  TResponse extends HeimdallBaseSchema,
  TServices extends HermodServiceConstructor[] = [],
> = {
  /***
   * The response body schema.
   */
  response: TResponse;
  /***
   * The input schema.
   */
  input: TInput;
  /***
   * The services to be used by the handler.
   */
  services: TServices;
  /**
   * The handler function.
   */
  handler: HeimdallHandlerType<
    TInput,
    TResponse,
    TServices
  >;
  serviceDiscovery?: HermodServiceDiscovery<HermodServiceRecord<TServices>>;
};
