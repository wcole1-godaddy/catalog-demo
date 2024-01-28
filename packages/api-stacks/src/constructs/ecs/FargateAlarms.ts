import { GDStack } from "@gd-safeguard/godaddy-constructs";
import {
  Arn,
  aws_cloudwatch as cloudwatch,
  aws_cloudwatch_actions as cwActions,
  aws_sns as sns,
  Duration,
  Stack,
} from "aws-cdk-lib";
import {
  ComparisonOperator,
  TreatMissingData,
} from "aws-cdk-lib/aws-cloudwatch";
import { Construct } from "constructs";

export interface FargateAlarmsServiceProps {
  /**
   * Name of the Fargate Service
   */
  serviceName: string;
  /**
   * Name of the Fargate Cluster
   */
  clusterName: string;
  /**
   * Name of the Fargate Target Group
   */
  targetGroupFullName: string;
  /**
   * Name of the Fargate Load Balancer
   */
  loadBalancerFullName: string;
}

export interface FargateAlarmsProps
  extends ConfigurableFargateAlarmsProps,
    FargateAlarmsServiceProps {
  prefix: string;
  /**
   * Name of the Environment Fargate is deployed to
   */
  environmentName: string;
  /**
   * Name of the Slack SNS
   */
  slackSNS: string;
}

export interface ConfigurableFargateAlarmsProps {
  memoryWarningPercentage: number;
  memoryCriticalPercentage: number;
  cpuWarningPercentage: number;
  cpuCriticalPercentage: number;
  taskCriticalCount: number;
  highResponseTimeSeconds: number;
  lowRequestCount: number;
}

