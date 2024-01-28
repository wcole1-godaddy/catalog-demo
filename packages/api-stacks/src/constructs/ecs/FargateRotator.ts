import { GDStack, GDStackProps } from "@gd-safeguard/godaddy-constructs";
import {
  aws_iam as iam,
  aws_lambda as lambda,
  aws_s3 as s3,
  ContextProvider,
  Stack,
  cloud_assembly_schema,
  Aws,
  Duration,
} from "aws-cdk-lib";
import { Rule, RuleTargetInput, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import {
  Effect,
  PolicyDocument,
  PolicyStatement,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Runtime, S3Code } from "aws-cdk-lib/aws-lambda";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

interface FargateRotatorProps extends GDStackProps {
  prefix: string;
  clusterName: string;
  serviceName: string;
}

export class FargateRotator extends Construct {
  private globalBucket: s3.IBucket;

  constructor(scope: Construct, id: string, props: FargateRotatorProps) {
    super(scope, id);

    const stack = Stack.of(this) as GDStack;

    const globalBucketName = ContextProvider.getValue(scope, {
      provider: cloud_assembly_schema.ContextProvider.SSM_PARAMETER_PROVIDER,
      props: {
        parameterName: "/AdminParams/Team/GlobalBucket",
      },
      dummyValue: "dummy",
    }).value;

    this.globalBucket = s3.Bucket.fromBucketName(
      stack,
      `${props.prefix}-global-bucket`,
      globalBucketName
    );

    const lambdaExecutionRole = new iam.Role(
      stack,
      `${props.prefix}-rotator-execution-role`,
      {
        description: "Used by the rotator to rotate the service",
        managedPolicies: [
          {
            managedPolicyArn: `arn:aws:iam::${Aws.ACCOUNT_ID}:policy/AllowResourcesAccessToCloudWatchPolicy`,
          },
        ],
        assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
        inlinePolicies: {
          root: new PolicyDocument({
            statements: [
              new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ["ecs:UpdateService"],
                resources: [
                  `arn:aws:ecs:${Aws.REGION}:${Aws.ACCOUNT_ID}:service/${props.clusterName}/${props.serviceName}`,
                ],
              }),
            ],
          }),
        },
      }
    );

    const lambdaFunction = new lambda.Function(
      stack,
      `${props.prefix}-rotator-function`,
      {
        handler: "ecs_service_rotator.index.handler",
        runtime: Runtime.PYTHON_3_9,
        timeout: Duration.seconds(30),
        role: lambdaExecutionRole,
        code: new S3Code(
          this.globalBucket,
          "ecs/ecs_service_rotator/ecs_service_rotator-2.0.0.zip"
        ),
        logRetention: RetentionDays.ONE_MONTH,
      }
    );

    const scheduleRule = new Rule(stack, `${props.prefix}-rotator-rule`, {
      description: "Rotates the service",
      schedule: Schedule.expression("cron(0 0 * * ? *)"),
      targets: [
        new LambdaFunction(lambdaFunction, {
          event: RuleTargetInput.fromObject({
            cluster: props.clusterName,
            service: props.serviceName,
          }),
        }),
      ],
    });

    lambdaFunction.addPermission("InvokePermission", {
      principal: new ServicePrincipal("events.amazonaws.com"),
      sourceArn: scheduleRule.ruleArn,
      action: "lambda:InvokeFunction",
    });
  }
}
