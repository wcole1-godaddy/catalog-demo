import { GDStack, GDStackProps } from "@gd-safeguard/godaddy-constructs";
import { aws_events } from "aws-cdk-lib";
import { Construct } from "constructs";

interface EventBusStackProps extends GDStackProps {
  prefix: string;
}

export class EventBusStack extends GDStack {
  public readonly eventBus: aws_events.EventBus;

  constructor(scope: Construct, id: string, props: EventBusStackProps) {
    super(scope, id, props);

    const { prefix } = props;

    this.eventBus = new aws_events.EventBus(this, `${prefix}-event-bus`, {
      eventBusName: `${prefix}-event-bus`,
    });
  }
}
