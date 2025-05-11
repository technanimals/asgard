import { assertEquals } from "@std/assert";

import { z } from "zod";
import { HermodService } from "@asgard/hermod";

import { HeimdallEndpointV2 } from "../HeimdallEndpointV2.ts";

class TestService extends HermodService<"test", TestService> {
  serviceName = "test" as const;
  register = () => this;
  getData = () => ({
    data: "TestService",
  });
}

Deno.test({
  name: "Should Validate Object Response Schema",
  fn: async () => {
    const handler = new HeimdallEndpointV2({
      body: z.object({}),
      response: z.void(),
      method: "DELETE",
      params: z.void(),
      path: "/",
      search: z.void(),
      services: [],
      handler: () =>
        Promise.resolve({
          statusCode: 200,
          body: undefined,
        }),
    });

    const output = await handler.run({
      body: {},
      params: undefined,
      search: undefined,
    });

    assertEquals(output.body, undefined);
  },
});

Deno.test({
  name: "Should inject services into handlers",
  fn: async () => {
    const handler = new HeimdallEndpointV2({
      // body: z.object({}),
      response: z.object({ data: z.string() }),
      method: "DELETE",
      path: "/",
      services: [TestService],
      handler: ({ services }) =>
        Promise.resolve({
          statusCode: 200,
          body: services.test.getData(),
        }),
    });

    const output = await handler.run({});

    assertEquals(output.body.data, "TestService");
  },
});
