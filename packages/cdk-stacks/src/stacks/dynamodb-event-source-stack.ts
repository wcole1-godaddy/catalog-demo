import { GDStack, GDStackProps } from "@gd-safeguard/godaddy-constructs";
import {
  aws_dynamodb,
  aws_lambda,
  aws_lambda_event_sources,
  aws_sqs,
} from "aws-cdk-lib";
import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Construct } from "constructs";

interface DynamoDbEventSourceStackProps extends GDStackProps {
  prefix: string;
  dynamoDbTable: aws_dynamodb.Table;
  lambdaFunction?: aws_lambda.Function | null;
}

export class DynamoDbEventSourceStack extends GDStack {
  public readonly dynamoDbEventSource: aws_lambda_event_sources.DynamoEventSource | null =
    null;
  public readonly deadLetterQueue: aws_sqs.Queue | null = null;

  constructor(
    scope: Construct,
    id: string,
    props: DynamoDbEventSourceStackProps
  ) {
    super(scope, id, props);

    const { prefix } = props;

    this.deadLetterQueue = new aws_sqs.Queue(
      this,
      `${prefix}-dynamodb-event-source-dead-letter-queue`,
      {
        queueName: `${prefix}-dynamodb-event-source-dead-letter-queue`,
      }
    );

    if (props.lambdaFunction) {
      props.lambdaFunction.addEventSource(
        new DynamoEventSource(props.dynamoDbTable, {
          startingPosition: aws_lambda.StartingPosition.TRIM_HORIZON,
          batchSize: 1,
          bisectBatchOnError: true,
          retryAttempts: 10,
          onFailure: new aws_lambda_event_sources.SqsDlq(this.deadLetterQueue),
        })
      );
    }
  }
}
