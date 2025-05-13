import type { StandardSchemaV1 } from "@standard-schema/spec";
import {
  HeimdallHandler,
  type HeimdallHandlerType,
  type HeimdallValidationSchemaOutput,
} from "./HeimdallHandler.ts";

import type {
  HermodServiceConstructor,
  HermodServiceDiscovery,
  HermodServiceRecord,
} from "@asgard/hermod";

import * as z from "@zod/mini";
import type {
  InferVoidableSchemaOutput,
  VoidableStandardSchema,
} from "./types.ts";

export class HeimdallEndpointV2<
  TPath extends HeimdallPath,
  TBody extends VoidableStandardSchema = undefined,
  TResponse extends VoidableStandardSchema = undefined,
  TSearch extends VoidableStandardSchema = undefined,
  TParams extends VoidableStandardSchema = undefined,
  TServices extends HermodServiceConstructor[] = [],
> extends HeimdallHandler<
  HeimdallEndpointV2Input<TBody, TSearch, TParams>,
  HeimdallEndpointResponseSchema<TResponse>,
  TServices
> {
  static wrapHeimdallEndpointHandler<
    TBody extends VoidableStandardSchema = undefined,
    TResponse extends VoidableStandardSchema = undefined,
    TSearch extends VoidableStandardSchema = undefined,
    TParams extends VoidableStandardSchema = undefined,
    TServices extends HermodServiceConstructor[] = [],
  >(
    handler: HeimdallEndpointHandler<
      TBody,
      TSearch,
      TParams,
      TResponse,
      TServices
    >,
  ): HeimdallHandlerType<
    HeimdallEndpointV2Input<TBody, TSearch, TParams>,
    HeimdallEndpointResponseSchema<TResponse>,
    TServices
  > {
    return ({ input, services }) =>
      handler({
        services,
        body: input.body,
        params: input.params,
        search: input.search,
      });
  }

  _handlerPath?: HandlerPath;
  readonly path: TPath;
  readonly method: HttpMethod;
  readonly body: TBody;
  readonly res: TResponse;
  readonly params: TParams;
  readonly search: TSearch;
  readonly tags: string[];
  readonly description: string;

  ___HeimdallEndpoint___ = true;

  /**
   * Checks if the given resource is a HeimdallEndpoint.
   *
   * @param resource - The resource to check.
   * @returns - Whether the resource is a HeimdallEndpoint.
   */
  static isEndpoint(
    resource: unknown,
  ): resource is HeimdallEndpointV2<HeimdallPath> {
    return Boolean(
      resource &&
        typeof resource === "object" &&
        (resource as HeimdallEndpointV2<HeimdallPath>).___HeimdallEndpoint___,
    );
  }

  constructor(
    {
      handler,
      services,
      description = "Missing Endpoint Description",
      tags = [],
      serviceDiscovery,
      method,
      path,
      ...options
    }: HeimdallEndpointV2Options<
      TPath,
      TSearch,
      TParams,
      TBody,
      TResponse,
      TServices
    >,
  ) {
    const body = options.body as TBody;
    const params = options.params as TParams;
    const search = options.search as TSearch;
    const response = options.response as TResponse;

    super({
      handler: HeimdallEndpointV2.wrapHeimdallEndpointHandler(handler),
      input: {
        body,
        params,
        search,
      },
      response: {
        statusCode: z.number(),
        body: response,
      },
      services,
      serviceDiscovery,
    });

    this.method = method;
    this.path = path;
    this.body = body;
    this.res = response;
    this.params = params;
    this.search = search;
    this.description = description;
    this.tags = tags;
  }

  /**
   * The route for the endpoint.
   */
  get route(): HeimdallRoute<TPath, HttpMethod> {
    return `${this.method} ${this.path}` as HeimdallRoute<TPath, HttpMethod>;
  }

  get handlerName(): string {
    if (!this._handlerPath) {
      throw `${this.route} does not have a handler path. Please set it manually.`;
    }

    const [_, method] = this._handlerPath.split("#");

    return method;
  }

  get handlerPath(): string {
    if (!this._handlerPath) {
      throw `${this.route} does not have a handler path. Please set it manually.`;
    }

    const [p] = this._handlerPath.split("#");

    return p;
  }
}

