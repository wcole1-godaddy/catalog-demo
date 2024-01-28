import {
  EcsClusterConstruct,
  EcsClusterConstructProps,
} from "../constructs/ecs-cluster-construct";
import { GDStack } from "@gd-safeguard/godaddy-constructs";
import { CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";

interface EcsClusterStackProps extends EcsClusterConstructProps {
  prefix: string;
}

export class EcsClusterStack extends GDStack {
  public readonly cluster: EcsClusterConstruct;

  constructor(scope: Construct, id: string, props: EcsClusterStackProps) {
    super(scope, id, props || {});

    const { prefix } = props;

    this.cluster = new EcsClusterConstruct(
      this,
      `${prefix}-ecs-cluster`,
      props
    );

    new CfnOutput(this, "ClusterArn", {
      description: "ARN of the ECS cluster",
      value: this.cluster.clusterArn,
    });
  }
}
