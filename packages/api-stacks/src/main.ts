import { EcsStacks } from "./ecs-stacks";
import { TerminalStacks } from "./terminal-stacks";
import { App } from "aws-cdk-lib";
import { EcrRepositoryStack } from "cdk-stacks";

const env = {
  region: process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_DEFAULT_ACCOUNT,
};

async function main() {
  const app = new App();

  const prefix = "catalog-api-demo";

  const ecrRepo = new EcrRepositoryStack(app, `${prefix}-ecs-ecr-stack`, {
    env,
    prefix,
    repositoryName: `${prefix}-ecr-repo`,
  });

  new EcsStacks(app, `${prefix}-ecs-stack`, {
    env,
    prefix,
    repository: ecrRepo.ecrRepository,
  });

  // 🚨 Never instantiate resources below this line 🚨
  app.synth();
}

main();
