import { GDStack, GDStackProps } from "@gd-safeguard/godaddy-constructs";
import { aws_elasticsearch, aws_kms } from "aws-cdk-lib";
import { CfnDomain, ElasticsearchVersion } from "aws-cdk-lib/aws-elasticsearch";
import { Construct } from "constructs";

interface ElasticsearchStackProps extends GDStackProps {
  prefix: string;
}

export class ElasticsearchStack extends GDStack {
  public readonly domain: aws_elasticsearch.Domain;

  constructor(scope: Construct, id: string, props: ElasticsearchStackProps) {
    super(scope, id, props);

    const { prefix } = props;

    this.domain = new aws_elasticsearch.Domain(
      this,
      `${prefix}-elasticsearch`,
      {
        domainName: prefix,
        version: ElasticsearchVersion.V7_1,
        capacity: {
          masterNodeInstanceType: "t3.small.elasticsearch",
        },
        logging: {
          slowSearchLogEnabled: true,
          appLogEnabled: true,
          slowIndexLogEnabled: true,
        },
        enforceHttps: true,
        nodeToNodeEncryption: true,
        tlsSecurityPolicy: aws_elasticsearch.TLSSecurityPolicy.TLS_1_2,
        encryptionAtRest: {
          enabled: true,
        },
      }
    );

    const l1Domain = this.domain.node.defaultChild as CfnDomain;

    l1Domain.addPropertyOverride(
      "EncryptionAtRestOptions.KmsKeyId",
      this.gdTrustedLandingZone.accountInfo.kms.cmkAlias
    );
  }
}
