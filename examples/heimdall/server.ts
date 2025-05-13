import { defineConfig } from "@asgard/heimdall/config";
import {
  HeimdallAWSApiGatewayV2DeploymentProvider,
} from "@asgard/heimdall/deployment";

import { HeimdallHonoServer } from "@asgard/heimdall/hono";
import { HermodServiceDiscovery } from "@asgard/hermod";

import { resolver as zodResolver } from "hono-openapi/zod";
import { LoggerService, UserService } from "./routes/services.ts";
import process from "node:process";
import { ZodVoid } from "zod";
import { ZodObject } from "zod";

const config = defineConfig({
  routes: ["**/routes/**/{post,get,post,options,delete}.ts"],
});

const routes = await config.getEndpoints();

const endpoints = Array.from(routes.values());

const deployment = new HeimdallAWSApiGatewayV2DeploymentProvider();

deployment.export(endpoints, process.cwd());

const resolver = HeimdallHonoServer.createGenericResolver(zodResolver);

const server = await HeimdallHonoServer.createServer({
  endpoints,
  services: [LoggerService, UserService],
  resolver,
  serviceDiscovery: HermodServiceDiscovery.getInstance(),
  isVoidSchema: (schema) => {
    if (!schema) {
      return true;
    }

    return schema instanceof ZodVoid;
  },
});

Deno.serve(server.app.fetch);
