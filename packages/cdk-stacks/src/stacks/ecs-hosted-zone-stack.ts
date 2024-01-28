import {
  EcsHostedZoneConstruct,
  EcsHostedZoneConstructProps,
} from "../constructs/ecs-hosted-zone-construct";
import { GDStack } from "@gd-safeguard/godaddy-constructs";
import { CfnOutput, Fn } from "aws-cdk-lib";
import { Construct } from "constructs";

interface EcsHostedZoneStackProps extends EcsHostedZoneConstructProps {
  prefix: string;
}

export class EcsHostedZoneStack extends GDStack {
  public readonly hostedZone: EcsHostedZoneConstruct;

  constructor(scope: Construct, id: string, props: EcsHostedZoneStackProps) {
    super(scope, id, props || {});

    const { prefix } = props;

    this.hostedZone = new EcsHostedZoneConstruct(
      this,
      `${prefix}-ecs-hosted-zone`,
      props
    );

    new CfnOutput(this, "HostedZoneId", {
      value: this.hostedZone.hostedZone.hostedZoneId,
    });

    new CfnOutput(this, "HostedZoneNameServers", {
      value: Fn.join(
        ",",
        this.hostedZone.hostedZone.hostedZoneNameServers || []
      ),
    });
  }
}
