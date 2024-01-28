import { GDStackProps } from "@gd-safeguard/godaddy-constructs";
import {
  Arn,
  aws_applicationautoscaling as applicationautoscaling,
  aws_ecs as ecs,
  aws_iam as iam,
  Stack,
} from "aws-cdk-lib";
import { Construct } from "constructs";

interface FargateAutoScalingProps extends GDStackProps {
  prefix: string;
  clusterName: string;
  serviceName: string;
}

export class FargateAutoScaling extends Construct {
  constructor(scope: Construct, id: string, props: FargateAutoScalingProps) {
    super(scope, id);

    const stack = Stack.of(scope);

    const autoScalingRole = iam.Role.fromRoleArn(
      stack,
      `${props}-service-linked-role`,
      Arn.format(
        {
          service: "iam",
          region: "",
          resource: "role",
          resourceName:
            "aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService",
        },
        stack
      )
    );

    const serviceScalableTarget = new applicationautoscaling.ScalableTarget(
      stack,
      `${props}-scalable-target`,
      {
        resourceId: `service/${props.clusterName}/${props.serviceName}`,
        scalableDimension: "ecs:service:DesiredCount",
        serviceNamespace: applicationautoscaling.ServiceNamespace.ECS,
        minCapacity: 2,
        maxCapacity: 10,
        role: autoScalingRole,
      }
    );

    const serviceAutoScalingPolicy =
      new applicationautoscaling.TargetTrackingScalingPolicy(
        stack,
        `${props.prefix}-auto-scaling-policy`,
        {
          policyName: `${props.serviceName}-auto-scaling-policy`,
          scalingTarget: serviceScalableTarget,
          targetValue: 50,
          predefinedMetric:
            applicationautoscaling.PredefinedMetric
              .ECS_SERVICE_AVERAGE_CPU_UTILIZATION,
        }
      );

    serviceAutoScalingPolicy.node.addDependency(serviceScalableTarget);
  }
}
