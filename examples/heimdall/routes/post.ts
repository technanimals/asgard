import { HeimdallEndpoint } from "@asgard/heimdall";
import z from "zod";
import { UserService } from "./services.ts";

export const getUser = new HeimdallEndpoint({
  path: "/users",
  method: "GET",
  description: "Get all users",
  tags: ["users"],
  response: z.object({
    users: z.object({
      id: z.number(),
      name: z.string(),
    }).array(),
  }),
  services: [UserService],
  handler: ({ services }) => {
    const user = services.user.getUser();
    return Promise.resolve({
      statusCode: 200,
      body: {
        users: [user],
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
