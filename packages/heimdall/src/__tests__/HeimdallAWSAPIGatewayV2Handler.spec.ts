import { HeimdallEndpoint } from "../HeimdallEndpoint.ts";
import { assertObjectMatch } from "@std/assert";

import * as HttpStatusCodes from "stoker/http-status-codes";
import { z } from "zod";
import { HeimdallAWSAPIGatewayV2Handler } from "../HeimdallAWSAPIGatewayV2Handler.ts";
import { HermodService, HermodServiceDiscovery } from "@asgard/hermod";

class TestService extends HermodService<"test", TestService> {
  serviceName = "test" as const;

  register() {
    return this;
  }

  getData() {
    return "test";
  }
}

Deno.test({
  name: "Should use injected service",
  fn: async () => {
    const endpoint = new HeimdallEndpoint({
      path: "/test",
      method: "GET",
      response: z.object({
        data: z.string(),
      }),
      services: [TestService],
      handler: ({ services }) => {
        const testService = services.test;
        const data = testService.getData();
        return Promise.resolve({
          statusCode: HttpStatusCodes.OK,
          body: { data },
        });
      },
    });

    const lambda = new HeimdallAWSAPIGatewayV2Handler(
      endpoint,
      HermodServiceDiscovery.getInstance(),
    );

    const data = { data: "test" };

    const response = await lambda.handler({});

    assertObjectMatch(data, JSON.parse(response.body || "{}"));
  },
});

Deno.test({
  name: "Should tech echo function",
  fn: async () => {
    const bodySchema = z.object({
      a: z.string(),
    });

    const endpoint = new HeimdallEndpoint({
      path: "/test",
      method: "GET",
      body: bodySchema,
      response: bodySchema,
      services: [],
      handler: ({ data }) => {
        return Promise.resolve({
          statusCode: HttpStatusCodes.OK,
          body: data,
        });
      },
    });

    const lambda = new HeimdallAWSAPIGatewayV2Handler(
      endpoint,
      HermodServiceDiscovery.getInstance(),
    );

    const data = { a: "test" };
    const body = JSON.stringify(data);
    const response = await lambda.handler({
      body,
      pathParameters: { id: "123" },
      queryStringParameters: { q: "test" },
    });

    assertObjectMatch(data, JSON.parse(response.body || "{}"));
  },
});
