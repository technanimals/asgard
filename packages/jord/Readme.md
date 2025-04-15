# @asgard/jord

A powerful, type-safe environment configuration manager for Javascript /
Typescript applications.

## Overview

Named after Jörd, the Norse goddess of Earth and mother of Thor, `@asgard/jord`
provides a solid foundation for your application's environment configuration.
Just as the Earth supports all life, Jörd supports your application by managing
environment variables with robust validation and type safety.

## Features

- 🔒 **Type-safe configuration** with complete TypeScript support
- 🧪 **Schema validation** powered by zod
- 🌲 **Deep path access** for nested configuration
- ⚡ **Simple, fluent API** for defining configuration
- 🚨 **Detailed error reporting** for configuration issues
- 🧩 **Seamless integration** with other @asgard packages

## Installation

```bash
# Using JSR (JavaScript Registry)
npx jsr add @asgard/jord
```

Or in your code:

```typescript
import { JordEnvironmentParser } from "@asgard/jord";
```

## Compatibility

@asgard/jord works seamlessly with both Deno and Node.js applications, providing
a consistent environment configuration experience across platforms.

## Basic Usage

Define and validate your environment configuration:

```typescript
import { JordEnvironmentParser } from "@asgard/jord";

// Create a parser with process.env
const env = new JordEnvironmentParser(Deno.env.toObject());

// Define your configuration schema
const configParser = env.create((get) => ({
  // Environment-specific configuration
  env: get("NODE_ENV").enum({
    development: "development",
    production: "production",
    test: "test",
  }).default("development"),

  // Server configuration - all top-level properties
  serverPort: get("PORT").number().default(3000),
  serverHost: get("HOST").string().default("localhost"),
  enableCors: get("ENABLE_CORS").boolean().default(true),

  // Database configuration - all top-level properties
  databaseUrl: get("DATABASE_URL").string(),
  dbMaxConnections: get("DB_MAX_CONNECTIONS").number().default(10),

  // Hardcoded values (passed through unchanged)
  version: "1.0.0",
}));

// Parse the configuration (this validates all values)
const config = configParser.parse();

// Use the configuration
console.log(`Starting server in ${config.env} mode`);
console.log(`Server listening at ${config.serverHost}:${config.serverPort}`);
```

## How It Works

1. Create a `JordEnvironmentParser` with your source of environment variables
   (typically `process.env` or `Deno.env.toObject()`)
2. Define a configuration schema using the `create()` method and the provided
   getter function
3. Use Zod validators to define the expected types and validation rules
4. Call `parse()` to validate the configuration against the schema
5. Receive a fully-typed configuration object with all values parsed and
   validated

## API Reference

### JordEnvironmentParser

The main entry point for creating configuration parsers.

```typescript
class JordEnvironmentParser<T extends EmptyObject> {
  constructor(config: T);
  create<TReturn extends EmptyObject>(
    builder: (get: JordEnvFetcher) => TReturn,
  ): JordConfigParser<TReturn>;
}
```

### JordConfigParser

Handles parsing and validation of the configuration.

```typescript
class JordConfigParser<TResponse extends EmptyObject> {
  constructor(config: TResponse);
  parse(): JordInferConfig<TResponse>;
}
```

### JordInferConfig

A type utility that converts Zod schema types to their output types.

```typescript
type JordInferConfig<T extends EmptyObject> = {
  [K in keyof T]: T[K] extends z.ZodMiniAny ? z.infer<T[K]> : T[K];
};
```

## The Philosophy Behind Jörd

Jörd was designed to solve a common problem with environment configuration:
**on-demand validation**.

### The Problem

Traditional environment validation approaches have a significant drawback - they
validate all environment variables at application startup. This creates several
issues:

- **Monolithic validation**: The entire application fails if any environment
  variable is missing or invalid, even if that particular configuration is only
  needed for specific features
- **All-or-nothing startup**: Your application can't partially function when
  some non-critical configurations are missing
- **Difficult testing**: Testing features in isolation becomes challenging when
  all environment variables must be defined

For example, if your application has both Microsoft and Google authentication:

```typescript
// Traditional approach - validates everything at startup
const config = {
  microsoft: {
    clientId: process.env.MS_CLIENT_ID || throwError("Missing MS_CLIENT_ID"),
    tenantId: process.env.MS_TENANT_ID || throwError("Missing MS_TENANT_ID"),
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ||
      throwError("Missing GOOGLE_CLIENT_ID"),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ||
      throwError("Missing GOOGLE_CLIENT_SECRET"),
  },
};

async function getMicrosoftUser() {
  // Uses microsoft config
}

async function getGoogleUser() {
  // Uses google config
}
```

