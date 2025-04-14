import { defineConfig } from "@asgard/heimdall/config";

export default defineConfig({
  routes: ["**/routes/**/*.{post,get,post,options,delete}.ts"],
  // routes: ['**/*.route.ts'],
});
