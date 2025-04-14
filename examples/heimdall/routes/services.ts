import { HermodService } from "@asgard/hermod";

export class LoggerService extends HermodService<"logger", Console> {
  serviceName = "logger" as const;
  register(): Console | Promise<Console> {
    return console;
  }
}

export class UserService extends HermodService<"user", UserService> {
  serviceName = "user" as const;
  register() {
    return this;
  }

  getUser() {
    return {
      id: Math.floor(Math.random() * 100),
      name: "John Doe",
    };
  }
}
