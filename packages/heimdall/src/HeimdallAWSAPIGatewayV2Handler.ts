import type { StandardSchemaV1 } from "@standard-schema/spec";
import type {
  HeimdallEndpointHandlerEvent,
  HeimdallEndpointV2,
  HeimdallPath,
  StatusCode,
} from "./HeimdallEndpointV2.ts";

import {
  type HermodServiceConstructor,
  HermodServiceDiscovery,
} from "@asgard/hermod";

import type { APIGatewayProxyEventV2 } from "aws-lambda";

import middy from "@middy/core";

export class HeimdallAWSAPIGatewayV2Handler<
  TPath extends HeimdallPath,
  TBody extends StandardSchemaV1 | undefined = undefined,
  TResponse extends StandardSchemaV1 | undefined = undefined,
  TSearch extends StandardSchemaV1 | undefined = undefined,
  TParams extends StandardSchemaV1 | undefined = undefined,
  TServices extends HermodServiceConstructor[] = [],
> {
  constructor(
    private readonly endpoint: HeimdallEndpointV2<
      TPath,
      TBody,
      TResponse,
      TSearch,
      TParams,
      TServices
    >,
    private readonly serviceDiscovery: HermodServiceDiscovery =
      HermodServiceDiscovery.getInstance(),
  ) {}

  private _handler(
    e:
      & APIGatewayProxyEventV2
      & HeimdallEndpointHandlerEvent<
        TBody,
        TSearch,
        TParams,
        TServices
      >,
  ) {
    // deno-lint-ignore no-explicit-any
    return this.endpoint.run(e as any);
  }

  private parseBody(body: string) {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  handler: APIGatewayV2Handler = middy(this._handler.bind(this)).use(
    {
      before: (request) => {
        const {
          body: rawBody,
          pathParameters = {},
          queryStringParameters = {},
        } = request.event;

        const body = this.parseBody(rawBody || "{}");

        request.event.body = body;
        request.event.params = pathParameters;

        request.event.search = queryStringParameters;
      },
      after: (request) => {
        const res = request.response;

        if (res) {
          const body = typeof res.body === "string"
            ? res.body
            : JSON.stringify(res.body);
          request.response.body = body;
        }
      },
    },
  ) as unknown as APIGatewayV2Handler;
}

export type APIGatewayV2Handler = (a: {
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
  body?: string;
}) => Promise<{
  statusCode: StatusCode;
  body?: string;
}>;
