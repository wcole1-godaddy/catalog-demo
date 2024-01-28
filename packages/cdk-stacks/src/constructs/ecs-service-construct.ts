import { ssmStringParameterLookup } from "../utils";
import { GDStackProps } from "@gd-safeguard/godaddy-constructs";
import { Aws, CfnParameter, Duration, Lazy, Stack } from "aws-cdk-lib";
import {
  AdjustmentType,
  MetricAggregationType,
} from "aws-cdk-lib/aws-applicationautoscaling";
import { AutoScalingGroup } from "aws-cdk-lib/aws-autoscaling";
import { Certificate, ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { IVpc, Subnet, Vpc } from "aws-cdk-lib/aws-ec2";
import aws_ecr from "aws-cdk-lib/aws-ecr";
import {
  AsgCapacityProvider,
  AwsLogDriver,
  Cluster,
  ContainerDefinitionOptions,
  ContainerImage,
  CpuArchitecture,
  DeploymentControllerType,
  FargateTaskDefinition,
  ICluster,
  OperatingSystemFamily,
  Protocol,
  ScalableTaskCount,
} from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import {
  ApplicationProtocol,
  SslPolicy,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export interface EcsServiceConstructProps extends GDStackProps {
  prefix: string;
  clusterName: string;
  serviceName: string;
  certificateArn: string;
  delegatedHostName: string;
  delegatedHostedZoneName: string;
  hostName: string;
  healthCheckPath: string;
  repositoryName: string;
  port: number;
  taskSubnetParameterName?: string;
  clusterArn: string;
  clusterArnParameterName?: string;
  environment?: Record<string, string>;
}

export class EcsServiceConstruct extends Construct {
  private cluster: ICluster;
  private certificate: ICertificate;
  private service: ecsPatterns.ApplicationLoadBalancedFargateService;
  private autoScaling: ScalableTaskCount;
  private logDriver: AwsLogDriver;
  private taskDefinition: FargateTaskDefinition;
  private vpcId: string;
  private subnetIds: string[];
  private vpc: IVpc;
  private ec2AutoScalingGroup: AutoScalingGroup;
  private capacityProvider: AsgCapacityProvider;
  private serviceRepository: aws_ecr.IRepository;
  private clusterArn: string;

  constructor(scope: Construct, id: string, props: EcsServiceConstructProps) {
    super(scope, id);

    this.subnetIds = StringParameter.valueFromLookup(
      this,
      props.taskSubnetParameterName || "/AdminParams/VPC/DXAPPSubnets"
    ).split(",");

    this.vpcId = StringParameter.valueFromLookup(this, "/AdminParams/VPC/ID");

    // https://github.com/aws/aws-cdk/issues/7051
    this.clusterArn = ssmStringParameterLookup(
      this,
      props?.clusterArnParameterName || `/Ecs/${props.clusterName}/ClusterArn`,
      Stack.of(this).formatArn({
        service: "ecs",
        resource: "cluster",
        resourceName: props.clusterName,
      })
    );

    this.vpc = Vpc.fromLookup(this, "VPC", {
      vpcId: this.vpcId,
    });

    const cluster = Cluster.fromClusterArn(this, "ClusterTmp", this.clusterArn);
    this.cluster = Cluster.fromClusterAttributes(this, "Cluster", {
      clusterName: cluster.clusterName,
      clusterArn: cluster.clusterArn,
      vpc: this.vpc,
      securityGroups: [],
    });

    this.logDriver = new AwsLogDriver({ streamPrefix: `${props.prefix}-ecs` });

    this.setupTaskDefinition(props);
    this.setupService(props);
    this.setupAutoScaling();
    this.setupLoadBalancer(props);
  }

  setupService(props: EcsServiceConstructProps) {
    this.certificate = Certificate.fromCertificateArn(
      this,
      `${props.prefix}-ecs-certificate`,
      props.certificateArn
    );

    // https://docs.aws.amazon.com/cdk/api/v1/docs/aws-ecs-patterns-readme.html
    this.service = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      "Service",
      {
        cluster: this.cluster,
        certificate: this.certificate,
        sslPolicy: SslPolicy.TLS12,
        targetProtocol: ApplicationProtocol.HTTPS,
        redirectHTTP: true,
        deploymentController: {
          type: DeploymentControllerType.ECS,
        },
        // https://cto-guidelines.gd3p.tools/Architectural-Design-Pattern/pattern/InternalCloudDomain.html
        // domainName: props.delegatedHostName,
        // domainZone: HostedZone.fromLookup(this, "Zone", {
        //   domainName: props.delegatedHostedZoneName,
        //   privateZone: false,
        // }),
        desiredCount: 1,
        taskDefinition: this.taskDefinition,
        minHealthyPercent: 100,
        maxHealthyPercent: 200,
        assignPublicIp: false,
        taskSubnets: {
          subnets: this.subnetIds.map((subnetId) =>
            Subnet.fromSubnetId(this, `subnet-${subnetId}`, subnetId)
          ),
        },
        circuitBreaker: { rollback: true },
      }
    );
  }

  setupAutoScaling() {
    this.autoScaling = this.service.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 20,
    });

    this.autoScaling.scaleOnMetric("CpuScaling", {
      metric: this.service.service.metricCpuUtilization({
        statistic: "Average",
        period: Duration.minutes(1),
      }),
      adjustmentType: AdjustmentType.CHANGE_IN_CAPACITY,
      scalingSteps: [
        { upper: 40, change: -1 },
        { lower: 80, change: +1 },
      ],
      datapointsToAlarm: 1,
      evaluationPeriods: 1,
      metricAggregationType: MetricAggregationType.AVERAGE,
      cooldown: Duration.seconds(60),
    });
  }

  setupLoadBalancer(props: EcsServiceConstructProps) {
    this.service.targetGroup.configureHealthCheck({
      path: props.healthCheckPath,
    });

    this.service.targetGroup.setAttribute(
      "deregistration_delay.timeout_seconds",
      "30"
    );
  }

  setupTaskDefinition(props: EcsServiceConstructProps) {
    this.serviceRepository = aws_ecr.Repository.fromRepositoryName(
      this,
      `${props.prefix}-ecs-repository`,
      props.repositoryName
    );

    const serviceTaskContainer: ContainerDefinitionOptions = {
      containerName: props.serviceName,
      cpu: 256,
      environment: props.environment || {},
      essential: true,
      healthCheck: {
        command: [
          "CMD-SHELL",
          `curl -f http://localhost:${props.port}/health || exit 1`,
        ],
        interval: Duration.seconds(5),
        timeout: Duration.seconds(3),
        retries: 3,
        startPeriod: Duration.seconds(5),
      },
      image: ContainerImage.fromEcrRepository(this.serviceRepository, "latest"),
      logging: this.logDriver,
      memoryLimitMiB: 512,
      memoryReservationMiB: 512,
      portMappings: [
        {
          name: props.serviceName,
          containerPort: props.port,
          protocol: Protocol.TCP,
        },
      ],
      startTimeout: Duration.seconds(5),
      stopTimeout: Duration.seconds(5),
    };

    this.taskDefinition = new FargateTaskDefinition(this, "TaskDef", {
      cpu: serviceTaskContainer.cpu || 256,
      memoryLimitMiB: serviceTaskContainer.memoryLimitMiB || 512,
      runtimePlatform: {
        cpuArchitecture: CpuArchitecture.X86_64,
        operatingSystemFamily: OperatingSystemFamily.LINUX,
      },
    });

    // https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html
    this.taskDefinition.addContainer(props.serviceName, serviceTaskContainer);
  }

  setupLogging(props: EcsServiceConstructProps) {}
}
