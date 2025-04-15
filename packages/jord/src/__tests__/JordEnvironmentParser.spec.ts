import { JordEnvironmentParser } from "../JordEnvironmentParser.ts";

Deno.test({
  name: "Create a Singleton JordEnvironmentParser",
  fn: () => {
    const envParser = new JordEnvironmentParser({
      NODE_ENV: "development",
      port: 3000,
      host: "localhost",
    });

    const config = envParser.create((get) => ({
      env: get("NODE_ENV").enum(["development", "production"]),
      server: {
        host: get("host").string(),
        port: get("port").number(),
      },
    }));

    const a = config.parse();

    console.log(a.env);
  },
});
