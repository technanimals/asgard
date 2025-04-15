// deno-lint-ignore-file no-explicit-any
import * as z from "@zod/mini";
import get from "lodash.get";

export class JordConfigParser<TResponse extends EmptyObject> {
  constructor(
    private readonly config: TResponse,
  ) {}
  /**
   * Parses the config object and validates it against the Zod schemas
   * @returns The parsed config object
   */
  parse(): JordInferConfig<TResponse> {
    const parsedConfig: EmptyObject = {};
    const errors: z.z.core.$ZodIssue[] = [];

    for (const key in this.config) {
      const s = this.config[key];
      if (s && typeof s === "object" && "safeParse" in s) {
        const schema = s as unknown as z.ZodMiniAny;
        const parsed = schema.safeParse(undefined);
        if (parsed.success) {
          // If the schema is valid, parse the value
          parsedConfig[key] = parsed.data;
        } else {
          // If the schema is invalid, assign the error
          errors.push(...parsed.error.issues.map((issue) => ({
            ...issue,
            path: [key, ...(issue.path as string[])],
          })));
        }
      } else {
        // Otherwise, just assign the value
        parsedConfig[key] = this.config[key];
      }
    }

    if (errors.length > 0) {
      // If there are errors, throw them
      throw errors;
    }

    return parsedConfig as JordInferConfig<TResponse>;
  }
}

export class JordEnvironmentParser<T extends EmptyObject> {
  constructor(private readonly config: T) {}

  private getZodGetter = (name: string) => {
    // Return an object that has all Zod schemas but with our wrapper
    return new Proxy(z, {
      get: (target, prop) => {
        // deno-lint-ignore ban-ts-comment
        // @ts-ignore
        const func = target[prop];

        if (typeof func === "function") {
          // Return a wrapper around each Zod schema creator
          return (...args: any[]) => {
            const schema = func(...args);
            // Add a custom parse method that gets the value from config
            const originalParse = schema.parse;
            const originalSafeParse = schema.safeParse;
            schema.parse = () => {
              const value = get(this.config, name);
              return originalParse.call(schema, value);
            };

            schema.safeParse = () => {
              const value = get(this.config, name);
              return originalSafeParse.call(schema, value);
            };

            return schema;
          };
        }
        return func;
      },
    });
  };
  /**
   * Creates a new JordConfigParser object that can be used to parse the config object
   *
   * @param builder - A function that takes a getter function and returns a config object
   * @returns A JordConfigParser object that can be used to parse the config object
   */
  create<TReturn extends EmptyObject>(
    builder: (get: JordEnvFetcher) => TReturn,
  ): JordConfigParser<TReturn> {
    const config = builder(this.getZodGetter);
    return new JordConfigParser(config);
  }
}

export type JordInferConfig<T extends EmptyObject> = {
  [K in keyof T]: T[K] extends z.ZodMiniAny ? z.infer<T[K]> : T[K];
};

export type JordEnvFetcher<
  TPath extends string = string,
> = (
  name: TPath,
) => typeof z;

export type JordEnvironmentBuilder<
  TResponse extends EmptyObject,
> = (
  get: JordEnvFetcher,
) => TResponse;

export type EmptyObject = Record<string | number | symbol, unknown>;
