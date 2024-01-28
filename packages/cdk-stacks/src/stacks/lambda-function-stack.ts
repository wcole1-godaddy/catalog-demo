import { getGoDaddyApiHost } from "../utils";
import { GDStack, GDStackProps } from "@gd-safeguard/godaddy-constructs";
import {
  aws_ecr,
  aws_lambda,
  aws_secretsmanager,
  aws_dynamodb,
  aws_elasticsearch,
  aws_ssm,
  aws_ec2,
  aws_kms,
} from "aws-cdk-lib";
import { Construct } from "constructs";

interface LambdaFunctionStackProps extends GDStackProps {
  prefix: string;
  functionName: string;
  ecrRepository: aws_ecr.Repository;
  ecrContainsImages: boolean;
  dynamoDbTable?: aws_dynamodb.Table;
  elasticSearchDomain?: aws_elasticsearch.Domain;
  secretName?: string;
  secretKeys?: string[];
  environment?: Record<string, string>;
}

export class LambdaFunctionStack extends GDStack {
  public readonly lambdaFunction?: aws_lambda.Function | null = null;
  private readonly secret?: aws_secretsmanager.ISecret | null = null;
  private subnetIds: string[];

  constructor(scope: Construct, id: string, props: LambdaFunctionStackProps) {
    super(scope, id, props);

    const { prefix, environment, functionName } = props;

    const awsEnv = aws_ssm.StringParameter.valueFromLookup(
      this,
      "/AdminParams/Team/Environment"
    ) as "dev" | "test" | "ote" | "prod";

    this.subnetIds = aws_ssm.StringParameter.valueFromLookup(
      this,
      "/AdminParams/VPC/DXAPPSubnets"
    ).split(",");

    if (props.secretName) {
      this.secret = aws_secretsmanager.Secret.fromSecretNameV2(
        this,
        `${prefix}-secret`,
        props.secretName
      );
    }

    if (props.ecrContainsImages) {
      this.lambdaFunction = new aws_lambda.DockerImageFunction(
        this,
        `${prefix}-lambda-function`,
        {
          functionName,
          code: aws_lambda.DockerImageCode.fromEcr(props.ecrRepository),
          memorySize: 1028,
          vpc: this.gdTrustedLandingZone.networking.vpc,
          vpcSubnets: this.gdTrustedLandingZone.networking.vpc.selectSubnets({
            subnetFilters: [aws_ec2.SubnetFilter.byIds(this.subnetIds)],
          }),
          environment: {
            JWKS_ENDPOINT: `${getGoDaddyApiHost(awsEnv)}/v2/oauth2/jwks`,
            ...environment,
            ...props?.secretKeys?.reduce((acc, curr) => {
              return {
                ...acc,
                [curr]: this.secret?.secretValueFromJson(curr).unsafeUnwrap(),
              };
            }, {}),
          },
        }
      );
      this.lambdaFunction.node.addDependency(props.ecrRepository);

      const kmsKey = aws_kms.Key.fromKeyArn(
        this,
        "KmsKeyLookup",
        this.gdTrustedLandingZone.accountInfo.kms.cmkArn
      );
      kmsKey.grantEncryptDecrypt(this.lambdaFunction.grantPrincipal);

      if (props?.dynamoDbTable) {
        props.dynamoDbTable.grantReadWriteData(this.lambdaFunction);
      }

      if (props?.elasticSearchDomain) {
        props.elasticSearchDomain.grantReadWrite(this.lambdaFunction);
      }
    }
  }
}
