import { ContextProvider, cloud_assembly_schema } from "aws-cdk-lib";
import { Construct } from "constructs";

export function ssmStringParameterLookup(
  scope: Construct,
  parameterName: string,
  dummyValue: string,
): string {
  return ContextProvider.getValue(scope, {
    provider: cloud_assembly_schema.ContextProvider.SSM_PARAMETER_PROVIDER,
    props: {
      parameterName,
    },
    dummyValue: dummyValue,
  }).value;
}

const EnvDomains = {
  dev: "dev-godaddy",
  test: "test-godaddy",
  ote: "ote-godaddy",
  prod: "godaddy",
};

export function getGoDaddyApiHost(
  environment: "dev" | "test" | "ote" | "prod",
  includeProtocol = true,
) {
  return includeProtocol
    ? (`https://api.${EnvDomains[environment]}.com` as const)
    : (`api.${EnvDomains[environment]}.com` as const);
}
