import { GDStack, GDStackProps } from "@gd-safeguard/godaddy-constructs";
import { aws_dynamodb } from "aws-cdk-lib";
import { Construct } from "constructs";

interface DynamoDbTableStackProps extends GDStackProps {
  prefix: string;
  tableName: string;
  numberOfGsis?: number;
}

export class DynamoDbTableStack extends GDStack {
  public readonly dynamoDbTable: aws_dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDbTableStackProps) {
    super(scope, id, props);

    const { prefix, tableName, numberOfGsis = 1 } = props;

    // Create DynamoDB Table
    this.dynamoDbTable = new aws_dynamodb.Table(
      this,
      `${prefix}-dynamodb-table`,
      {
        tableName,
        partitionKey: {
          name: "PK",
          type: aws_dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: "SK",
          type: aws_dynamodb.AttributeType.STRING,
        },
        stream: aws_dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: true,
      }
    );

    // Give me an array from a provided number
    const gsis = Array.from(Array(numberOfGsis).keys());
    for (const gsi of gsis) {
      const index = gsi + 1;
      this.dynamoDbTable.addGlobalSecondaryIndex({
        indexName: `GSI${index}`,
        partitionKey: {
          name: `PK${index}`,
          type: aws_dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: `SK${index}`,
          type: aws_dynamodb.AttributeType.STRING,
        },
        projectionType: aws_dynamodb.ProjectionType.ALL,
      });
    }
  }
}
