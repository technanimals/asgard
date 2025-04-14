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

  static routify(r: string): string {
    if (!r.startsWith("/")) {
      return HeimdallConfig.routify(`/${r}`);
    }

    if (r.endsWith("/")) {
      return HeimdallConfig.routify(r.slice(0, -1));
    }

    return r.toLowerCase();
  }

  private async getEndpointFromFile(f: string) {
    const file = await import(f);

    const exportNames = Object.keys(file);

    return exportNames.reduce(
      (acc: HeimdallEndpoint<HeimdallPath>[], e) => {
        const fileExport = file[e];

        if ((fileExport instanceof HeimdallEndpoint)) {
          acc.push(fileExport);
        }

        return acc;
      },
      [],
    );
  }

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
  routes?: Pattern[];
}

export interface HeimdallConfigOptions {
  routes: Pattern[];
  root: string;
}

export function defineConfig(options: DefineConfigOptions) {
  const { routes = [] } = options;
  const root = process.cwd();

  return new HeimdallConfig({
    routes,
    root,
  });
}
