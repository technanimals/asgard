import { HeimdallEndpoint } from '../HeimdallEndpoint';
import { describe, it, expect } from 'vitest';
import * as HttpStatusCodes from 'stoker/http-status-codes';
describe('HeimdallEndpoint', () => {
	it('should create an instance of HeimdallEndpoint', async () => {
		const endpoint = new HeimdallEndpoint({
			handler: async () => {
				return {
					statusCode: HttpStatusCodes.OK,
					body: undefined,
				};
			},
		});

		expect(endpoint).toBeInstanceOf(HeimdallEndpoint);
	});
});
