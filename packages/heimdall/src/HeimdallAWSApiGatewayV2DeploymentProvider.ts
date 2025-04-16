import {
  HeimdallDeploymentProvider,
  type ProviderImport,
} from "./HeimdallDeploymentProvider.ts";
import { HeimdallPath, HeimdallRoute } from "./HeimdallEndpoint.ts";

export class HeimdallAWSApiGatewayV2DeploymentProvider
  extends HeimdallDeploymentProvider<"aws-apigatewayv2"> {
  constructor() {
    super("aws-apigatewayv2");
  }

  protected getRoute(route: HeimdallRoute<HeimdallPath>): string {
    return route.replace(/:([^/]+)/g, "{$1}");
  }

  protected override getProviderImport(): ProviderImport {
    return `import { HeimdallAWSAPIGatewayV2Handler as Provider } from '@asgard/heimdall/aws';`;
  }
}
