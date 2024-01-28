import { GDStack } from "@gd-safeguard/godaddy-constructs";
import { Stack } from "aws-cdk-lib";
import { IVpc } from "aws-cdk-lib/aws-ec2";
import { ICluster, Cluster } from "aws-cdk-lib/aws-ecs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export interface FargateClusterProps extends ConfigurableFargateClusterProps {}

export interface ConfigurableFargateClusterProps {
  /**
   * Parameter name for the cluster ARN
   * @default /Ecs/ClusterArn
   */
  clusterArnParameterName?: string;
  /**
   * Name of the cluster
   */
  clusterName: string;
}

export class FargateCluster extends Construct {
  cluster: ICluster;
  clusterArn: string;
  vpc: IVpc;

  constructor(scope: Construct, id: string, props: FargateClusterProps) {
    super(scope, id);

    const stack = Stack.of(this) as GDStack;
    this.vpc = stack.gdTrustedLandingZone.networking.vpc;
    this.setupCluster(props);

    this.clusterArn = this.cluster.clusterArn;
  }

  setupCluster(props: FargateClusterProps) {
    this.cluster = new Cluster(this, "Cluster", {
      clusterName: props?.clusterName ?? "EcsPatternsWithFargate",
      enableFargateCapacityProviders: true,
      containerInsights: true,
      vpc: this.vpc,
    });
    this.clusterArn = this.cluster.clusterArn;
    new StringParameter(this, "ClusterArnParameter", {
      parameterName: props.clusterArnParameterName ?? "/Ecs/ClusterArn",
      stringValue: this.cluster.clusterArn,
    });
  }
}
