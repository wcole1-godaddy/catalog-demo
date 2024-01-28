import { GDStack, GDStackProps } from "@gd-safeguard/godaddy-constructs";
import {
  aws_events,
  aws_events_targets,
  aws_lambda,
  aws_sqs,
} from "aws-cdk-lib";
import { Construct } from "constructs";

interface EventRuleStackProps extends GDStackProps {
  prefix: string;
  suffix?: string;
  eventBus: aws_events.EventBus;
  lambdaFunction?: aws_lambda.Function | null;
  source: string;
}

export class EventRuleStack extends GDStack {
  public readonly rule: aws_events.Rule;
  public readonly deadLetterQueue: aws_sqs.Queue | null = null;

  constructor(scope: Construct, id: string, props: EventRuleStackProps) {
    super(scope, id, props);

    const { prefix, suffix, source } = props;

    this.rule = new aws_events.Rule(
      this,
      `${prefix}-event-rule${suffix ? `-${suffix}` : ""}`,
      {
        eventBus: props.eventBus,
        eventPattern: {
          source: [source],
        },
      }
    );

    this.deadLetterQueue = new aws_sqs.Queue(
      this,
      `${prefix}-event-rule-dead-letter-queue${suffix ? `-${suffix}` : ""}`,
      {
        queueName: `${prefix}-event-rule-dead-letter-queue${
          suffix ? `-${suffix}` : ""
        }`,
      }
    );

    if (props.lambdaFunction) {
      this.rule.addTarget(
        new aws_events_targets.LambdaFunction(props.lambdaFunction, {
          retryAttempts: 3,
          deadLetterQueue: this.deadLetterQueue,
        })
      );
    }
  }
}