type HeimdallEndpointV2Input<
  TBody extends VoidableStandardSchema = undefined,
  TSearch extends VoidableStandardSchema = undefined,
  TParams extends VoidableStandardSchema = undefined,
> = {
  body: TBody;
  search: TSearch;
  params: TParams;
};

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type HandlerPath = `${string}#${string}`;
export type HeimdallPath = `/${string}`;
export type HeimdallRoute<
  TPath extends HeimdallPath,
  TMethod extends HttpMethod = HttpMethod,
> = `${TMethod} ${TPath}`;

export type StatusScodeSchema = StandardSchemaV1<number | string, number>;
export type StatusCode = StandardSchemaV1.InferOutput<StatusScodeSchema>;
export type HeimdallEndpointResponseSchema<
  TResponse extends VoidableStandardSchema = undefined,
> = {
  statusCode: StandardSchemaV1<number | string, number>;
  body: TResponse;
};

export type HeimdallEndpointHandlerEvent<
  TBody extends VoidableStandardSchema = undefined,
  TSearch extends VoidableStandardSchema = undefined,
  TParams extends VoidableStandardSchema = undefined,
  TServices extends HermodServiceConstructor[] = [],
> = {
  body: TBody extends undefined ? never : InferVoidableSchemaOutput<TBody>;
  search: TSearch extends undefined ? never
    : InferVoidableSchemaOutput<TSearch>;
  params: TParams extends undefined ? never
    : InferVoidableSchemaOutput<TParams>;
  services: HermodServiceRecord<TServices>;
};

export type HeimdallEndpointHandler<
  TBody extends VoidableStandardSchema,
  TSearch extends VoidableStandardSchema,
  TParams extends VoidableStandardSchema,
  TResponse extends VoidableStandardSchema,
  TServices extends HermodServiceConstructor[] = [],
> = (
  input: HeimdallEndpointHandlerEvent<
    TBody,
    TSearch,
    TParams,
    TServices
  >,
) => Promise<
  HeimdallValidationSchemaOutput<HeimdallEndpointResponseSchema<TResponse>>
>;

export type HeimdallEndpointAuthorizer<
  TBody extends StandardSchemaV1 | undefined = undefined,
  TSearch extends StandardSchemaV1 | undefined = undefined,
  TParams extends StandardSchemaV1 | undefined = undefined,
  TServices extends HermodServiceConstructor[] = [],
> = (
  input: HeimdallEndpointHandlerEvent<
    TBody,
    TSearch,
    TParams,
    TServices
  >,
) => Promise<boolean> | boolean;
export type HeimdallEndpointV2Options<
  TPath extends HeimdallPath,
  TSearch extends VoidableStandardSchema,
  TParams extends VoidableStandardSchema,
  TBody extends VoidableStandardSchema,
  TResponse extends VoidableStandardSchema,
  TServices extends HermodServiceConstructor[] = [],
> = {
  /**
    Function use to authorize access to execution of this endpoint
  */
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
  /***
   * The response body schema.
   */
  response?: TResponse;
  /***
   * The input schema.
   */
  body?: TBody;

  /***
   * The input schema.
   */
  search?: TSearch;

  /***
   * The input schema.
   */
  params?: TParams;
  /***
   * The services to be used by the handler.
   */
  services: TServices;
  /**
   * The handler function.
   */
  handler: HeimdallEndpointHandler<
    TBody,
    TSearch,
    TParams,
    TResponse,
    TServices
  >;

  serviceDiscovery?: HermodServiceDiscovery<HermodServiceRecord<TServices>>;
};
