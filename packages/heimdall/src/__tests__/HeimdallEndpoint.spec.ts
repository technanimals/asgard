import { HeimdallEndpoint } from '../HeimdallEndpoint.ts';
import { assertInstanceOf } from '@std/assert';

import * as HttpStatusCodes from 'stoker/http-status-codes';
import { z } from 'zod';
import { HermodService } from '@asgard/hermod';

class ConsoleLoggerService extends HermodService<'log', Console> {
	serviceName = 'log' as const;
	register(): Console {
		return console;
	}
}

Deno.test({
	name: 'Should create an endpoint',

	fn: () => {
		const bodySchema = z.object({
			a: z.string(),
		});

		const endpoint = new HeimdallEndpoint({
			path: '/test',
			method: 'GET',
			body: bodySchema,
			services: [ConsoleLoggerService],
			handler: () => {
				return Promise.resolve({
					statusCode: HttpStatusCodes.OK,
					body: undefined,
				});
			},
		});

		assertInstanceOf(endpoint, HeimdallEndpoint);
	},
});
