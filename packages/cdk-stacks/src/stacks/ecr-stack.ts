import { GDStack, GDStackProps } from "@gd-safeguard/godaddy-constructs";
import { aws_ecr } from "aws-cdk-lib";
import { Construct } from "constructs";

interface EcrRepositoryStackProps extends GDStackProps {
  prefix: string;
  repositoryName: string;
}

export class EcrRepositoryStack extends GDStack {
  public readonly ecrRepository: aws_ecr.Repository;

  constructor(scope: Construct, id: string, props: EcrRepositoryStackProps) {
    super(scope, id, props);

    const { prefix, repositoryName } = props;

    this.ecrRepository = new aws_ecr.Repository(
      this,
      `${prefix}-ecr-repository`,
      {
        repositoryName,
      },
    );
  }
}
