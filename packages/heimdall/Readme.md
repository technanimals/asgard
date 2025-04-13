# @asgard/heimdall

A type-safe API endpoint framework with file-based routing and multi-runtime support.

[![JSR Score](https://img.shields.io/jsr/v/@asgard/heimdall)](https://jsr.io/@asgard/heimdall)
[![npm](https://img.shields.io/npm/v/@asgard/heimdall)](https://www.npmjs.com/package/@asgard/heimdall)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Overview

`@asgard/heimdall` is a modern TypeScript framework for building type-safe API endpoints with a focus on developer experience and cross-platform compatibility. Named after Heimdall, the Norse god who guards the rainbow bridge to Asgard, this package creates a bridge between your file structure and various cloud platforms.

## Features

- 🛣️ **Type-safe routing** - Strong typing for paths, methods, and parameters
- 🔍 **Input validation** - Built-in schema validation using Standard Schema
- 💉 **Service injection** - Seamless integration with `@asgard/hermod` for service discovery
- 🔄 **Multi-runtime support** - Works with Node.js, Deno, and Bun
- 📂 **File-based structure** - Define endpoints with a clean, intuitive file organization
- 🛡️ **Security built-in** - First-class support for authentication and authorization
- ☁️ **Serverless ready** - First-class support for AWS Lambda and API Gateway

## Installation

```bash
# Using npm
npm install @asgard/heimdall

# Using pnpm
pnpm add @asgard/heimdall

# Using yarn
yarn add @asgard/heimdall

# Using JSR
npx jsr add @asgard/heimdall
```

## Quick Start

```typescript
import { HeimdallEndpoint } from '@asgard/heimdall';
import { z } from 'zod';
import { UserService, LoggerService } from '../services';

// Define your endpoint
const getUserEndpoint = new HeimdallEndpoint({
  path: '/users/:id',
  method: 'GET',
  
  // Define parameter validation with Zod
  params: z.object({
    id: z.string()
  }),
  
  // Define response schema with Zod
  response: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email()
  }),
  
  // Inject services from @asgard/hermod
  services: [UserService, LoggerService],
  
  // Implement the handler
  handler: async ({ params, services }) => {
    const { userService, logger } = services;
    
    logger.info(`Fetching user with id ${params.id}`);
    
    const user = await userService.findById(params.id);
    
    if (!user) {
      return {
        statusCode: 404,
        body: {
          message: `User with id ${params.id} not found`
        }
      };
    }
    
    return {
      statusCode: 200,
      body: user
    };
  }
});

// Register with your Heimdall server
server.registerEndpoint(getUserEndpoint);
```

## Core Concepts

### Endpoints

Endpoints are the building blocks of your API. Each endpoint combines:

- A route (path + HTTP method)
- Input validation (params, query, body)
- Response schema
- Service dependencies
- Handler implementation

### Service Injection

`@asgard/heimdall` integrates with `@asgard/hermod` for service discovery and dependency injection:

```typescript
// Define the services you need
const endpoint = new HeimdallEndpoint({
  // ...
  services: [DatabaseService, LoggerService, AuthService],
  handler: async ({ services }) => {
    // Services are available and fully typed
    const { databaseService, loggerService, authService } = services;
    
    // Use your services
    const result = await databaseService.query('...');
    
    return {
      statusCode: 200,
      body: result
    };
  }
});
```

#### Schema Validation

`@asgard/heimdall` supports multiple validation libraries through StandardSchema specification:

#### Using Zod

```typescript
import { z } from 'zod';

const createUserEndpoint = new HeimdallEndpoint({
  path: '/users',
  method: 'POST',
  
  // Use Zod for validation
  body: z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().min(18),
    roles: z.array(z.string())
  }),
  
  // ...handler implementation
});
```

#### Using Arktype

```typescript
import { type } from 'arktype';

const createUserEndpoint = new HeimdallEndpoint({
  path: '/users',
  method: 'POST',
  
  // Use Arktype for validation
  body: type({
    name: 'string',
    email: 'string:email',
    age: 'number>=18',
    roles: 'string[]'
  }),
  
  // ...handler implementation
});
```

`@asgard/heimdall` provides first-class support for AWS Lambda and API Gateway v2:

```typescript
import { HeimdallEndpoint } from '@asgard/heimdall';
import { HeimdallAWSAPIGatewayV2Handler } from '@asgard/heimdall/aws';
import { type } from 'arktype';
import { UserService } from '../services';

// Define your endpoint
const getUserEndpoint = new HeimdallEndpoint({
  path: '/users/:id',
  method: 'GET',
  
  // Use Arktype for validation
  params: type({
    id: 'string'
  }),
  
  response: type({
    id: 'string',
    name: 'string',
    email: 'string:email'
  }),
  
  services: [UserService],
  handler: async ({ params, services }) => {
    const { userService } = services;
    const user = await userService.findById(params.id);
    
    if (!user) {
      return {
        statusCode: 404,
        body: { message: 'User not found' }
      };
    }
    
    return {
      statusCode: 200,
      body: user
    };
  }
});

// Create Lambda handler
const lambdaHandler = new HeimdallAWSAPIGatewayV2Handler(getUserEndpoint);

// Export the handler function for AWS Lambda
export const handler = lambdaHandler.handler;
```

The AWS adapter:
- Automatically parses API Gateway event objects
- Validates request data against your schemas
- Injects services from your service discovery
- Handles middleware through Middy
- Returns properly formatted responses

## API Reference

### HeimdallEndpoint

The main class for defining endpoints.

```typescript
new HeimdallEndpoint({
  path: string;            // The endpoint path (e.g., '/users/:id')
  method: HttpMethod;      // 'GET', 'POST', 'PUT', 'DELETE', or 'PATCH'
  body?: Schema;           // Request body validation schema
  response?: Schema;       // Response body schema
  search?: Schema;         // Query parameters schema
  params?: Schema;         // Path parameters schema
  services: Service[];     // Array of service constructors
  handler: Function;       // Handler implementation
})
```

## Best Practices

1. **Define precise schemas** - Be specific with your validation to catch errors early
2. **Register services early** - Set up your service discovery at application startup
3. **Use dependency injection** - Avoid direct imports in your handlers
4. **File structure matters** - Organize your API endpoints logically
5. **Handle errors consistently** - Use standard error responses across endpoints

## License

MIT © Lebogang Mabala