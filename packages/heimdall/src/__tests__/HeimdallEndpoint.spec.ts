import { HeimdallEndpoint } from '../HeimdallEndpoint';
import { describe, it, expect } from 'vitest';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { z } from 'zod';
import { HermisService } from '@asgard/hermod';

class ConsoleLoggerService extends HermisService<'log', Console> {
	serviceName: 'log';
	register(): Console {
		return console;
	}
}

describe('HeimdallEndpoint', () => {
	it('should create an instance of HeimdallEndpoint', async () => {
		const bodySchema = z.object({
			a: z.string(),
		});

		const endpoint = new HeimdallEndpoint({
			path: '/test',
			method: 'GET',
			body: bodySchema,
			services: [ConsoleLoggerService],
			handler: async ({ body, params, response, search, services }) => {
				return {
					statusCode: HttpStatusCodes.OK,
					body: undefined,
				};
			},
		});

		const body = await endpoint.body({});

		expect(endpoint).toBeInstanceOf(HeimdallEndpoint);
	});
});
