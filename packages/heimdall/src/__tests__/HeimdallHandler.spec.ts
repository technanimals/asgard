import { HeimdallEndpoint } from "../HeimdallEndpoint.ts";
import { assertEquals, assertInstanceOf } from "@std/assert";

import { z } from "zod";

import { HeimdallHandler } from "../HeimdallHandler.ts";

Deno.test({
  name: "Should Validate Object Response Schema",
  fn: async () => {
    const inputSchema = {
      a: z.string(),
    };
    const handler = new HeimdallHandler({
      input: inputSchema,
      response: inputSchema,
      services: [],
      handler: ({ input }) => {
        return Promise.resolve(input);
      },
    });

    const input = {
      a: "Hello",
    };

    const output = await handler.run(input);

    assertEquals(output, input);
  },
});

Deno.test({
  name: "Should Validate Standard Response Schema",
  fn: async () => {
    const inputSchema = z.object({
      a: z.string(),
    });

    const handler = new HeimdallHandler({
      input: inputSchema,
      response: inputSchema,
      services: [],
      handler: ({ input }) => {
        return Promise.resolve(input);
      },
    });

    const input = {
      a: "Hello",
    };

    const output = await handler.run(input);

    assertEquals(output, input);
  },
});