export class FargateAlarms extends Construct {
  /**
   * Constructor for common Fargate Cloudwatch Alarms
   * @param {Construct} scope - The parent creating construct (usually `this`).
   * @param {string} id - The construct's name
   * @param {FargateAlarmsProps} props - Properties for Fargate Cloudwatch Alarms
   */
  // eslint-disable-next-line max-statements
  constructor(scope: Construct, id: string, props: FargateAlarmsProps) {
    super(scope, id);
    const {
      environmentName,
      slackSNS,
      serviceName,
      clusterName,
      targetGroupFullName,
      loadBalancerFullName,
      memoryWarningPercentage,
      memoryCriticalPercentage,
      cpuWarningPercentage,
      cpuCriticalPercentage,
      taskCriticalCount,
      highResponseTimeSeconds,
      lowRequestCount,
    } = props;

    const stack = Stack.of(scope) as GDStack;

    const topic = sns.Topic.fromTopicArn(
      this,
      `${props.prefix}-slack-topic`,
      Arn.format(
        {
          service: "sns",
          resource: slackSNS,
        },
        stack
      )
    );

    const memoryUtilized = new cloudwatch.Metric({
      namespace: "ECS/ContainerInsights",
      metricName: "MemoryUtilized",
      dimensionsMap: {
        ClusterName: clusterName,
        ServiceName: serviceName,
      },
      period: Duration.seconds(60),
      statistic: "Sum",
    });
    const memoryReserved = new cloudwatch.Metric({
      namespace: "ECS/ContainerInsights",
      metricName: "MemoryReserved",
      dimensionsMap: {
        ClusterName: clusterName,
        ServiceName: serviceName,
      },
      period: Duration.seconds(60),
      statistic: "Sum",
    });
    const memoryPercentage = new cloudwatch.MathExpression({
      expression: "100 * (memoryUtilized / memoryReserved)",
      usingMetrics: {
        memoryUtilized,
        memoryReserved,
      },
    });
    const memoryWarningAlarm = memoryPercentage.createAlarm(
      this,
      `${props.prefix}-memory-warning-alarm`,
      {
        alarmName: `${serviceName}-Memory-Warning ${environmentName} ${clusterName}`,
        alarmDescription: `Fires when ${serviceName} is using a high percentage of Memory`,
        actionsEnabled: true,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        threshold: memoryWarningPercentage,
        datapointsToAlarm: 6,
        evaluationPeriods: 10,
      }
    );
    memoryWarningAlarm.addAlarmAction(new cwActions.SnsAction(topic));
    memoryWarningAlarm.addOkAction(new cwActions.SnsAction(topic));
    const memoryCriticalAlarm = memoryPercentage.createAlarm(
      this,
      `${props.prefix}-memory-critical-alarm`,
      {
        alarmName: `${serviceName}-Memory-Critical ${environmentName} ${clusterName}`,
        alarmDescription: `Fires when ${serviceName} is using a high percentage of Memory`,
        actionsEnabled: true,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        threshold: memoryCriticalPercentage,
        datapointsToAlarm: 6,
        evaluationPeriods: 10,
      }
    );
    memoryCriticalAlarm.addAlarmAction(new cwActions.SnsAction(topic));
    memoryCriticalAlarm.addOkAction(new cwActions.SnsAction(topic));

    const cpuUtilized = new cloudwatch.Metric({
      namespace: "ECS/ContainerInsights",
      metricName: "CpuUtilized",
      dimensionsMap: {
        ClusterName: clusterName,
        ServiceName: serviceName,
      },
      period: Duration.seconds(60),
      statistic: "Sum",
    });
    const cpuReserved = new cloudwatch.Metric({
      namespace: "ECS/ContainerInsights",
      metricName: "CpuReserved",
      dimensionsMap: {
        ClusterName: clusterName,
        ServiceName: serviceName,
      },
      period: Duration.seconds(60),
      statistic: "Sum",
    });
    const cpuPercentage = new cloudwatch.MathExpression({
      expression: "100 * (cpuUtilized / cpuReserved)",
      usingMetrics: {
        cpuUtilized,
        cpuReserved,
      },
    });
    const cpuWarningAlarm = cpuPercentage.createAlarm(
      this,
      `${props.prefix}-cpu-warning-alarm`,
      {
        alarmName: `${serviceName}-CPU-Warning ${environmentName} ${clusterName}`,
        alarmDescription: `Fires when ${serviceName} is using a high percentage of CPU`,
        actionsEnabled: true,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        threshold: cpuWarningPercentage,
        datapointsToAlarm: 6,
        evaluationPeriods: 10,
      }
    );
    cpuWarningAlarm.addAlarmAction(new cwActions.SnsAction(topic));
    cpuWarningAlarm.addOkAction(new cwActions.SnsAction(topic));
    const cpuCriticalAlarm = cpuPercentage.createAlarm(
      this,
      `${props.prefix}-cpu-critical-alarm`,
      {
        alarmName: `${serviceName}-CPU-Critical ${environmentName} ${clusterName}`,
        alarmDescription: `Fires when ${serviceName} is using a high percentage of CPU`,
        actionsEnabled: true,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        threshold: cpuCriticalPercentage,
        datapointsToAlarm: 6,
        evaluationPeriods: 10,
      }
    );
    cpuCriticalAlarm.addAlarmAction(new cwActions.SnsAction(topic));
    cpuCriticalAlarm.addOkAction(new cwActions.SnsAction(topic));

    const taskCount = new cloudwatch.Metric({
      namespace: "ECS/ContainerInsights",
      metricName: "RunningTaskCount",
      dimensionsMap: {
        ClusterName: clusterName,
        ServiceName: serviceName,
      },
      unit: cloudwatch.Unit.COUNT,
      period: Duration.seconds(60),
      statistic: "Maximum",
    });
    const taskCountCriticalAlarm = taskCount.createAlarm(
      this,
      `${props.prefix}-task-count-critical-alarm`,
      {
        alarmName: `${serviceName}-TaskCount-Critical ${environmentName} ${clusterName}`,
        alarmDescription: `Fires when ${serviceName} is running higher number of tasks`,
        actionsEnabled: true,
        comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
        threshold: taskCriticalCount,
        datapointsToAlarm: 6,
        evaluationPeriods: 10,
      }
    );
    taskCountCriticalAlarm.addAlarmAction(new cwActions.SnsAction(topic));
    taskCountCriticalAlarm.addOkAction(new cwActions.SnsAction(topic));

    const unhealthyHostCount = new cloudwatch.Metric({
      namespace: "AWS/ApplicationELB",
      metricName: "UnHealthyHostCount",
      dimensionsMap: {
        TargetGroup: targetGroupFullName,
        LoadBalancer: loadBalancerFullName,
      },
      unit: cloudwatch.Unit.COUNT,
      period: Duration.seconds(60),
      statistic: "Maximum",
    });
    const unhealthyTargetAlarm = unhealthyHostCount.createAlarm(
      this,
      `${props.prefix}-unhealthy-target-alarm`,
      {
        alarmName: `${serviceName}-UnhealthyTarget-Alarm ${environmentName} ${clusterName}`,
        alarmDescription: `Fires when ${serviceName} has 1 or more unhealthy targets`,
        actionsEnabled: true,
        comparisonOperator:
          ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        threshold: 1,
        datapointsToAlarm: 6,
        evaluationPeriods: 10,
      }
    );
    unhealthyTargetAlarm.addAlarmAction(new cwActions.SnsAction(topic));
    unhealthyTargetAlarm.addOkAction(new cwActions.SnsAction(topic));

    const targetConnectionErrorCount = new cloudwatch.Metric({
      namespace: "AWS/ApplicationELB",
      metricName: "TargetConnectionErrorCount",
      dimensionsMap: {
        TargetGroup: targetGroupFullName,
        LoadBalancer: loadBalancerFullName,
      },
      unit: cloudwatch.Unit.COUNT,
      period: Duration.seconds(60),
      statistic: "Sum",
    });
    const targetConnectionErrorCountAlarm =
      targetConnectionErrorCount.createAlarm(
        this,
        `${props.prefix}-target-connection-error-alarm`,
        {
          alarmName: `${serviceName}-TargetConnectionError-Alarm ${environmentName} ${clusterName}`,
          alarmDescription: `Fires when ${serviceName} ELB is unable to connect to targets`,
          actionsEnabled: true,
          comparisonOperator:
            ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
          threshold: 10,
          datapointsToAlarm: 6,
          evaluationPeriods: 10,
          treatMissingData: TreatMissingData.IGNORE,
        }
      );
    targetConnectionErrorCountAlarm.addAlarmAction(
      new cwActions.SnsAction(topic)
    );
    targetConnectionErrorCountAlarm.addOkAction(new cwActions.SnsAction(topic));

    const fiveHundredErrors = new cloudwatch.Metric({
      namespace: "AWS/ApplicationELB",
      metricName: "HTTPCode_Target_5XX_Count",
      dimensionsMap: {
        TargetGroup: targetGroupFullName,
        LoadBalancer: loadBalancerFullName,
      },
      unit: cloudwatch.Unit.COUNT,
      period: Duration.seconds(60),
      statistic: "Sum",
    });
    const fiveHundredErrorsAlarm = fiveHundredErrors.createAlarm(
      this,
      `${props}-five-hundred-error-alarm`,
      {
        alarmName: `${serviceName}-5XX-Alarm ${environmentName} ${clusterName}`,
        alarmDescription: `Fires when ${serviceName} has 5XX`,
        actionsEnabled: true,
        comparisonOperator:
          ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        threshold: 10,
        datapointsToAlarm: 6,
        evaluationPeriods: 10,
        treatMissingData: TreatMissingData.IGNORE,
      }
    );
    fiveHundredErrorsAlarm.addAlarmAction(new cwActions.SnsAction(topic));
    fiveHundredErrorsAlarm.addOkAction(new cwActions.SnsAction(topic));

    const responseTime = new cloudwatch.Metric({
      namespace: "AWS/ApplicationELB",
      metricName: "TargetResponseTime",
      dimensionsMap: {
        TargetGroup: targetGroupFullName,
        LoadBalancer: loadBalancerFullName,
      },
      unit: cloudwatch.Unit.SECONDS,
      period: Duration.seconds(60),
      statistic: "p95",
    });
    const responseTimeAlarm = responseTime.createAlarm(
      this,
      `${props.prefix}-response-time-error-alarm`,
      {
        alarmName: `${serviceName}-ResponseTime-Alarm ${environmentName} ${clusterName}`,
        alarmDescription: `Fires when ${serviceName} has high response time`,
        actionsEnabled: true,
        comparisonOperator:
          ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        threshold: highResponseTimeSeconds,
        datapointsToAlarm: 6,
        evaluationPeriods: 10,
        treatMissingData: TreatMissingData.IGNORE,
      }
    );
    responseTimeAlarm.addAlarmAction(new cwActions.SnsAction(topic));
    responseTimeAlarm.addOkAction(new cwActions.SnsAction(topic));

    if (lowRequestCount < 0) {
      const requests = new cloudwatch.Metric({
        namespace: "AWS/ApplicationELB",
        metricName: "RequestCount",
        dimensionsMap: {
          TargetGroup: targetGroupFullName,
          LoadBalancer: loadBalancerFullName,
        },
        unit: cloudwatch.Unit.COUNT,
        period: Duration.seconds(60),
        statistic: "Sum",
      });
      const requestCountAlarm = requests.createAlarm(
        this,
        `${props.prefix}-request-count-alarm`,
        {
          alarmName: `${serviceName}-LowRequest-Alarm ${environmentName} ${clusterName}`,
          alarmDescription: `Fires when ${serviceName} has low number of requests`,
          actionsEnabled: true,
          comparisonOperator:
            ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
          threshold: lowRequestCount,
          datapointsToAlarm: 6,
          evaluationPeriods: 10,
          treatMissingData: TreatMissingData.IGNORE,
        }
      );
      requestCountAlarm.addAlarmAction(new cwActions.SnsAction(topic));
      requestCountAlarm.addOkAction(new cwActions.SnsAction(topic));
    }
  }
}
