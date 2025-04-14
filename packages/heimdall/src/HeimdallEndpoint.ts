import type {
  HermodServiceConstructor,
  HermodServiceRecord,
} from "@asgard/hermod";
import type { StandardSchemaV1 } from "@standard-schema/spec";

import type * as HttpStatusCodes from "stoker/http-status-codes";

export class HeimdallEndpoint<
  TPath extends HeimdallPath,
  TBody extends StandardSchemaV1 | undefined = undefined,
  TResponse extends StandardSchemaV1 | undefined = undefined,
  TSearch extends StandardSchemaV1 | undefined = undefined,
  TParams extends StandardSchemaV1 | undefined = undefined,
  TServices extends HermodServiceConstructor[] = [],
> {
  // deno-lint-ignore no-explicit-any
  static isErrorResponse<T extends HeimdallEndpointResponse<any>>(
    response: T,
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
  ): response is HeimdallEndpointErrorResponse {
    const statusCode = Number(response.statusCode);
    return (
      statusCode >= 400 &&
      statusCode < 600
    );
  }

  static isSuccessResponse<T extends HttpResponse>(response: T) {
    const statusCode = Number(response.statusCode);
    return (
      statusCode >= 200 &&
      statusCode < 300
    );
  }

  readonly paramsSchema: TParams;
  readonly bodySchema: TBody;
  readonly searchSchema: TSearch;
  readonly responseSchema: TResponse;

  readonly path: HeimdallPath;
  readonly method: HttpMethod;
  readonly description: string;
  readonly tags: string[];

  readonly services: TServices;

  execute: HeimdallEndpointHandler<
    TBody,
    TResponse,
    TSearch,
    TParams,
    TServices
  >;

  constructor(
    options: HeimdallEndpointOptions<
      TPath,
      TBody,
      TResponse,
      TSearch,
      TParams,
      TServices
    >,
  ) {
    this.paramsSchema = options.params as TParams;
    this.bodySchema = options.body as TBody;
    this.searchSchema = options.body as TSearch;
    this.responseSchema = options.response as TResponse;
    this.services = options.services || [];
    this.path = options.path;
    this.method = options.method;

    this.execute = options.handler;
    this.description = options.description || "";
    this.tags = options.tags || [];
  }

  get route(): HeimdallRoute<TPath, HttpMethod> {
    return `${this.method} ${this.path}` as HeimdallRoute<TPath, HttpMethod>;
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

  params(data: unknown): Promise<HeimdallEndpointValidationOutput<TParams>> {
    return this.parse(this.paramsSchema, data);
  }

  body(data: unknown): Promise<HeimdallEndpointValidationOutput<TBody>> {
    return this.parse(this.bodySchema, data);
  }

  search(data: unknown): Promise<HeimdallEndpointValidationOutput<TSearch>> {
    return this.parse(this.searchSchema, data);
  }

  async response<T extends HeimdallEndpointResponse<TResponse>>(
    data: T,
  ) {
    if (HeimdallEndpoint.isErrorResponse(data)) {
      return data;
    }

    return {
      statusCode: data.statusCode,
      body: await this.parse(this.responseSchema, data.body),
    };
  }
}

export type HeimdallEndpointValidationOutput<
  T extends StandardSchemaV1 | undefined,
> = T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> : undefined;

export type HeimdallEndpointHandlerInput<
  TBody extends StandardSchemaV1 | undefined = undefined,
  TResponse extends StandardSchemaV1 | undefined = undefined,
  TSearch extends StandardSchemaV1 | undefined = undefined,
  TParams extends StandardSchemaV1 | undefined = undefined,
  TServices extends HermodServiceConstructor[] = [],
> = {
  data: HeimdallEndpointValidationOutput<TBody>;
  search: HeimdallEndpointValidationOutput<TSearch>;
  params: HeimdallEndpointValidationOutput<TParams>;
  services: HermodServiceRecord<TServices>;
};

export type HeimdallEndpointHandler<
  TBody extends StandardSchemaV1 | undefined = undefined,
  TResponse extends StandardSchemaV1 | undefined = undefined,
  TSearch extends StandardSchemaV1 | undefined = undefined,
  TParams extends StandardSchemaV1 | undefined = undefined,
  TServices extends HermodServiceConstructor[] = [],
> = (
  input: HeimdallEndpointHandlerInput<
    TBody,
    TResponse,
    TSearch,
    TParams,
    TServices
  >,
) => Promise<HeimdallEndpointResponse<TResponse>>;

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type HeimdallEndpointOptions<
  TPath extends string,
  TBody extends StandardSchemaV1 | undefined = undefined,
  TResponse extends StandardSchemaV1 | undefined = undefined,
  TSearch extends StandardSchemaV1 | undefined = undefined,
  TParams extends StandardSchemaV1 | undefined = undefined,
  TServices extends HermodServiceConstructor[] = [],
> = {
  description?: string;
  tags?: string[];
  /**
   * The endpoint path.
   */
  path: TPath;
  /**
   * The HTTP method.
   */
  method: HttpMethod;
  /**
   * The request body schema.
   */
  body?: TBody;
  /**
   * The response body schema.
   */
  response?: TResponse;
  /**
   * The search query schema.
   */
  search?: TSearch;
  /**
   * The params schema.
   */
  params?: TParams;
  /**
   * The services to use.
   */
  services: TServices;
  /**
   * The handler function.
   */
  handler: HeimdallEndpointHandler<
    TBody,
    TResponse,
    TSearch,
    TParams,
    TServices
  >;
};

export type StatusCode = typeof HttpStatusCodes;

export type SuccessStatusCode =
  | StatusCode["OK"]
  | StatusCode["CREATED"]
  | StatusCode["ACCEPTED"]
  | StatusCode["NO_CONTENT"];

export type ErrorStatusCode = Omit<StatusCode, SuccessStatusCode>;

export type HeimdallEndpointSuccessResponse<
  TResponse extends StandardSchemaV1 | undefined = undefined,
> = {
  statusCode: SuccessStatusCode;
  body: HeimdallEndpointValidationOutput<TResponse>;
};

export type HeimdallEndpointErrorResponse = {
  statusCode: ErrorStatusCode;
  body: {
    message: string;
  };
};

export type HeimdallEndpointResponse<
  TResponse extends StandardSchemaV1 | undefined = undefined,
> = HeimdallEndpointSuccessResponse<TResponse> | HeimdallEndpointErrorResponse;

export type HeimdallPath = `/${string}`;

export type HeimdallRoute<
  TPath extends HeimdallPath,
  TMethod extends HttpMethod = HttpMethod,
> = `${TMethod} ${TPath}`;

export type HttpResponse = {
  statusCode: StatusCode;
};
