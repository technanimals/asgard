import { defineConfig } from "@asgard/heimdall/config";
import { HeimdallHonoServer } from "@asgard/heimdall/hono";
import { HermodServiceDiscovery } from "@asgard/hermod";

import { resolver as zodResolver } from "hono-openapi/zod";
import { LoggerService, UserService } from "./routes/services.ts";

const config = defineConfig({
  routes: ["**/routes/**/{post,get,post,options,delete}.ts"],
});

const routes = await config.getEndpoints();

const endpoints = Array.from(routes.values());
const resolver = HeimdallHonoServer.createGenericResolver(zodResolver);

const server = await HeimdallHonoServer.createServer({
  endpoints,
  services: [LoggerService, UserService],
  resolver,
  serviceDiscovery: HermodServiceDiscovery.getInstance(),
});

Deno.serve(server.app.fetch);
