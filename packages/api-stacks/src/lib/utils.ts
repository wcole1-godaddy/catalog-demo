import { ContextProvider, cloud_assembly_schema } from "aws-cdk-lib";
import { Construct } from "constructs";

export function ssmStringParameterLookup(
  scope: Construct,
  parameterName: string,
  dummyValue: string
): string {
  return ContextProvider.getValue(scope, {
    provider: cloud_assembly_schema.ContextProvider.SSM_PARAMETER_PROVIDER,
    props: {
      parameterName,
    },
    dummyValue: dummyValue,
  }).value;
}
