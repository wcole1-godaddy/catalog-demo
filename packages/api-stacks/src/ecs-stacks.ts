import { FargateAutoScaling } from "./constructs/ecs/FargateAutoScaling";
import { FargateLoadBalancer } from "./constructs/ecs/FargateLoadBalancer";
import { FargateRotator } from "./constructs/ecs/FargateRotator";
import { FargateService } from "./constructs/ecs/FargateService";
import { GDStack, GDStackProps } from "@gd-safeguard/godaddy-constructs";
import { aws_ecr, aws_ecs } from "aws-cdk-lib";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { Construct } from "constructs";

interface EcsStacksProps extends GDStackProps {
  prefix: string;
  repository: aws_ecr.Repository;
}

export class EcsStacks extends GDStack {
  constructor(scope: Construct, id: string, props: EcsStacksProps) {
    super(scope, id, props);

    const { prefix } = props;

    const certificate = Certificate.fromCertificateArn(
      this,
      `${props.prefix}-ecs-certificate`,
      "arn:aws:acm:us-west-2:166610760322:certificate/cf37fa20-8629-485b-9174-d1d9e1e939e3",
    );

    const cluster = new aws_ecs.Cluster(this, `${prefix}-cluster`, {
      clusterName: `${prefix}-cluster`,
      vpc: this.gdTrustedLandingZone.networking.vpc,
    });

    const serviceStack = new FargateService(this, `${prefix}-service`, {
      prefix,
      cluster: cluster,
      repository: props.repository,
    });

    new FargateLoadBalancer(this, `${prefix}-load-balancer`, {
      prefix,
      service: serviceStack.service,
      certificate: certificate,
    });

    const autoScaling = new FargateAutoScaling(this, `${prefix}-auto-scaling`, {
      prefix,
      clusterName: `${prefix}-cluster`,
      serviceName: `${props.prefix}-srvc`,
    });
    autoScaling.node.addDependency(serviceStack.service);

    new FargateRotator(this, `${prefix}-rotator`, {
      prefix,
      clusterName: `${prefix}-cluster`,
      serviceName: `${prefix}-srvc`,
    });
  }
}
