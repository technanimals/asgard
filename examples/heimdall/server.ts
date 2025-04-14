import { defineConfig } from "@asgard/heimdall/config";
import { HeimdallHonoServer } from "@asgard/heimdall/server";
import { resolver } from "hono-openapi/zod";

const config = defineConfig({
  routes: ["**/routes/**/{post,get,post,options,delete}.ts"],
});

const routes = await config.getEndpoints();

const endpoints = Array.from(routes.values());

const server = await HeimdallHonoServer.createServer({
  endpoints,
  services: [],
  resolver,
});

Deno.serve(server.app.fetch);
