import { Hono } from "hono";
import { Scalar } from "@scalar/hono-api-reference";
import { describeRoute, openAPISpecs, type ResolverResult } from "hono-openapi";

import type {
  HermodServiceConstructor,
  HermodServiceDiscovery,
  HermodServiceRecord,
} from "@asgard/hermod";

import type { HeimdallEndpointV2, HeimdallPath } from "./HeimdallEndpointV2.ts";
import { StandardSchemaV1 } from "@standard-schema/spec";

export class HeimdallHonoServer<
  TServices extends HermodServiceConstructor[] = [],
> {
  /**
   * Creates a generic resolver function for the schema.
   *
   * @param resolver - The resolver function to use for the schema.
   * @param schema - The schema to resolve.
   * @returns
   */
  static createGenericResolver<S>(
    // deno-lint-ignore no-explicit-any
    resolver: (schema: any) => any,
  ): HeimdallSchemaResolver<S> {
    return (schema: S) => resolver(schema);
  }
  /**
   * Creates a new Heimdall Hono server.
   *
   * @param options - The options for the server.
   * @returns The server instance.
   */
  static async createServer<
    TServices extends HermodServiceConstructor[],
    TSchemaResolver extends HeimdallSchemaResolver<unknown>,
  >(
    options: HeimdallHonoServerOptions<TServices, TSchemaResolver>,
  ): Promise<HeimdallHonoServer<TServices>> {
    const {
      endpoints,
      app = new Hono(),
      services: serviceConstructors,
      name = "Heimdall",
      description = "Heimdall Hono Server",
      version = "1.0.0",
      resolver,
      serviceDiscovery,
      isVoidSchema,
    } = options;

    const services = await serviceDiscovery.register(serviceConstructors);

    for (const endpoint of endpoints) {
      const method = endpoint.method.toLowerCase() as
        | "get"
        | "post"
        | "put"
        | "delete"
        | "options";

      const content = await isVoidSchema(endpoint.res) ? undefined : {
        "application/json": {
          schema: resolver(endpoint.res),
        },
      };
      app[method](
        endpoint.path,
        describeRoute({
          description: endpoint.description,
          tags: endpoint.tags,
          responses: {
            200: {
              description: "Successful response",
              content,
            },
          },
        }),
        async (c) => {
          const body = await c.req.json().catch(() => undefined);
          const params = c.req.param();
          const search = c.req.query();

          const response = await endpoint.run({
            body,
            params,
            search,
            services,
          });

          return c.json(
            response.body,
            // deno-lint-ignore ban-ts-comment
            // @ts-ignore
            response.statusCode,
          );
        },
      );
    }

    app.get(
      "/openapi",
      openAPISpecs(app, {
        documentation: {
          info: {
            title: name,
            version: version,
            description,
          },
          servers: [],
        },
      }),
    );

    app.get(
      "/reference",
      Scalar({
        theme: "kepler",
        layout: "classic",
        defaultHttpClient: {
          targetKey: "node",
          clientKey: "fetch",
        },
        url: "/openapi",
      }),
    );

    return new HeimdallHonoServer(app, services);
  }

  private constructor(
    readonly app: Hono,
    readonly services: HermodServiceRecord<TServices>,
  ) {}
}

export interface HeimdallHonoServerOptions<
  TServices extends HermodServiceConstructor[],
  TSchemaResolver extends HeimdallSchemaResolver<unknown>,
> {
  app?: Hono;
  name?: string;
  description?: string;
  version?: string;
  endpoints: HeimdallEndpointV2<HeimdallPath>[];
  services: TServices;
  resolver: TSchemaResolver;
  isVoidSchema: (
    schema: StandardSchemaV1 | undefined,
  ) => Promise<boolean> | boolean;
  serviceDiscovery: HermodServiceDiscovery;
}

export type HeimdallSchemaResolver<T> = (schema: T) => ResolverResult;
