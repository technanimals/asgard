import { HeimdallEndpoint } from "../HeimdallEndpoint.ts";
import { assertEquals, assertInstanceOf } from "@std/assert";

import * as HttpStatusCodes from "stoker/http-status-codes";
import * as z from "@zod/mini";
import { HermodService } from "@asgard/hermod";

class ConsoleLoggerService extends HermodService<"log", Console> {
  serviceName = "log" as const;
  register(): Console {
    return console;
  }
}

Deno.test({
  name: "Should create an endpoint",
  fn: () => {
    const bodySchema = z.object({
      a: z.string(),
    });
    const endpoint = new HeimdallEndpoint({
      path: "/test",
      method: "GET",
      body: bodySchema,
      services: [ConsoleLoggerService],
      handler: () => {
        return Promise.resolve({
          statusCode: HttpStatusCodes.OK,
          body: undefined,
        });
      },
    });

    assertInstanceOf(endpoint, HeimdallEndpoint);
  },
});

Deno.test({
  name: "Should execute endpoint",

  fn: async () => {
    const bodySchema = z.object({
      a: z.string(),
    });

    const endpoint = new HeimdallEndpoint({
      path: "/test",
      method: "GET",
      body: bodySchema,
      services: [ConsoleLoggerService],
      handler: () => {
        return Promise.resolve({
          statusCode: HttpStatusCodes.OK,
          body: undefined,
        });
      },
    });

    const response = await endpoint.execute({
      data: { a: "" },
      params: undefined,
      search: undefined,
      services: {
        log: console,
      },
    });

    assertEquals(response.body, undefined);
  },
});

Deno.test({
  name: "Should throw when user is not authorized",
  fn: async () => {
    const bodySchema = z.object({
      a: z.string(),
    });

    const endpoint = new HeimdallEndpoint({
      path: "/test",
      method: "GET",
      isAuthorized: () => false,
      body: bodySchema,
      services: [ConsoleLoggerService],
      handler: () => {
        return Promise.resolve({
          statusCode: HttpStatusCodes.OK,
          body: undefined,
        });
      },
    });

    const response = await endpoint.execute({
      data: { a: "" },
      params: undefined,
      search: undefined,
      services: {
        log: console,
      },
    });

    assertEquals(response.statusCode, HttpStatusCodes.FORBIDDEN);
  },
});