In this traditional approach, your application will fail to start if either
Microsoft OR Google configurations are missing - even if you only need one of
them.

### The Jörd Solution

Jörd solves this by separating **configuration definition** from **configuration
validation**:

1. Define configurations for different parts of your application
2. Validate configurations only when and where they are needed
3. Allow different parts of your application to have different configuration
   requirements

```typescript
// Define configurations separately
const microsoftConfig = env.create((get) => ({
  clientId: get("MS_CLIENT_ID").string(),
  tenantId: get("MS_TENANT_ID").string(),
}));

const googleConfig = env.create((get) => ({
  clientId: get("GOOGLE_CLIENT_ID").string(),
  clientSecret: get("GOOGLE_CLIENT_SECRET").string(),
}));

// Validate only when needed
async function getMicrosoftUser() {
  // Only validates Microsoft config when this function runs
  const config = microsoftConfig.parse();
  // Use config...
}

async function getGoogleUser() {
  // Only validates Google config when this function runs
  const config = googleConfig.parse();
  // Use config...
}
```

This approach brings several benefits:

- **On-demand validation**: Configuration is only validated when actually needed
- **Graceful degradation**: Parts of your application can work even if others
  can't due to missing configuration
- **Modular configuration**: Keep configuration close to where it's used
- **Better error handling**: Handle configuration errors at the feature level
  rather than application level

With Jörd, you can structure your application to be resilient to partial
configuration, allowing it to function even when some features might be
unavailable due to configuration issues.

### Nested Configuration

Jörd currently only supports schema validation for top-level configuration
properties. While you can organize your configuration with nested objects,
please note that validation is only applied to the top level - nested values
will be passed through untouched:

```typescript
const configParser = env.create((get) => ({
  // These top-level properties will be validated
  authEnabled: get("FEATURES_AUTH_ENABLED").boolean().default(true),
  authProvider: get("FEATURES_AUTH_PROVIDER").enum({
    local: "local",
    oauth: "oauth",
    saml: "saml",
  }).default("local"),

  // Nested objects are structured for organization but values aren't validated by schema
  features: {
    billing: {
      // This is just a regular value, not validated through a schema
      enabled: process.env.FEATURES_BILLING_ENABLED === "true",
    },
  },
}));
```

If you need validated nested properties, define them at the top level with
namespaced keys:

### Custom Validation

You can use any Zod validator for complex validation rules:

```typescript
const configParser = env.create((get) => ({
  apiKey: get("API_KEY").string().min(32),
  email: get("ADMIN_EMAIL").string().email(),
  port: get("PORT").number().int().positive().lt(65536),
  urls: get("ALLOWED_URLS").array().min(1),
}));
```

### Error Handling

Jörd collects all validation errors and reports them together:

```typescript
try {
  const config = configParser.parse();
  // Use the config...
} catch (errors) {
  console.error("Invalid configuration:");
  errors.forEach((error) => {
    console.error(`- ${error.path.join(".")}: ${error.message}`);
  });
  Deno.exit(1);
}
```

## Integration with Other @asgard Packages

Jörd works seamlessly with other packages in the @asgard ecosystem:

### With @asgard/heimdall

```typescript
import { HeimdallEndpoint } from "@asgard/heimdall";
import { JordEnvironmentParser } from "@asgard/jord";

// Create your configuration
const env = new JordEnvironmentParser(Deno.env.toObject());
const config = env.create((get) => ({
  serverPort: get("PORT").number().default(3000),
  corsEnabled: get("CORS_ENABLED").boolean().default(true),
})).parse();

// Use in Heimdall endpoints
const endpoint = new HeimdallEndpoint({
  path: "/api/users",
  method: "GET",
  // Pass configuration to handler
  handler: async ({ services }) => {
    return {
      statusCode: 200,
      body: {
        message: `Server running on port ${config.serverPort}`,
      },
    };
  },
});
```

### With @asgard/hermod

```typescript
import { HermodService, HermodServiceDiscovery } from "@asgard/hermod";
import { JordEnvironmentParser } from "@asgard/jord";

// Create your configuration parser
const env = new JordEnvironmentParser(Deno.env.toObject());
const configParser = env.create((get) => ({
  redisUrl: get("REDIS_URL").string(),
  redisPassword: get("REDIS_PASSWORD").string().optional(),
}));

// Parse configuration inside the service registration
class CacheService extends HermodService<"cache", Redis> {
  serviceName = "cache";

  async register() {
    // Parse the configuration at registration time
    const config = configParser.parse();

    // Use the configuration
    const redis = new Redis(config.redisUrl, {
      password: config.redisPassword,
    });
    return redis;
  }
}
```

## License

MIT
