// Generic service interface that all services must implement
export interface HermisServiceInterface<
  TName extends string = string,
  TInstance = unknown,
> {
  serviceName: TName;
  register(): Promise<TInstance> | TInstance;
}

// Base service class that can be extended by specific services
export abstract class HermisService<
  TName extends string = string,
  TInstance = unknown,
> implements HermisServiceInterface<TName, TInstance>
{
  abstract serviceName: TName;
  abstract register(): Promise<TInstance> | TInstance;

  discover() {
    this.serviceDiscovery.add(this);
  }

  constructor(readonly serviceDiscovery: HermisServiceDiscovery) {}
}

// Service discovery class with proper typing

export class HermisServiceDiscovery<
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  TServices extends Record<string, unknown> = {},
> {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private static _instance: HermisServiceDiscovery<any>;
  private services = new Map<string, HermisServiceInterface>();
  s!: TServices;

  // Singleton pattern
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

  // Private constructor for singleton
  private constructor() {}

  // Add a service to the registry
  add<TName extends string, TInstance>(
    service: HermisServiceInterface<TName, TInstance>
  ): void {
    console.log("Adding service:", service.serviceName);
    this.services.set(service.serviceName, service);
  }

  // Get a service by name
  async get<K extends keyof TServices & string>(
    name: K
  ): Promise<TServices[K]> {
    const service = this.services.get(name);

    if (!service) {
      throw new Error(`Service '${name}' not found in service discovery`);
    }

    return service.register() as Promise<TServices[K]>;
  }

  async getMany<K extends (keyof TServices & string)[]>(
    names: [...K]
  ): Promise<{ [P in K[number]]: TServices[P] }> {
    const result = {} as { [P in K[number]]: TServices[P] };

    for (const name of names) {
      result[name] = await this.get(name);
    }

    return result;
  }

  // Check if a service exists
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
