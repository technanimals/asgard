// Generic service interface that all services must implement
export interface HermisServiceInterface<
  TName extends string = string,
  TInstance = unknown,
> {
  /**
   * The name of the service. This should be unique across all services.
   */
  serviceName: TName;
  /**
   * The register method is called when the service is registered with the service discovery.
   */
  register(): Promise<TInstance> | TInstance;
}

export abstract class HermisService<
  TName extends string = string,
  TInstance = unknown,
> implements HermisServiceInterface<TName, TInstance>
{
  /**
   * The name of the service. This should be unique across all services.
   */
  abstract serviceName: TName;
  /**
   * The register method is called when the service is registered with the service discovery.
   */
  abstract register(): Promise<TInstance> | TInstance;
  /**
   * The discover method adds the service to the service discovery.
   */
  discover() {
    this.serviceDiscovery.add(this);
  }
  /**
   * 
   * @param serviceDiscovery The service discovery instance to register the service with.
   */
  constructor(readonly serviceDiscovery: HermisServiceDiscovery) {}
}

export class HermisServiceDiscovery<
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  TServices extends Record<string, unknown> = {},
> {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private static _instance: HermisServiceDiscovery<any>;
  private services = new Map<string, HermisServiceInterface>();
  s!: TServices;

  static getInstance<
    // biome-ignore lint/complexity/noBannedTypes: <explanation>
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    T extends Record<any, unknown> = {},
  >(): HermisServiceDiscovery<T> {
    if (!HermisServiceDiscovery._instance) {
      HermisServiceDiscovery._instance = new HermisServiceDiscovery<T>();
    }
    return HermisServiceDiscovery._instance as HermisServiceDiscovery<T>;
  }

  private constructor() {}
  /**
   * Add a service to the service discovery.
   * 
   * @param service The service to add.
   */
  add<TName extends string, TInstance>(
    service: HermisServiceInterface<TName, TInstance>
  ): void {
    this.services.set(service.serviceName, service);
  }
  /**
   * Get a service from the service discovery.
   * 
   * @param name  - The name of the service to get.
   * @returns The service instance.
   */
  async get<K extends keyof TServices & string>(
    name: K
  ): Promise<TServices[K]> {
    const service = this.services.get(name);

    if (!service) {
      throw new Error(`Service '${name}' not found in service discovery`);
    }

    return service.register() as Promise<TServices[K]>;
  }
  /**
   * Get multiple services from the service discovery.
   * 
   * @param names - The names of the services to get.
   * @returns - An object containing the service instances.
   */
  async getMany<K extends (keyof TServices & string)[]>(
    names: [...K]
  ): Promise<{ [P in K[number]]: TServices[P] }> {
    const result = {} as { [P in K[number]]: TServices[P] };

    for (const name of names) {
      result[name] = await this.get(name);
    }

    return result;
  }

  /**
   * Check if a service exists in the service discovery.
   * 
   * @param name - The name of the service to check.
   * @returns True if the service exists, false otherwise.
   */
  has(name: string): boolean {
    return this.services.has(name);
  }
}

export interface HermisServiceConstructor<
  TName extends string = string,
  TInstance = unknown,
> {
  new (
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    serviceDiscovery: HermisServiceDiscovery<any>
  ): HermisService<TName, TInstance>;
}
