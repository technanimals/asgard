import { JordEnvironmentParser } from "../JordEnvironmentParser.ts";
import { assertEquals } from "@std/assert";

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

Deno.test({
  name: "Should keep none parsable values",
  fn: () => {
    const envParser = new JordEnvironmentParser({
      NODE_ENV: "development",
      port: 3000,
      host: "localhost",
    });

    const url = "https://example.com";
    const config = envParser.create((get) => ({
      env: get("NODE_ENV").enum(["development", "production"]),
      url,
      server: {
        host: get("host").string(),
        port: get("port").number(),
      },
    }));

    const a = config.parse();

    assertEquals(a.url, url);
  },
});
