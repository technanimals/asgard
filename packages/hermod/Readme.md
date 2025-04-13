# @asgard/hermod

A TypeScript service discovery library for your application architecture.

[![JSR Score](https://img.shields.io/jsr/v/@asgard/hermod)](https://jsr.io/@asgard/hermod)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Overview

`@asgard/hermod` is a lightweight, type-safe service discovery library for TypeScript applications. Named after the Norse god who served as the messenger between the realms, this package facilitates communication between different services in your application, making it simple to register, discover, and consume services with full type safety.

## Installation

```bash
# Using npm
npm install @asgard/hermod

# Using pnpm
pnpm add @asgard/hermod

# Using yarn
yarn add @asgard/hermod

# Using JSR
npx jsr add @asgard/hermod
```
## Key Features

* 🔍 **Type-safe service discovery** - Get full TypeScript type checking when accessing services
* 🧩 **Singleton pattern** - Avoid multiple service discovery instances with built-in singleton support
* 🔄 **Async service registration** - Support for both synchronous and asynchronous service initialization
* 🔌 **Pluggable architecture** - Create and register custom services easily
* 🛠️ **Generic type parameters** - Customize service names and instance types

## Basic Usage

```ts
  import { 
    HermisServiceDiscovery, 
    HermisService 
  } from '@asgard/hermod';

  // Define your service types
  interface Services {
    logger: Logger;
    database: Database;
  }

  // Create a service discovery instance
  const serviceDiscovery = HermisServiceDiscovery.getInstance<Services>();

  // Create and register services
  class LoggerService extends HermisService<'logger', Logger> {
    serviceName = 'logger' as const;
    
    register() {
      return new Logger();
    }
  }

  // Register the service
  new LoggerService(serviceDiscovery).discover();

  // Access the service elsewhere in your code
  const logger = await serviceDiscovery.get('logger');
```

## Examples
### Creating Multiple Services

```ts
// Define service interfaces
interface Logger {
  log(message: string): void;
}

interface Database {
  query(sql: string): Promise<unknown[]>;
}

// Define service types
interface Services {
  logger: Logger;
  database: Database;
}

// Get service discovery instance
const serviceDiscovery = HermisServiceDiscovery.getInstance<Services>();

// Create logger service
class LoggerService extends HermisService<'logger', Logger> {
  serviceName = 'logger' as const;
  
  register() {
    return {
      log: (message: string) => console.log(`[LOG]: ${message}`)
    };
  }
}

// Create database service
class DatabaseService extends HermisService<'database', Database> {
  serviceName = 'database' as const;
  
  async register() {
    // Simulate async initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      query: async (sql: string) => {
        console.log(`Executing query: ${sql}`);
        return [];
      }
    };
  }
}

// Register services
new LoggerService(serviceDiscovery).discover();
new DatabaseService(serviceDiscovery).discover();

// Use services together
async function main() {
  // Get individual services
  const logger = await serviceDiscovery.get('logger');
  logger.log('Application started');
  
  // Get multiple services at once
  const { logger: log, database } = await serviceDiscovery.getMany(['logger', 'database']);
  
  log.log('Querying database...');
  const results = await database.query('SELECT * FROM users');
}
```

## Service Dependencies

```ts
class ConfigService extends HermisService<'config', Record<string, any>> {
  serviceName = 'config' as const;
  
  register() {
    return {
      apiUrl: 'https://api.example.com',
      timeout: 5000
    };
  }
}

class ApiService extends HermisService<'api', ApiClient> {
  serviceName = 'api' as const;
  
  async register() {
    // Get config service
    const config = await this.serviceDiscovery.get('config');
    
    // Use config to set up API client
    return new ApiClient(config.apiUrl, config.timeout);
  }
}

// Register in correct order
new ConfigService(serviceDiscovery).discover();
new ApiService(serviceDiscovery).discover();
```

# Best Practices

* **Define service types upfront** - Create an interface that maps service names to their instance types
* **Use const assertions** for service names ('serviceName' as const)
* **Register services early** in your application lifecycle
* **Handle service dependencies** carefully to avoid circular dependencies
* **Use error handling** when retrieving services that might not be registered

## Checking Service Availability

The `has` method allows you to check if a service exists before attempting to retrieve it:

```ts
// Check if a service exists
if (serviceDiscovery.has('logger')) {
  // Service exists, safe to get
  const logger = await serviceDiscovery.get('logger');
  logger.log('System started');
} else {
  // Handle missing service
  console.warn('Logger service not available, using console');
  console.log('System started');
}

// Using with optional services
async function getAnalytics() {
  // Analytics might be optional
  if (serviceDiscovery.has('analytics')) {
    const analytics = await serviceDiscovery.get('analytics');
    return analytics.getStats();
  }
  
  // Return default empty data if service isn't available
  return { pageViews: 0, visitors: 0 };
}

// Checking multiple services
const requiredServices = ['database', 'auth', 'cache'];
const missingServices = requiredServices.filter(
  service => !serviceDiscovery.has(service)
);

if (missingServices.length > 0) {
  console.error(`Missing required services: ${missingServices.join(', ')}`);
} else {
  // All services available, safe to start application
  startApp();
}
```