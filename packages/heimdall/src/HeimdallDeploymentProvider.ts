import type {
  HeimdallEndpointV2,
  HeimdallPath,
  HeimdallRoute,
} from "./HeimdallEndpointV2.ts";
import fs from "node:fs/promises";
import path from "node:path";

export abstract class HeimdallDeploymentProvider<
  TProvider extends HeimdallDeploymentProvideName,
> {
  /**
   * Normalizes API routes by converting them to a consistent format.
   * Examples:
   * - "GET /user" becomes "get_user"
   * - "POST /user/:id" becomes "post_user_id"
   * - "PUT /products/:productId/reviews/:reviewId" becomes "put_products_productid_reviews_reviewid"
   *
   * @param route - The route to normalize in the format "METHOD /path"
   * @returns The normalized route name
   */
  static normalizeRoute(route: HeimdallRoute<HeimdallPath>): string {
    // Split the route into method and path
    const [method, path] = route.split(" ");

    if (!method || !path) {
      throw new Error('Invalid route format. Expected "METHOD /path"');
    }

    // Convert method to lowercase
    const normalizedMethod = method.toLowerCase();

    // Remove leading slash if present
    const trimmedPath = path.startsWith("/") ? path.substring(1) : path;

    // Replace path parameters (e.g., :id) with just the parameter name (without the colon)
    const pathWithoutColons = trimmedPath.replace(
      /:\w+/g,
      (match) => match.substring(1),
    );

    // Replace slashes with underscores and convert to lowercase
    const normalizedPath = pathWithoutColons.replace(/\//g, "_").toLowerCase();

    // Combine method and path with an underscore
    return `${normalizedMethod}_${normalizedPath}`;
  }
  constructor(
    public readonly provider: TProvider,
  ) {}

  protected abstract getProviderImport(): ProviderImport;
  protected abstract getRoute(route: HeimdallRoute<HeimdallPath>): string;

  static async export<TProvider extends HeimdallDeploymentProvideName>(
    endpoints: HeimdallEndpointV2<HeimdallPath>[],
    provider: TProvider,
    cwd: string,
    providerImport: ProviderImport,
    getRoute: GetProviderRoute,
  ): Promise<void> {
    const parent = path.join(cwd, ".heimdall", provider);
    const handlerPath = path.join(parent, "handlers.ts");
    const handlers: Handler[] = [];

    await fs.mkdir(parent, { recursive: true });
    for await (const e of endpoints) {
      const file = `${HeimdallDeploymentProvider.normalizeRoute(e.route)}.ts`;

      const filePath = path.join(parent, file);
      const generatedFileDir = path.dirname(filePath);
      const importPath = path.relative(generatedFileDir, e.handlerPath);

      const formattedImportPath = importPath.startsWith(".")
        ? importPath
        : `./${importPath}`;
      const name = e.handlerName;
      const parts = filePath.split(".");
      parts.pop();
      const handler = path.relative(cwd, parts.join("."));

      const content = [
        providerImport,
        `import { ${e.handlerName} } from "${formattedImportPath}";`,
        "",
        `export const handler = new Provider(${e.handlerName}).handler;`,
      ].join("\n");

      handlers.push({
        name,
        handler: `${handler}.handler`,
        route: getRoute(e.route),
      });

      await fs.writeFile(filePath, content);
    }

    const helpersContent = `export const handlers = ${
      JSON.stringify(handlers, null, 2)
    } as const;\n`;

    await fs.writeFile(handlerPath, helpersContent, "utf-8");
  }

  export(
    endpoints: HeimdallEndpointV2<HeimdallPath>[],
    cwd: string,
  ): Promise<void> {
    return HeimdallDeploymentProvider.export(
      endpoints,
      this.provider,
      cwd,
      this.getProviderImport(),
      this.getRoute.bind(this),
    );
  }
}

export type HeimdallDeploymentProvideName = "aws-apigatewayv2";
export type CloudProviderName = "aws" | "gcp" | "azure" | "cloudflare";
export type ProviderImport<
  TProvider extends string = string,
  TCloud extends CloudProviderName = CloudProviderName,
> = `import { ${TProvider} as Provider } from '@asgard/heimdall/${TCloud}';`;

export type GetProviderRoute = (route: HeimdallRoute<HeimdallPath>) => string;

type Handler = {
  name: string;
  handler: string;
  route: string;
};
