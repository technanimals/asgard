import { HermodServiceDiscovery } from '../HermodService.ts';
import { assertEquals, assert } from '@std/assert';
// describe('HermodServiceDiscovery', () => {
// 	it('should be a singleton', () => {
// 		const instance1 = HermodServiceDiscovery.getInstance();
// 		const instance2 = HermodServiceDiscovery.getInstance();

// 		expect(instance1).toBe(instance2);
// 	});

// 	it('should add and retrieve a service', async () => {
// 		const discovery = HermodServiceDiscovery.getInstance<{
// 			testService: string;
// 		}>();
// 		const mockService = {
// 			serviceName: 'testService',
// 			register: async () => 'testInstance',
// 		};

// 		discovery.add(mockService);

// 		const instance = await discovery.get('testService');
// 		expect(instance).toBe('testInstance');
// 	});

// 	it('should throw an error if service not found', async () => {
// 		const discovery =
// 			HermodServiceDiscovery.getInstance<Record<string, unknown>>();

// 		await expect(discovery.get('nonExistentService')).rejects.toThrow(
// 			"Service 'nonExistentService' not found in service discovery",
// 		);
// 	});

// 	it('should retrieve multiple services', async () => {
// 		const discovery = HermodServiceDiscovery.getInstance<{
// 			serviceA: string;
// 			serviceB: number;
// 		}>();

// 		const mockServiceA = {
// 			serviceName: 'serviceA',
// 			register: async () => 'instanceA',
// 		};

// 		const mockServiceB = {
// 			serviceName: 'serviceB',
// 			register: async () => 42,
// 		};

// 		discovery.add(mockServiceA);
// 		discovery.add(mockServiceB);

// 		const instances = await discovery.getMany(['serviceA', 'serviceB']);

// 		expect(instances).toEqual({
// 			serviceA: 'instanceA',
// 			serviceB: 42,
// 		});
// 	});
// });

Deno.test({
	name: 'Create a Singleton HermodServiceDiscovery',
	fn: () => {
		const instance1 = HermodServiceDiscovery.getInstance();
		const instance2 = HermodServiceDiscovery.getInstance();

		assertEquals(instance1, instance2);
	},
});
