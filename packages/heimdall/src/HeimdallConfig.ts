import fg, { type Pattern } from "fast-glob";
import process from "node:process";
import path from "node:path";
import {
  HeimdallEndpoint,
  type HeimdallPath,
  type HeimdallRoute,
} from "./HeimdallEndpoint.ts";

import fs from "node:fs/promises";

import groupBy from "lodash.groupby";

export class HeimdallConfig {
  private routes: Pattern[];
  private root: string;
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

  static async createAWSHandlersFromEndpoints<TPath extends HeimdallPath>(
    endpoints: HeimdallEndpoint<TPath>[],
  ): Promise<Handler[]> {
    const groupedEndpoints = groupBy(
      endpoints,
      (endpoint) => endpoint._handlerPath?.split("#")[0],
    );

    const handlers: Handler[] = [];
    const projectRoot = await HeimdallConfig.getProjectRoot(process.cwd());

    const groupedEndpointsKeys = Object.keys(groupedEndpoints);

    for await (const group of groupedEndpointsKeys) {
      const relativePath = path.relative(
        projectRoot,
        group,
      );
      const groupEndpoints = groupedEndpoints[group];
      const parts = group.split("/");
      const file = parts.pop() || "";
      const [name, ext] = file.split(".");
      const newFileName = `${name}.aws.${ext}`;
      const newFilePath = [...parts, newFileName].join("/");
      const imports = groupEndpoints.map((endpoint) => {
        const name = endpoint._handlerPath?.split("#")[1] as string;

        return {
          name,
          handler: relativePath.replace(`.${ext}`, `.${name}AWSHandler`),
          route: endpoint.route.replace(
            /\[([^\]]+)\]/g,
            "{$1}",
          ).replace(/:([\w\d_-]+)/g, "{$1}") as HeimdallRoute<HeimdallPath>,
        };
      });

      handlers.push(...imports);

      const names = imports.map((endpoint) => endpoint.name);
      const fileContent = [
        'import { HeimdallAWSAPIGatewayV2Handler } from "@asgard/heimdall/aws"',
        `import { ${names.join(", ")} } from "./${file}"`,
        "",
        names.map((endpoint) => {
          return `export const ${endpoint}AWSHandler = new HeimdallAWSAPIGatewayV2Handler(${endpoint}).handler;`;
        }).join("\n"),
      ];

      await fs.writeFile(newFilePath, fileContent.join("\n"));
    }

    return handlers;
  }

  private async getEndpointFromFile(f: string) {
    const file = await import(f);

    const exportNames = Object.keys(file);

    return exportNames.reduce(
      (acc: HeimdallEndpoint<HeimdallPath>[], e) => {
        const fileExport = file[e];

        if ((fileExport instanceof HeimdallEndpoint)) {
          // const relativePath = path.relative(root, f);

          fileExport._handlerPath = `${f}#${e}`;
          acc.push(fileExport);
        }

        return acc;
      },
      [],
    );
  }

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
  async getEndpoints(): Promise<
    Map<HeimdallRoute<HeimdallPath>, HeimdallEndpoint<HeimdallPath>>
  > {
    const files = fg.stream(this.routes, { dot: true, cwd: this.root });

    const endpoints: Map<
      HeimdallRoute<HeimdallPath>,
      HeimdallEndpoint<HeimdallPath>
    > = new Map();

    for await (const f of files) {
      const p = path.join(this.root, f.toString());
      const endpointsFromFile = await this.getEndpointFromFile(
        p,
      );
      // @T
      endpointsFromFile.forEach((e) => {
        if (endpoints.has(e.route)) {
          throw new Error(
            `Duplicate route found: ${e.route}. Please check your routes at ${p}.`,
          );
        }
        endpoints.set(e.route, e);
      });
    }

    return endpoints;
  }

  constructor({ root, routes }: HeimdallConfigOptions) {
    this.routes = routes;
    this.root = root;
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
