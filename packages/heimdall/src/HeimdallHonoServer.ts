import { Hono } from "hono";
import { Scalar } from "@scalar/hono-api-reference";
import { describeRoute, openAPISpecs, type ResolverResult } from "hono-openapi";

import {
  type HermodServiceConstructor,
  HermodServiceDiscovery,
  type HermodServiceRecord,
} from "@asgard/hermod";
import type { HeimdallEndpoint, HeimdallPath } from "./HeimdallEndpoint.ts";

export class HeimdallHonoServer<
  TServices extends HermodServiceConstructor[] = [],
> {
  static async createServer<
    TServices extends HermodServiceConstructor[],
    TSchemaResolver extends HeimdallSchemaResolver<unknown>,
  >(
    {
      endpoints,
      app = new Hono(),
      services: serviceConstructors,
      name = "Heimdall",
      description = "Heimdall Hono Server",
      version = "1.0.0",
      resolver,
    }: HeimdallHonoServerOptions<TServices, TSchemaResolver>,
  ): Promise<HeimdallHonoServer<TServices>> {
    const serviceDiscovery = HermodServiceDiscovery.getInstance();
    const services = await serviceDiscovery.register(serviceConstructors);

    endpoints.forEach((endpoint) => {
      const method = endpoint.method.toLowerCase() as
        | "get"
        | "post"
        | "put"
        | "delete"
        | "options";

      const content = endpoint.responseSchema
        ? {
          "application/json": {
            schema: resolver(endpoint.responseSchema),
          },
        }
        : undefined;
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
          const serviceDiscovery = HermodServiceDiscovery.getInstance();

          const services = await serviceDiscovery.register(
            endpoint.services,
          );

          const body = await c.req.json().catch(() => undefined);
          const p = c.req.param();
          const q = c.req.query();

          const data = await endpoint.body(body);
          const params = await endpoint.params(p);
          const search = await endpoint.search(q);

          const response = await endpoint.execute({
            data,
            params,
            search,
            services,
          });

          const result = await endpoint.response(response);

          // deno-lint-ignore ban-ts-comment
          // @ts-ignore
          return c.json(result.body, response.statusCode);
        },
      );
    });

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
  endpoints: HeimdallEndpoint<HeimdallPath>[];
  services: TServices;
  resolver: TSchemaResolver;
}

export type HeimdallSchemaResolver<T> = (schema: T) => ResolverResult;
