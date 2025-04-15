import { JordEnvironmentParser } from "../JordEnvironmentParser.ts";

Deno.test({
  name: "Create a Singleton JordEnvironmentParser",
  fn: () => {
    const envParser = new JordEnvironmentParser({
      env: "development",
      port: 3000,
      host: "localhost",
    });

    const config = envParser.create((get) => ({
      env: get("env").enum(["development", "production"]),
      port: get("port").number(),
      host: get("host").string(),
      name: 5000,
    }));

    const a = config.parse();

    console.log({ a });
  },
});
