import type { StandardSchemaV1 } from "@standard-schema/spec";
import type {
  HeimdallEndpoint,
  HeimdallEndpointHandlerInput,
  HeimdallPath,
  StatusCode,
} from "./HeimdallEndpoint.ts";

import type {
  HermodServiceConstructor,
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
    private readonly endpoint: HeimdallEndpoint<
      TPath,
      TBody,
      TResponse,
      TSearch,
      TParams,
      TServices
    >,
    private readonly serviceDiscovery: HermodServiceDiscovery,
  ) {}

  private _handler(
    e:
      & APIGatewayProxyEventV2
      & HeimdallEndpointHandlerInput<
        TBody,
        TSearch,
        TParams,
        TServices
      >,
  ) {
    return this.endpoint.execute(e);
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
      before: async (request) => {
        const {
          body: rawBody,
          pathParameters = {},
          queryStringParameters = {},
        } = request.event;

        const services = await this.serviceDiscovery.register(
          this.endpoint.services,
        );

        const body = this.parseBody(rawBody || "{}");

        request.event.data = await this.endpoint.body(body);
        request.event.params = await this.endpoint.params(pathParameters);

        request.event.search = await this.endpoint.search(
          queryStringParameters,
        );

        request.event.services = services;
      },
      after: async (request) => {
        const res = request.response;

        if (res) {
          const response = await this.endpoint.response(res);
          const body = typeof response.body === "string"
            ? response.body
            : JSON.stringify(response.body);
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
