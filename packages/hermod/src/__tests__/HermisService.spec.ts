import { HermisServiceDiscovery } from '../HermisService';
import { describe, it, expect } from 'vitest';

describe('HermisServiceDiscovery', () => {
	it('should be a singleton', () => {
		const instance1 = HermisServiceDiscovery.getInstance();
		const instance2 = HermisServiceDiscovery.getInstance();

		expect(instance1).toBe(instance2);
	});

	it('should add and retrieve a service', async () => {
		const discovery = HermisServiceDiscovery.getInstance<{
			testService: string;
		}>();
		const mockService = {
			serviceName: 'testService',
			register: async () => 'testInstance',
		};

		discovery.add(mockService);

		const instance = await discovery.get('testService');
		expect(instance).toBe('testInstance');
	});

	it('should throw an error if service not found', async () => {
		const discovery =
			HermisServiceDiscovery.getInstance<Record<string, unknown>>();

		await expect(discovery.get('nonExistentService')).rejects.toThrow(
			"Service 'nonExistentService' not found in service discovery",
		);
	});

	it('should retrieve multiple services', async () => {
		const discovery = HermisServiceDiscovery.getInstance<{
			serviceA: string;
			serviceB: number;
		}>();

		const mockServiceA = {
			serviceName: 'serviceA',
			register: async () => 'instanceA',
		};

		const mockServiceB = {
			serviceName: 'serviceB',
			register: async () => 42,
		};

		discovery.add(mockServiceA);
		discovery.add(mockServiceB);

		const instances = await discovery.getMany(['serviceA', 'serviceB']);

		expect(instances).toEqual({
			serviceA: 'instanceA',
			serviceB: 42,
		});
	});
});
