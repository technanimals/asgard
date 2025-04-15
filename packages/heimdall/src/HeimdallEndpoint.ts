import type {
  HermodServiceConstructor,
  HermodServiceRecord,
} from "@asgard/hermod";
import type { StandardSchemaV1 } from "@standard-schema/spec";

import * as HttpStatusCodes from "stoker/http-status-codes";

export class HeimdallEndpoint<
  TPath extends HeimdallPath,
  TBody extends StandardSchemaV1 | undefined = undefined,
  TResponse extends StandardSchemaV1 | undefined = undefined,
  TSearch extends StandardSchemaV1 | undefined = undefined,
  TParams extends StandardSchemaV1 | undefined = undefined,
  TServices extends HermodServiceConstructor[] = [],
> {
  _handlerPath?: HandlerPath;

  get handlerPath(): string {
    if (!this._handlerPath) {
      throw `${this.route} does not have a handler path. Please set it manually.`;
    }

    const [p, method] = this._handlerPath.split("#");
    const [path] = p.split(".");

    return `${path}.${method}`;
  }

  private readonly noopAuthorizer: HeimdallEndpointAuthorizer<
    TBody,
    TSearch,
    TParams,
    TServices
  > = () => Promise.resolve(true);
  /**
   * Checks if the given response is a HeimdallEndpointResponse.
   *
   * @param response - The response to check.
   * @returns - Whether the response is a HeimdallEndpointResponse.
   */
  static isResponse(
    response: unknown,
  ): response is HeimdallEndpointResponse {
    if (
      !response || typeof response !== "object" || !("statusCode" in response)
    ) {
      return false;
    }

    const statusCode = Number(response.statusCode);
    if (statusCode < 200 || statusCode >= 600) {
      return false;
    }

    return true;
  }

  /**
   * Checks if the given response is a HeimdallEndpointErrorResponse.
   *
   * @param response - The response to check.
   * @returns - Whether the response is a HeimdallEndpointErrorResponse.
   */
  static isErrorResponse(
    response: unknown,
  ): response is HeimdallEndpointErrorResponse {
    if (!HeimdallEndpoint.isResponse(response)) {
      return false;
    }

    const statusCode = Number(response.statusCode);
    return Boolean(
      statusCode >= 400 &&
        statusCode < 600 &&
        ("body" in response && typeof response.body === "object") &&
        response.body &&
        ("message" in response.body &&
          typeof response.body.message === "string"),
    );
  }
  /**
   * Checks if the given response is a HeimdallEndpointSuccessResponse.
   *
   * @param response - The response to check.
   * @returns - Whether the response is a HeimdallEndpointSuccessResponse.
   */
  static isSuccessResponse(
    response: unknown,
  ): response is HeimdallEndpointSuccessResponse {
    if (!HeimdallEndpoint.isResponse(response)) {
      return false;
    }

    const statusCode = Number(response.statusCode);
    return (
      statusCode >= 200 &&
      statusCode < 300
    );
  }

  readonly isAuthorized: HeimdallEndpointAuthorizer<
    TBody,
    TSearch,
    TParams,
    TServices
  >;
  /**
   *  The standard schema for the request params.
   */
  readonly paramsSchema: TParams;
  /**
   * The standard schema for the request body.
   */
  readonly bodySchema: TBody;
  /**
   * The standard schema for the request search query.
   */
  readonly searchSchema: TSearch;
  /**
   * The standard schema for the response body.
   */
  readonly responseSchema: TResponse;
  /**
   *  the endpoint path. @example /api/v1/users
   */
  readonly path: HeimdallPath;
  /**
   * The HTTP method for the endpoint. @example GET, POST, PUT, DELETE
   */
  readonly method: HttpMethod;
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
  private handler: HeimdallEndpointHandler<
    TBody,
    TResponse,
    TSearch,
    TParams,
    TServices
  >;

  execute: HeimdallEndpointHandler<
    TBody,
    TResponse,
    TSearch,
    TParams,
    TServices
  > = async (input) => {
    const isAuthorized = await this.isAuthorized(input);
    console.log("isAuthorized", isAuthorized);
    if (!isAuthorized) {
      return {
        statusCode: HttpStatusCodes.FORBIDDEN,
        body: {
          message: "Forbidden",
        },
      } as unknown as HeimdallEndpointErrorResponse;
    }

    return this.handler(input);
  };

  async run(
    input: HeimdallEndpointHandlerInput<
      TBody,
      TSearch,
      TParams,
      TServices
    >,
  ): Promise<HeimdallEndpointValidationOutput<TResponse>> {
    const response = await this.execute(input);

    if (HeimdallEndpoint.isErrorResponse(response)) {
      throw new Error(response.body.message);
    }

    return this.parse(this.responseSchema, response.body);
  }

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
    this.searchSchema = options.search as TSearch;
    this.responseSchema = options.response as TResponse;
    this.services = options.services || [];
    this.path = options.path;
    this.method = options.method;

    this.handler = options.handler;
    this.description = options.description || "";
    this.tags = options.tags || [];
    this.isAuthorized = options.isAuthorized || this.noopAuthorizer;
  }

  /**
   * The route for the endpoint.
   */
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
  /**
   *  Parses and validates request params.
   *
   * @param data - The data to validate.
   * @returns - The validated data.
   */
  params(data: unknown): Promise<HeimdallEndpointValidationOutput<TParams>> {
    return this.parse(this.paramsSchema, data);
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
   * Parses and validates request search query.
   *
   * @param data - The data to validate.
   * @returns - The validated data.
   */
  search(data: unknown): Promise<HeimdallEndpointValidationOutput<TSearch>> {
    return this.parse(this.searchSchema, data);
  }
  /**
   * Parses and validates request response.
   *
   * @param data - The data to validate.
   * @returns - The validated data.
   */
  async response<T extends HeimdallEndpointResponse<TResponse>>(
    data: T,
  ): Promise<
    HeimdallEndpointResponse<HeimdallEndpointValidationOutput<TResponse>>
  > {
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
  TSearch extends StandardSchemaV1 | undefined = undefined,
  TParams extends StandardSchemaV1 | undefined = undefined,
  TServices extends HermodServiceConstructor[] = [],
> = {
  data: HeimdallEndpointValidationOutput<TBody>;
  search: HeimdallEndpointValidationOutput<TSearch>;
  params: HeimdallEndpointValidationOutput<TParams>;
  services: HermodServiceRecord<TServices>;
  headers?: Record<string, string>;
};

export type HeimdallEndpointRunner<
  TBody extends StandardSchemaV1 | undefined = undefined,
  TResponse extends StandardSchemaV1 | undefined = undefined,
  TSearch extends StandardSchemaV1 | undefined = undefined,
  TParams extends StandardSchemaV1 | undefined = undefined,
  TServices extends HermodServiceConstructor[] = [],
> = (
  input: HeimdallEndpointHandlerInput<
    TBody,
    TSearch,
    TParams,
    TServices
  >,
) => Promise<TResponse>;

export type HeimdallEndpointHandler<
  TBody extends StandardSchemaV1 | undefined = undefined,
  TResponse extends StandardSchemaV1 | undefined = undefined,
  TSearch extends StandardSchemaV1 | undefined = undefined,
  TParams extends StandardSchemaV1 | undefined = undefined,
  TServices extends HermodServiceConstructor[] = [],
> = (
  input: HeimdallEndpointHandlerInput<
    TBody,
    TSearch,
    TParams,
    TServices
  >,
) => Promise<
  HeimdallEndpointResponse<HeimdallEndpointValidationOutput<TResponse>>
>;

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type HeimdallEndpointAuthorizer<
  TBody extends StandardSchemaV1 | undefined = undefined,
  TSearch extends StandardSchemaV1 | undefined = undefined,
  TParams extends StandardSchemaV1 | undefined = undefined,
  TServices extends HermodServiceConstructor[] = [],
> = (
  input: HeimdallEndpointHandlerInput<TBody, TSearch, TParams, TServices>,
) => Promise<boolean> | boolean;

export type HeimdallEndpointOptions<
  TPath extends string,
  TBody extends StandardSchemaV1 | undefined = undefined,
  TResponse extends StandardSchemaV1 | undefined = undefined,
  TSearch extends StandardSchemaV1 | undefined = undefined,
  TParams extends StandardSchemaV1 | undefined = undefined,
  TServices extends HermodServiceConstructor[] = [],
> = {
  isAuthorized?: HeimdallEndpointAuthorizer<TBody, TSearch, TParams, TServices>;
  /**
   *  The description of the endpoint. @example Get all users
   */
  description?: string;
  /**
   * The tags for the endpoint used for documentation.
   */
  tags?: string[];
  /**
   * The endpoint path @example /api/v1/users
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
  TResponse = unknown,
> = {
  /**
   * The status code of the response.
   */
  statusCode: SuccessStatusCode;
  /**
   * The response body.
   */
  body: TResponse;
};

export type HeimdallEndpointErrorResponse = {
  /**
   * The status code of the response.
   */
  statusCode: ErrorStatusCode;
  /**
   * The error message.
   */
  body: {
    message: string;
  };
};

export type HeimdallEndpointResponse<
  TResponse = unknown,
> = HeimdallEndpointSuccessResponse<TResponse> | HeimdallEndpointErrorResponse;

export type HeimdallPath = `/${string}`;

export type HeimdallRoute<
  TPath extends HeimdallPath,
  TMethod extends HttpMethod = HttpMethod,
> = `${TMethod} ${TPath}`;

export type HttpResponse = {
  statusCode: StatusCode;
};

export type HandlerPath = `${string}#${string}`;
