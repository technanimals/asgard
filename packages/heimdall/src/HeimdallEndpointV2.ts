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
  ___HeimdallEndpoint___ = true;

  constructor(
    {
      body,
      params,
      handler,
      response,
      search,
      services,
      serviceDiscovery,
      method,
      path,
    }: HeimdallEndpointV2Options<
      TPath,
      TSearch,
      TParams,
      TBody,
      TResponse,
      TServices
    >,
  ) {
    super({
      handler: HeimdallEndpointV2.wrapHeimdallEndpointHandler(handler),
      input: {
        body: body as TBody,
        params: params as TParams,
        search: search as TSearch,
      },
      response: {
        statusCode: z.number(),
        body: response as TResponse,
      },
      services,
      serviceDiscovery,
    });

    this.method = method;
    this.path = path;
  }

  /**
   * The route for the endpoint.
   */
  get route(): HeimdallRoute<TPath, HttpMethod> {
    return `${this.method} ${this.path}` as HeimdallRoute<TPath, HttpMethod>;
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

export type HeimdallEndpointResponseSchema<
  TResponse extends VoidableStandardSchema = undefined,
> = {
  statusCode: StandardSchemaV1<number | string, number>;
  body: TResponse;
};

export type HeimdalltEndpointHandlerEvent<
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
  input: HeimdalltEndpointHandlerEvent<
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
  input: HeimdalltEndpointHandlerEvent<
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
