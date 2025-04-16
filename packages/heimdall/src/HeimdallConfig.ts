import fg, { type Pattern } from "fast-glob";
import process from "node:process";
import path from "node:path";
import {
  HeimdallEndpoint,
  type HeimdallPath,
  type HeimdallRoute,
} from "./HeimdallEndpoint.ts";

export class HeimdallConfig {
  private routes: Pattern[];
  private root: string;
  private throwOnDuplicate: boolean;
  /**
   * Routifies a route by ensuring it starts with a `/` and ends without one.
   * @example `user/profile` -> `/user/profile` and `user/profile/` -> `/user/profile`
   *
   * @param r - The route to routify.
   * @returns - The routified route.
   */
  static routify(r: string): string {
    if (!r.startsWith("/")) {
      return HeimdallConfig.routify(`/${r}`);
    }

    if (r.endsWith("/")) {
      return HeimdallConfig.routify(r.slice(0, -1));
    }

    return r.toLowerCase();
  }

  /**
   * Retrieves all endpoints from a file by importing it and checking for instances of HeimdallEndpoint.
   *
   * @param f - The file path to import.
   * @returns - An array of HeimdallEndpoint instances found in the file.
   */
  static async getEndpointFromFile(
    f: string,
  ): Promise<HeimdallEndpoint<HeimdallPath>[]> {
    console.log("Importing file: ", f);
    const file = await import(f);

    const exportNames = Object.keys(file);

    console.log("Export names:", exportNames);

    const endpoints = exportNames.reduce(
      (acc: HeimdallEndpoint<HeimdallPath>[], e) => {
        const fileExport = file[e];

        if (HeimdallEndpoint.isEndpoint(fileExport)) {
          console.log("Found endpoint: ", fileExport.route);
          // const relativePath = path.relative(root, f);

          fileExport._handlerPath = `${f}#${e}`;
          acc.push(fileExport);
        } else {
          console.log(`${e} is not an endpoint:`);
        }

        return acc;
      },
      [],
    );

    console.log(`Found: ${endpoints.length} in ${f}`);

    return endpoints;
  }
  /**
   * Recursively retrieves the project root by checking for the presence of lock files.
   *
   * @param cwd - The current working directory.
   * @returns - The project root directory.
   */
  static async getProjectRoot(cwd: string): Promise<string> {
    if (cwd === "/") {
      return cwd;
    }

    const stream = fg.stream(
      ["yarn.lock", "pnpm-lock.yaml", "package-lock.json", "deno.lock"],
      { dot: true, cwd },
    );

    let isRoot = false;

    for await (const _ of stream) {
      isRoot = true;
      break;
    }

    if (isRoot) {
      return cwd;
    }

    return HeimdallConfig.getProjectRoot(path.resolve(cwd, ".."));
  }
  /**
   *  Retrieves all endpoints from the specified routes, all exports of instances of HeimdallEndpoint
   *  in the files matching the routes.
   *
   * @returns - A map of endpoints with their routes as keys.
   */
  static async getEndpoints(
    routes: Pattern[],
    cwd: string,
    throwOnDuplicate = true,
  ): Promise<Map<HeimdallRoute<HeimdallPath>, HeimdallEndpoint<HeimdallPath>>> {
    const files = fg.stream(routes, { dot: true, cwd });

    const endpoints: Map<
      HeimdallRoute<HeimdallPath>,
      HeimdallEndpoint<HeimdallPath>
    > = new Map();

    for await (const f of files) {
      const p = path.join(cwd, f.toString());
      const endpointsFromFile = await HeimdallConfig.getEndpointFromFile(p);

      for (const e of endpointsFromFile) {
        const existing = endpoints.get(e.route);
        if (e === existing) {
          console.warn("Duplicate endpoint found: ", e.route);
          continue;
        }

        if (!existing) {
          console.log("Adding endpoint: ", e.route);
          endpoints.set(e.route, e);
          continue;
        }

        const message =
          `Duplicate endpoint found: ${e.route} in ${f} and ${existing._handlerPath}`;
        if (throwOnDuplicate) {
          throw new Error(message);
        }

        console.warn(message);
      }
    }

    return endpoints;
  }

  constructor({
    root,
    routes,
    throwOnDuplicate = true,
  }: HeimdallConfigOptions) {
    this.routes = routes;
    this.root = root;
    this.throwOnDuplicate = throwOnDuplicate;
  }
  /**
   * Retrieves all endpoints from the specified routes, all exports of instances of HeimdallEndpoint
   *
   * @returns - A map of endpoints with their routes as keys.
   */
  getEndpoints(): Promise<
    Map<HeimdallRoute<HeimdallPath>, HeimdallEndpoint<HeimdallPath>>
  > {
    return HeimdallConfig.getEndpoints(
      this.routes,
      this.root,
      this.throwOnDuplicate,
    );
  }
}

export interface DefineConfigOptions {
  /**
   *  The routes to search for endpoints in the project.
   */
  routes?: Pattern[];
}

export interface HeimdallConfigOptions {
  /**
   * The routes to search for endpoints in the project.
   */
  routes: Pattern[];
  /**
   *  The root directory of the project.
   */
  root: string;
  /**
   *  Whether to throw an error if a duplicate endpoint is found.
   */
  throwOnDuplicate?: boolean;
}
/**
 * Defines the Heimdall config.
 *
 * @param options - The options for the config.
 * @returns The config object.
 */
export function defineConfig(options: DefineConfigOptions): HeimdallConfig {
  const { routes = [] } = options;
  const root = process.cwd();

  return new HeimdallConfig({
    routes,
    root,
  });
}

interface Handler {
  name: string;
  handler: string;
  route: HeimdallRoute<HeimdallPath>;
}
