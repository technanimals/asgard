import { HeimdallEndpoint } from "@asgard/heimdall";
import z from "npm:zod@^3.24.2";

export const getUser = new HeimdallEndpoint({
  path: "/users",
  method: "GET",
  description: "Get all users",
  tags: ["users"],
  response: z.object({
    users: z.string().array(),
  }),
  services: [],
  handler: () => {
    return Promise.resolve({
      statusCode: 200,
      body: {
        users: ["user1", "user2", "user3"],
      },
    });
  },
});

export const createUser = new HeimdallEndpoint({
  path: "/users",
  method: "POST",
  services: [],
  handler: () => {
    return Promise.resolve({
      statusCode: 200,
      body: undefined,
    });
  },
});

export const getUserFriends = new HeimdallEndpoint({
  path: "/users/:id/friends",
  method: "POST",
  params: z.object({
    id: z.coerce.number(),
  }),
  services: [],
  handler: ({ params }) => {
    console.log("params", params);
    return Promise.resolve({
      statusCode: 200,
      body: undefined,
    });
  },
});
