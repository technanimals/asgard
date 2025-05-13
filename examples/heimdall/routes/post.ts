import { HeimdallEndpointV2 } from "@asgard/heimdall";
import z from "zod";
import { UserService } from "./services.ts";

export const getUser = new HeimdallEndpointV2({
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

export const createUser = new HeimdallEndpointV2({
  path: "/users",
  method: "POST",
  services: [],
  response: z.void(),
  handler: () => {
    return Promise.resolve({
      statusCode: 200,
      body: undefined,
    });
  },
});

export const getUserFriends = new HeimdallEndpointV2({
  path: "/users/:id/friends",
  method: "POST",
  // response: z.void(),
  params: z.object({
    id: z.coerce.number(),
  }),
  services: [],
  handler: () => {
    return Promise.resolve({
      statusCode: 200,
      body: undefined,
    });
  },
});
