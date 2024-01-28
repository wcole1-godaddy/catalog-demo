import { GDStackProps } from "@gd-safeguard/godaddy-constructs";
import { IVpc, Vpc } from "aws-cdk-lib/aws-ec2";
import { ICluster, Cluster } from "aws-cdk-lib/aws-ecs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

export interface EcsClusterConstructProps extends GDStackProps {
  clusterName: string;
  clusterArnParameterName?: string;
}

export class EcsClusterConstruct extends Construct {
  private vpcId: string;
  private vpc: IVpc;
  public readonly cluster: ICluster;
  public readonly clusterArn: string;

  constructor(scope: Construct, id: string, props: EcsClusterConstructProps) {
    super(scope, id);

    this.vpcId = StringParameter.valueFromLookup(this, "/AdminParams/VPC/ID");

    this.vpc = Vpc.fromLookup(this, "VPC", {
      vpcId: this.vpcId,
    });

    this.cluster = new Cluster(this, "Cluster", {
      clusterName: props.clusterName,
      enableFargateCapacityProviders: true,
      containerInsights: true,
      vpc: this.vpc,
    });

    new StringParameter(this, "ClusterArnParameter", {
      parameterName: `/Ecs/${props.clusterName}/ClusterArn`,
      stringValue: this.cluster.clusterArn,
    });

    this.clusterArn = this.cluster.clusterArn;
  }
}
