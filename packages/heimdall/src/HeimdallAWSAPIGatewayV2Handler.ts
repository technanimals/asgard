import type { StandardSchemaV1 } from '@standard-schema/spec';
import type {
	HeimdallEndpoint,
	HeimdallEndpointHandlerInput,
	HeimdallPath,
} from './HeimdallEndpoint';
import {
	type HermodServiceConstructor,
	HermodServiceDiscovery,
} from '@asgard/hermod';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import middy from '@middy/core';

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
	) {}

	private async _handler(
		e: APIGatewayProxyEventV2 &
			HeimdallEndpointHandlerInput<
				TBody,
				TResponse,
				TSearch,
				TParams,
				TServices
			>,
	) {
		return this.endpoint.execute(e);
	}

	handler = middy(this._handler.bind(this)).use({
		before: async (request) => {
			const {
				body,
				pathParameters = {},
				queryStringParameters = {},
			} = request.event;

			const serviceDiscovery = HermodServiceDiscovery.getInstance();

			const services = await serviceDiscovery.register(this.endpoint.services);

			request.event.data = await this.endpoint.body(body);
			request.event.params = await this.endpoint.params(pathParameters);
			request.event.search = await this.endpoint.search(queryStringParameters);
			request.event.services = services;
		},
		after: async (request) => {
			const { response } = request.event;
			if (response) {
				request.response = await this.endpoint.response(response);
			}
		},
	});
}
