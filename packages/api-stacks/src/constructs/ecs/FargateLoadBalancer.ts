import { GDStack, GDStackProps } from "@gd-safeguard/godaddy-constructs";
import { Duration, Stack } from "aws-cdk-lib";
import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_elasticloadbalancingv2 as elbv2,
  aws_certificatemanager as acm,
  aws_ssm as ssm,
  aws_wafv2 as wafv2,
} from "aws-cdk-lib";
import { Construct } from "constructs";

interface FargateLoadBalancerProps extends GDStackProps {
  prefix: string;
  service: ecs.FargateService;
  certificate: acm.ICertificate;
}

export class FargateLoadBalancer extends Construct {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly targetGroup: elbv2.ApplicationTargetGroup;

  constructor(scope: Construct, id: string, props: FargateLoadBalancerProps) {
    super(scope, id);

    const { certificate } = props;

    const stack = Stack.of(this) as GDStack;

    const securityGroup = ec2.SecurityGroup.fromLookupById(
      stack,
      "security-group-id",
      ssm.StringParameter.valueFromLookup(this, "/AdminParams/VPC/PublicSG"),
    );

    const waf = new wafv2.CfnWebACL(this, `${props.prefix}-waf`, {
      defaultAction: {
        allow: {},
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "MetricForWebACLCDK",
        sampledRequestsEnabled: true,
      },
      scope: "REGIONAL",
      name: `${props.prefix}-web-acl`,
      rules: [
        {
          name: "AWS-AWSManagedRulesCommonRuleSet",
          priority: 0,
          overrideAction: {
            none: {},
          },
          statement: {
            managedRuleGroupStatement: {
              name: "AWSManagedRulesCommonRuleSet",
              vendorName: "AWS",
              excludedRules: [
                {
                  name: "SizeRestrictions_BODY",
                },
                {
                  name: "CrossSiteScripting_BODY",
                },
                {
                  name: "SQLi_BODY",
                },
              ],
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "MetricForWebACLCDK-CRS",
            sampledRequestsEnabled: true,
          },
        },
        {
          name: "AWS-AWSManagedRulesSQLiRuleSet",
          priority: 1,
          overrideAction: {
            none: {},
          },
          statement: {
            managedRuleGroupStatement: {
              name: "AWSManagedRulesSQLiRuleSet",
              vendorName: "AWS",
              excludedRules: [
                {
                  name: "SQLi_BODY",
                },
              ],
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "MetricForWebACLCDK-CRS",
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      stack,
      `${props.prefix}-lb`,
      {
        loadBalancerName: `${props.prefix}-lb`,
        vpc: stack.gdTrustedLandingZone.networking.vpc,
        internetFacing: true,
        http2Enabled: true,
        vpcSubnets: stack.gdTrustedLandingZone.networking.publicSubnets,
        securityGroup: securityGroup,
      },
    );

    this.targetGroup = new elbv2.ApplicationTargetGroup(
      stack,
      `${props.prefix}-tg`,
      {
        healthCheck: {
          enabled: true,
          interval: Duration.seconds(10),
          path: "/health",
          port: "4000",
          timeout: Duration.seconds(5),
          unhealthyThresholdCount: 2,
          healthyThresholdCount: 5,
          protocol: elbv2.Protocol.HTTP,
        },
        targetType: elbv2.TargetType.IP,
        port: 4000,
        protocol: elbv2.ApplicationProtocol.HTTPS,
        vpc: stack.gdTrustedLandingZone.networking.vpc,
        protocolVersion: elbv2.ApplicationProtocolVersion.HTTP1,
        deregistrationDelay: Duration.seconds(30),
        loadBalancingAlgorithmType:
          elbv2.TargetGroupLoadBalancingAlgorithmType.ROUND_ROBIN,
      },
    );

    const listener = this.loadBalancer.addListener(`https-listener`, {
      defaultAction: elbv2.ListenerAction.fixedResponse(403, {
        contentType: "application/json",
        messageBody: "Access Denied",
      }),
      open: false,
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      sslPolicy: elbv2.SslPolicy.TLS12,
      certificates: [certificate],
    });

    new elbv2.ApplicationListenerRule(this, `${props.prefix}-listener-rule`, {
      listener,
      priority: 1000,
      conditions: [
        elbv2.ListenerCondition.hostHeaders([
          "*.test-godaddy.com",
          "*.ote-godaddy.com",
          "*.dev-godaddy.com",
          "*.godaddy.com",
          "*.secureserver.net",
        ]),
      ],
      targetGroups: [this.targetGroup],
    });

    props.service.attachToApplicationTargetGroup(this.targetGroup);

    new wafv2.CfnWebACLAssociation(this, `${props.prefix}-waf-association`, {
      resourceArn: this.loadBalancer.loadBalancerArn,
      webAclArn: waf.attrArn,
    });
  }
}
