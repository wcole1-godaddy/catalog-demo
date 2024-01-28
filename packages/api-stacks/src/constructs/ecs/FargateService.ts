import { GDStack, GDStackProps } from "@gd-safeguard/godaddy-constructs";
import { Arn, Duration, Stack } from "aws-cdk-lib";
import {
  aws_ecs as ecs,
  aws_iam as iam,
  aws_ecr as ecr,
  aws_ec2 as ec2,
  aws_elasticloadbalancingv2 as elbv2,
  aws_secretsmanager as sm,
  aws_ssm as ssm,
} from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

interface FargateServiceProps extends GDStackProps {
  prefix: string;
  cluster: ecs.ICluster;
  repository: ecr.Repository;
}

export class FargateService extends Construct {
  public readonly service: ecs.FargateService;
  readonly taskDefinition: ecs.FargateTaskDefinition;
  readonly taskRole: iam.Role;
  readonly executionRole: iam.Role;
  readonly vpc: IVpc;

  constructor(scope: Construct, id: string, props: FargateServiceProps) {
    super(scope, id);

    const stack = Stack.of(this) as GDStack;
    this.vpc = stack.gdTrustedLandingZone.networking.vpc;

    const execPolicy = new iam.Policy(
      stack,
      `${props.prefix}-execution-policy`,
      {
        policyName: `${props.prefix}-execution-policy`,
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              "ecr:GetAuthorizationToken",
              "ecr:BatchGetImage",
              "ecr:GetDownloadUrlForLayer",
            ],
            resources: ["*"],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["logs:*"],
            resources: ["*"],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["ssm:*"],
            resources: ["*"],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["textract:*"],
            resources: ["*"],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["s3:*"],
            resources: ["*"],
          }),
        ],
      },
    );

    this.taskRole = new iam.Role(stack, `${props.prefix}-task-role`, {
      roleName: `${props.prefix}-task-role`,
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [
        { resourceName: "GD-AWS-KMS-USER" },
        { resourceName: "GDDeployRoleAccessPolicy" },
        { resourceName: "AllowResourcesAccessToCloudWatchPolicy" },
      ].map((policy) => ({
        managedPolicyArn: Arn.format(
          {
            service: "iam",
            region: "",
            resource: "policy",
            ...policy,
          },
          stack,
        ),
      })),
    });
    this.taskRole.attachInlinePolicy(execPolicy);

    this.executionRole = new iam.Role(stack, `${props.prefix}-execution-role`, {
      roleName: `${props.prefix}-execution-role`,
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [
        {
          resourceName: "service-role/AmazonECSTaskExecutionRolePolicy",
          account: "aws",
        },
        { resourceName: "GD-AWS-KMS-USER" },
        { resourceName: "AllowResourcesAccessToCloudWatchPolicy" },
      ].map((policy) => ({
        managedPolicyArn: Arn.format(
          {
            service: "iam",
            region: "",
            resource: "policy",
            ...policy,
          },
          stack,
        ),
      })),
    });
    this.executionRole.attachInlinePolicy(execPolicy);

    const securityGroup = ec2.SecurityGroup.fromLookupById(
      stack,
      `${props.prefix}-security-group-service`,
      ssm.StringParameter.valueFromLookup(this, "/AdminParams/VPC/PublicSG"),
    );

    this.taskDefinition = new ecs.FargateTaskDefinition(
      stack,
      `${props.prefix}-task-def`,
      {
        family: `${props.prefix}-task-def`,
        runtimePlatform: { cpuArchitecture: ecs.CpuArchitecture.X86_64 },
        cpu: 256,
        memoryLimitMiB: 512,
        taskRole: this.taskRole,
        executionRole: this.executionRole,
      },
    );

    const secrets = sm.Secret.fromSecretNameV2(
      stack,
      `${props.prefix}-secrets`,
      `ai_assistant_service/secrets`,
    );

    this.taskDefinition.addContainer(`${props.prefix}-container`, {
      containerName: `${props.prefix}-container`,
      cpu: 256,
      memoryLimitMiB: 512,
      memoryReservationMiB: 512,
      environment: {
        NODE_ENV: ssm.StringParameter.valueFromLookup(
          this,
          "/AdminParams/Team/Environment",
        ),
      },
      secrets: {},
      image: ecs.ContainerImage.fromEcrRepository(props.repository),
      portMappings: [
        { containerPort: 4000, hostPort: 4000, protocol: ecs.Protocol.TCP },
      ],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: `${props.prefix}`,
        // multilinePattern: "^(INFO|DEBUG|WARN|Error|ERROR|CRITICAL)",
      }),
    });
    this.taskDefinition.node.addDependency(props.repository);

    const subnetIds = ssm.StringParameter.valueFromLookup(
      this,
      "/AdminParams/VPC/DxAppSubnets/All",
    ).split(",");
    const subnetSelection = {
      subnets: subnetIds.map((subnetId) =>
        ec2.Subnet.fromSubnetId(this, `subnet-${subnetId}`, subnetId),
      ),
    };

    this.service = new ecs.FargateService(stack, `${props.prefix}-srvc`, {
      serviceName: `${props.prefix}-srvc`,
      cluster: props.cluster,
      desiredCount: 2,
      healthCheckGracePeriod: Duration.seconds(5),
      circuitBreaker: { rollback: true },
      securityGroups: [securityGroup],
      taskDefinition: this.taskDefinition,
      vpcSubnets: subnetSelection,
    });

    this.service.node.addDependency(props.cluster);
  }
}
