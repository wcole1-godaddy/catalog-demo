import {
  EcsServiceConstruct,
  EcsServiceConstructProps,
} from "../constructs/ecs-service-construct";
import { GDStack } from "@gd-safeguard/godaddy-constructs";
import { Construct } from "constructs";

interface EcsServiceStackProps extends EcsServiceConstructProps {}

export class EcsServiceStack extends GDStack {
  service: EcsServiceConstruct;

  constructor(scope: Construct, id: string, props: EcsServiceStackProps) {
    super(scope, id, props || {});

    const { prefix } = props;

    this.service = new EcsServiceConstruct(
      this,
      `${prefix}-ecs-service`,
      props
    );
  }
}
