import { GDStackProps } from "@gd-safeguard/godaddy-constructs";

/** Properties for configuration of all environments/regions */
export interface CdkConfiguration {
  defaults: Partial<CdkDeploymentConfiguration>;
  environments: {
    [key: string]: {
      defaults?: Partial<CdkDeploymentConfiguration>;
      regions?: {
        [key: string]: Partial<CdkDeploymentConfiguration>;
      };
    };
  };
}

/** Properties for a CDK deployment environment/region */
export interface CdkDeploymentConfiguration extends EcsStackProps {}

export interface BaseProps {
  /** Name of the application */
  appName: string;
  /** Project name */
  projectName: string;
  /** Hostname for application */
  hostName: string;
  /** Hostname to use for Route53 */
  delegatedHostName: string;
  /** Hosted zone name for Route53 */
  delegatedHostedZoneName: string;
  /** Healthcheck path used by load balancer and container healthchecks */
  healthcheckPath: string;
  /** Name of ECS cluster */
  clusterName?: string;
  /** ARN of certificate from ACM */
  certificateArn: string;
  /** Name of ASM secret containing Envoy proxy certificate */
  certificateSecretName: string;
  /** Name of SSM parameter containing task subnet IDs */
  taskSubnetParameterName?: string;
  /** Name of SSM parameter containing load balancer subnet IDs */
  loadBalancerSubnetParameterName?: string;

  /** Application image options */
  image: {
    /** Regions to replication the ECR repository */
    replicationRegions?: string[];
    /** Name of ECR repository */
    repositoryName: string;
    /** Tag of image */
    tag: string;
  };

  /** Container options */
  containerOptions: {
    /** CPU units to reserve for container */
    cpu?: number;
    /** Memory to reserve for container */
    memoryReservation?: number;
    /** Memory to allocate for container */
    memory?: number;
    /** Timeout for container start */
    startTimeout?: number;
    /** Timeout for container stop */
    stopTimeout?: number;
    /** Environment variables for container */
    environment?: {
      [key: string]: string;
    };
    /** Healthcheck options for container */
    healthCheck?: {
      /** Command to run for healthcheck */
      command: string[];
      /** Interval between healthchecks */
      interval?: number;
      /** Timeout for healthcheck */
      timeout?: number;
      /** Number of retries for healthcheck */
      retries?: number;
      /** Time to wait before starting healthchecks */
      startPeriod?: number;
    };
  };
}

/** Properties for ECS stack */
export interface EcsStackProps extends BaseProps, GDStackProps {
  /** Parameter Name containing the ARN of the ECS cluster */
  clusterArnParameterName?: string;
  /** Prefix for the name of the ECS stacks */
  prefix: string;
}
