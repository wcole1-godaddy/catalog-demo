import { EcsStackProps } from "../types";
import { GDStackProps } from "@gd-safeguard/godaddy-constructs";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export interface EcsHostedZoneConstructProps extends GDStackProps {
  delegatedHostedZoneName: string;
}

export class EcsHostedZoneConstruct extends Construct {
  public readonly hostedZone: HostedZone;

  constructor(
    scope: Construct,
    id: string,
    props: EcsHostedZoneConstructProps
  ) {
    super(scope, id);

    this.hostedZone = new HostedZone(this, "HostedZone", {
      zoneName: props.delegatedHostedZoneName,
    });
  }
}
