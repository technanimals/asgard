// deno-lint-ignore-file no-explicit-any
import { z } from "zod";
import get from "lodash.get";
import set from "lodash.set";

export class JordConfigParser<TResponse extends EmptyObject> {
  constructor(
    private readonly config: TResponse,
  ) {}
  /**
   * Parses the config object and validates it against the Zod schemas
   * @returns The parsed config object
   */
  parse(): JordInferConfig<TResponse> {
    const errors: z.ZodIssue[] = [];

    const parseDeep = <T>(
      config: T,
    ) => {
      const result: EmptyObject = {};

      if (config && typeof config !== "object") {
        return config;
      }

      for (const key in config) {
        const schema = config[key];

        if (schema instanceof z.ZodSchema) {
          const parsed = schema.safeParse(undefined);
          if (parsed.success) {
            set(result, key, parsed.data);
          } else {
            // If the schema is invalid, assign the error
            errors.push(...parsed.error.issues.map((issue) => ({
              ...issue,
              path: [key, ...(issue.path as string[])],
            })));
          }
        } else if (schema) {
          set(result, key, parseDeep(schema as EmptyObject));
        }
      }

      return result;
    };

    const parsedConfig = parseDeep(this.config) as unknown as JordInferConfig<
      TResponse
    >;

    if (errors.length > 0) {
      // If there are errors, throw them
      throw errors;
    }

    return parsedConfig;
  }
}

export class JordEnvironmentParser<T extends EmptyObject> {
  constructor(private readonly config: T) {}

  private getZodGetter = (name: string) => {
    // Return an object that has all Zod schemas but with our wrapper
    return new Proxy({ ...z }, {
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
  [K in keyof T]: T[K] extends z.ZodSchema ? z.infer<T[K]>
    : T[K] extends Record<string, unknown> ? JordInferConfig<T[K]>
    : T[K];
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
