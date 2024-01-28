import { GDStack, GDStackProps } from "@gd-safeguard/godaddy-constructs";
import {
  aws_s3 as s3,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
  aws_certificatemanager as cm,
  aws_ssm as ssm,
  aws_wafv2 as wafv2,
  aws_iam as iam,
} from "aws-cdk-lib";
import { Construct } from "constructs";

interface TerminalStacksProps extends GDStackProps {
  prefix: string;
}

export class TerminalStacks extends GDStack {
  constructor(scope: Construct, id: string, props: TerminalStacksProps) {
    super(scope, id, props);

    const { prefix } = props;

    const bucket = new s3.Bucket(this, `${prefix}-bucket`, {
      bucketName: "gd-commerceut-ai-assistant-api",
      accessControl: s3.BucketAccessControl.PRIVATE,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const webAcl = new wafv2.CfnWebACL(this, `${prefix}-waf`, {
      defaultAction: {
        allow: {},
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "MetricForWebACLCDK",
        sampledRequestsEnabled: true,
      },
      scope: "CLOUDFRONT",
      name: `${prefix}-web-acl`,
      rules: [
        {
          name: "CRSRule",
          priority: 0,
          statement: {
            managedRuleGroupStatement: {
              name: "AWSManagedRulesCommonRuleSet",
              vendorName: "AWS",
              excludedRules: [
                {
                  name: "SizeRestrictions_QUERYSTRING",
                },
              ],
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "MetricForWebACLCDK-CRS",
            sampledRequestsEnabled: true,
          },
          overrideAction: {
            none: {},
          },
        },
      ],
    });

    const originAccessControl = new cloudfront.CfnOriginAccessControl(
      this,
      `${prefix}-cloudfront-access-control`,
      {
        originAccessControlConfig: {
          name: `${prefix}-origin-access-control`,
          originAccessControlOriginType: "s3",
          signingBehavior: "always",
          signingProtocol: "sigv4",
        },
      }
    );

    const distribution = new cloudfront.Distribution(
      this,
      `${props.prefix}-cloudfront-distribution`,
      {
        defaultRootObject: "/static/index.html",
        domainNames: ["terminal.ai-assistant.api.godaddy.com"],
        certificate: cm.Certificate.fromCertificateArn(
          this,
          `${props.prefix}-certificate`,
          "arn:aws:acm:us-east-1:350020534489:certificate/918cfbe3-9527-4ae0-8b41-7aec7bba77de"
        ),
        defaultBehavior: {
          origin: new origins.S3Origin(bucket),
          responseHeadersPolicy:
            cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
        },
        webAclId: webAcl.attrArn,
      }
    );

    (
      distribution.node.defaultChild as cloudfront.CfnDistribution
    ).addPropertyOverride(
      "DistributionConfig.Origins.0.OriginAccessControlId",
      originAccessControl.getAtt("Id")
    );

    (
      distribution.node.defaultChild as cloudfront.CfnDistribution
    ).addPropertyOverride(
      "DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity",
      ""
    );

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:GetObject"],
        principals: [new iam.ServicePrincipal("cloudfront.amazonaws.com")],
        resources: [`arn:aws:s3:::gd-commerceut-ai-assistant-api/*`],
        conditions: {
          StringEquals: {
            "AWS:SourceArn": `arn:aws:cloudfront::350020534489:distribution/${distribution.distributionId}`,
          },
        },
      })
    );
  }
}
