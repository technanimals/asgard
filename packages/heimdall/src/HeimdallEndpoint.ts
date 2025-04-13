import type { HermisServiceConstructor } from '@asgard/hermes';
import type { StandardSchemaV1 } from '@standard-schema/spec';

import type * as HttpStatusCodes from 'stoker/http-status-codes';

export class HeimdallEndpoint<
	TBody extends StandardSchemaV1 | undefined = undefined,
	TResponse extends StandardSchemaV1 | undefined = undefined,
	TSearch extends StandardSchemaV1 | undefined = undefined,
	TParams extends StandardSchemaV1 | undefined = undefined,
	TServices extends HermisServiceConstructor[] = [],
> {
	/**
	 *
	 */
	private _params: TParams;
	private _body: TBody;
	private _response: TResponse;

	private services: TServices;

	constructor(
		private readonly options: HeimdallEndpointOptions<
			TBody,
			TResponse,
			TSearch,
			TParams,
			TServices
		>,
	) {}

	async params(): Promise<HeimdallEndpointValidationOutput<TParams>> {
		return this._params as HeimdallEndpointValidationOutput<TParams>;
	}

	async body(): Promise<HeimdallEndpointValidationOutput<TBody>> {
		return this._body as HeimdallEndpointValidationOutput<TBody>;
	}

	async search(): Promise<HeimdallEndpointValidationOutput<TSearch>> {
		return this._body as HeimdallEndpointValidationOutput<TSearch>;
	}
}

export type HeimdallEndpointValidationOutput<
	T extends StandardSchemaV1 | undefined,
> = T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> : undefined;

export type HeimdallEndpointHandler<
	TBody extends StandardSchemaV1 | undefined = undefined,
	TResponse extends StandardSchemaV1 | undefined = undefined,
	TSearch extends StandardSchemaV1 | undefined = undefined,
	TParams extends StandardSchemaV1 | undefined = undefined,
	TServices extends HermisServiceConstructor[] = [],
> = () => Promise<HeimdallEndpointResponse<TResponse>>;

export type HeimdallEndpointOptions<
	TBody extends StandardSchemaV1 | undefined = undefined,
	TResponse extends StandardSchemaV1 | undefined = undefined,
	TSearch extends StandardSchemaV1 | undefined = undefined,
	TParams extends StandardSchemaV1 | undefined = undefined,
	TServices extends HermisServiceConstructor[] = [],
> = {
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
	services?: TServices;
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

// /user/:id => { id: string }
// /user/:id/posts/:postId => { id: string; postId: string }

type StatusCode = typeof HttpStatusCodes;

export type SuccessStatusCode =
	| StatusCode['OK']
	| StatusCode['CREATED']
	| StatusCode['ACCEPTED']
	| StatusCode['NO_CONTENT'];

export type ErrorStatusCode =
	| StatusCode['BAD_REQUEST']
	| StatusCode['UNAUTHORIZED']
	| StatusCode['FORBIDDEN']
	| StatusCode['NOT_FOUND']
	| StatusCode['INTERNAL_SERVER_ERROR'];

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
