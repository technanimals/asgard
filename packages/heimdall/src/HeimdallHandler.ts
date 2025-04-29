import type {
  HermodServiceConstructor,
  HermodServiceRecord,
} from "@asgard/hermod";
import type { StandardSchemaV1 } from "@standard-schema/spec";

export class HeimdallHandler<
  TBody extends StandardSchemaV1 | undefined = undefined,
  TResponse extends StandardSchemaV1 | undefined = undefined,
  TServices extends HermodServiceConstructor[] = [],
> {
  ___HeimdallHandler___ = true;

  /**
   * Checks if the given resource is a HeimdallEndpoint.
   *
   * @param resource - The resource to check.
   * @returns - Whether the resource is a HeimdallEndpoint.
   */
  static isHandler(
    resource: unknown,
  ): resource is HeimdallHandler {
    return Boolean(
      resource &&
        typeof resource === "object" &&
        (resource as HeimdallHandler).___HeimdallHandler___,
    );
  }

  readonly bodySchema: TBody;
  /**
   * The standard schema for the response body.
   */
  readonly responseSchema: TResponse;
  /**
   * The description of the endpoint. @example Get all users
   */
  readonly description: string;
  /**
   *  The tags for the endpoint used for documentation.
   */
  readonly tags: string[];
  /**
   * The services used by the endpoint.
   */
  readonly services: TServices;
  /**
   *  The execute function for the endpoint. responsible for handling the request.
   */
  private handler: HeimdallHandlerFn<
    TBody,
    TResponse,
    TServices
  >;

  execute: HeimdallHandlerFn<
    TBody,
    TResponse,
    TServices
  > = (input) => {
    return this.handler(input);
  };

  async run(
    input: HeimdallHandlerInput<
      TBody,
      TServices
    >,
  ): Promise<HeimdallEndpointValidationOutput<TResponse>> {
    const response = await this.execute(input);

    return this.parse(this.responseSchema, response);
  }

  constructor(
    options: HeimdallHandlerOptions<
      TBody,
      TResponse,
      TServices
    >,
  ) {
    this.bodySchema = options.body as TBody;

    this.responseSchema = options.response as TResponse;
    this.services = options.services || [];

    this.handler = options.handler;
    this.description = options.description || "";
    this.tags = options.tags || [];
  }

  private async parse<T extends StandardSchemaV1 | undefined = undefined>(
    schema: T,
    data: unknown,
  ): Promise<HeimdallEndpointValidationOutput<T>> {
    const response = await schema?.["~standard"].validate(data);

    if (response?.issues) {
      throw response.issues;
    }

    return response?.value as HeimdallEndpointValidationOutput<T>;
  }

  /**
   * Parses and validates request body.
   *
   * @param data - The data to validate.
   * @returns - The validated data.
   */
  body(data: unknown): Promise<HeimdallEndpointValidationOutput<TBody>> {
    return this.parse(this.bodySchema, data);
  }

  /**
   * Parses and validates request response.
   *
   * @param data - The data to validate.
   * @returns - The validated data.
   */
  async response(
    data: unknown,
  ): Promise<
    HeimdallEndpointValidationOutput<TResponse>
  > {
    return await this.parse(this.responseSchema, data);
  }
}

export type HeimdallEndpointValidationOutput<
  T extends StandardSchemaV1 | undefined,
> = T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> : undefined;

export type HeimdallHandlerInput<
  TBody extends StandardSchemaV1 | undefined = undefined,
  TServices extends HermodServiceConstructor[] = [],
> = {
  data: HeimdallEndpointValidationOutput<TBody>;
  services: HermodServiceRecord<TServices>;
  headers?: Record<string, string>;
};

export type HeimdallEndpointRunner<
  TBody extends StandardSchemaV1 | undefined = undefined,
  TResponse extends StandardSchemaV1 | undefined = undefined,
  TServices extends HermodServiceConstructor[] = [],
> = (
  input: HeimdallHandlerInput<
    TBody,
    TServices
  >,
) => Promise<TResponse>;

export type HeimdallHandlerFn<
  TBody extends StandardSchemaV1 | undefined = undefined,
  TResponse extends StandardSchemaV1 | undefined = undefined,
  TServices extends HermodServiceConstructor[] = [],
> = (
  input: HeimdallHandlerInput<
    TBody,
    TServices
  >,
) => Promise<
  HeimdallEndpointValidationOutput<TResponse>
>;

export type HeimdallHandlerOptions<
  TBody extends StandardSchemaV1 | undefined = undefined,
  TResponse extends StandardSchemaV1 | undefined = undefined,
  TServices extends HermodServiceConstructor[] = [],
> = {
  /**
   *  The description of the endpoint. @example Get all users
   */
  description?: string;
  /**
   * The tags for the endpoint used for documentation.
   */
  tags?: string[];

  /**
   * The request body schema.
   */
  body?: TBody;
  /**
   * The response body schema.
   */
  response?: TResponse;
  /**
   * The services to use.
   */
  services: TServices;
  /**
   * The handler function.
   */
  handler: HeimdallHandlerFn<
    TBody,
    TResponse,
    TServices
  >;
};
