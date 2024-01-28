import { GDStack, GDStackProps } from "@gd-safeguard/godaddy-constructs";
import {
  aws_lambda,
  aws_iam,
  aws_lambda_nodejs,
  aws_kms,
  aws_secretsmanager,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import path, { join } from "path";

interface NodeLambdaFunctionStackProps extends GDStackProps {
  prefix: string;
  pathToCode: string;
  secretName?: string;
  secretKeys?: Array<string>;
}

export class NodeLambdaFunctionStack extends GDStack {
  private readonly secret?: aws_secretsmanager.ISecret | null = null;
  public readonly lambdaFunction?: aws_lambda_nodejs.NodejsFunction | null =
    null;

  constructor(
    scope: Construct,
    id: string,
    props: NodeLambdaFunctionStackProps
  ) {
    super(scope, id, props);

    const { pathToCode, prefix } = props;

    if (props?.secretName)
      this.secret = aws_secretsmanager.Secret.fromSecretNameV2(
        this,
        `${prefix}-secret`,
        props?.secretName
      );

    const lambdaPolicy = new aws_iam.Policy(this, "Policy", {
      policyName: `${prefix}-node-lambda-policy`,
      statements: [
        new aws_iam.PolicyStatement({
          effect: aws_iam.Effect.ALLOW,
          actions: ["logs:*"],
          resources: ["*"],
        }),
        new aws_iam.PolicyStatement({
          effect: aws_iam.Effect.ALLOW,
          actions: ["ssm:*"],
          resources: ["*"],
        }),
        new aws_iam.PolicyStatement({
          effect: aws_iam.Effect.ALLOW,
          actions: ["textract:*"],
          resources: ["*"],
        }),
        new aws_iam.PolicyStatement({
          effect: aws_iam.Effect.ALLOW,
          actions: ["s3:*"],
          resources: ["*"],
        }),
      ],
    });

    const managedPolicy = aws_iam.ManagedPolicy.fromManagedPolicyArn(
      this,
      `${prefix}-managed-policy`,
      "arn:aws:iam::761615930507:policy/GD-AWS-SSG-PB-AI-ASSISTANT-API"
    );

    const lambdaRole = new aws_iam.Role(this, "Role", {
      roleName: `${prefix}-node-lambda-role`,
      assumedBy: new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
      description: `Node Lambda Function Role - ${prefix}`,
    });
    lambdaRole.attachInlinePolicy(lambdaPolicy);
    aws_iam.PermissionsBoundary.of(lambdaRole).apply(managedPolicy);

    // const privateDxSubnets = aws_ssm.StringParameter.valueFromLookup(
    //   this,
    //   "/AdminParams/VPC/DxAppSubnets"
    // ).split(",");

    this.lambdaFunction = new aws_lambda_nodejs.NodejsFunction(
      this,
      `${prefix}-node-lambda-function`,
      {
        role: lambdaRole,
        runtime: aws_lambda.Runtime.NODEJS_18_X,
        entry: join(path.dirname(__dirname), pathToCode),
        handler: "handler",
        architecture: aws_lambda.Architecture.ARM_64,
        memorySize: 1024,
        // securityGroups: [
        //   aws_ec2.SecurityGroup.fromLookupByName(
        //     this,
        //     "APILambdaSecurityGroup",
        //     "secgroup-private",
        //     this.gdTrustedLandingZone.networking.vpc
        //   ),
        // ],
        // vpcSubnets: this.gdTrustedLandingZone.networking.vpc.selectSubnets({
        //   subnetFilters: [aws_ec2.SubnetFilter.byIds(privateDxSubnets)],
        // }),
        // vpc: this.gdTrustedLandingZone.networking.vpc,
        environment: {
          ...props?.secretKeys?.reduce((acc, curr) => {
            return {
              ...acc,
              [curr]: this.secret?.secretValueFromJson(curr).unsafeUnwrap(),
            };
          }, {}),
        },
      }
    );

    const kmsKey = aws_kms.Key.fromKeyArn(
      this,
      "KmsKeyLookup",
      this.gdTrustedLandingZone.accountInfo.kms.cmkArn
    );
    kmsKey.grantEncryptDecrypt(this.lambdaFunction.grantPrincipal);
  }
}
