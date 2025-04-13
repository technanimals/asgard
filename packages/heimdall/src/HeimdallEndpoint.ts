import type {
	HermodServiceConstructor,
	HermodServiceRecord,
	HermodServiceDiscovery,
} from '@asgard/hermod';
import type { StandardSchemaV1 } from '@standard-schema/spec';

import type * as HttpStatusCodes from 'stoker/http-status-codes';

export class HeimdallEndpoint<
	TPath extends string,
	TBody extends StandardSchemaV1 | undefined = undefined,
	TResponse extends StandardSchemaV1 | undefined = undefined,
	TSearch extends StandardSchemaV1 | undefined = undefined,
	TParams extends StandardSchemaV1 | undefined = undefined,
	TServices extends HermodServiceConstructor[] = [],
> {
	/**
	 *
	 */
	private _params: TParams;
	private _body: TBody;
	private _search: TSearch;
	private _response: TResponse;

	readonly path: string;

	private _services: TServices;

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
		this._params = options.params as TParams;
		this._body = options.body as TBody;
		this._search = options.body as TSearch;
		this._response = options.response as TResponse;
		this._services = options.services || [];
	}

	private async parse<T extends StandardSchemaV1 | undefined = undefined>(
		schema: T,
		data: unknown,
	) {
		const response = await schema?.['~standard'].validate(data);

		if (response?.issues) {
			throw response.issues;
		}

		return response?.value as HeimdallEndpointValidationOutput<TParams>;
	}

	async params(
		data: unknown,
	): Promise<HeimdallEndpointValidationOutput<TParams>> {
		return this.parse(this._params, data);
	}

	async body(data: unknown): Promise<HeimdallEndpointValidationOutput<TBody>> {
		return this.parse(
			this._body,
			data,
		) as HeimdallEndpointValidationOutput<TBody>;
	}

	async search(
		data: unknown,
	): Promise<HeimdallEndpointValidationOutput<TSearch>> {
		return this.parse(
			this._search,
			data,
		) as HeimdallEndpointValidationOutput<TSearch>;
	}

	async response(
		data: unknown,
	): Promise<HeimdallEndpointValidationOutput<TResponse>> {
		return this.parse(
			this._response,
			data,
		) as HeimdallEndpointValidationOutput<TResponse>;
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
	body: HeimdallEndpointValidationOutput<TBody>;
	response: HeimdallEndpointValidationOutput<TResponse>;
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

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type HeimdallEndpointOptions<
	TPath extends string,
	TBody extends StandardSchemaV1 | undefined = undefined,
	TResponse extends StandardSchemaV1 | undefined = undefined,
	TSearch extends StandardSchemaV1 | undefined = undefined,
	TParams extends StandardSchemaV1 | undefined = undefined,
	TServices extends HermodServiceConstructor[] = [],
> = {
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

// /user/:id => { id: string }
// /user/:id/posts/:postId => { id: string; postId: string }

type StatusCode = typeof HttpStatusCodes;

export type SuccessStatusCode =
	| StatusCode['OK']
	| StatusCode['CREATED']
	| StatusCode['ACCEPTED']
	| StatusCode['NO_CONTENT'];

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
