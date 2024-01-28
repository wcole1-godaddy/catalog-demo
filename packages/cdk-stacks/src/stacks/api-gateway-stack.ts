import { getGoDaddyApiHost } from "../utils";
import { GDStack, GDStackProps } from "@gd-safeguard/godaddy-constructs";
import {
  aws_apigateway,
  aws_certificatemanager,
  aws_lambda,
  aws_ssm,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export interface ApiGatewayStackProps extends GDStackProps {
  prefix: string;
  parameterName?: string;
  subDomainName?: string;
  lambdaFunction?: aws_lambda.Function | null;
}

export class ApiGatewayStack extends GDStack {
  public readonly apiGateway: aws_apigateway.LambdaRestApi | null = null;
  private readonly certificate: aws_certificatemanager.ICertificate | null =
    null;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    const { prefix, subDomainName, env } = props;

    const environment = aws_ssm.StringParameter.valueFromLookup(
      this,
      "/AdminParams/Team/Environment",
    ) as "dev-private" | "dev" | "test" | "ote" | "prod";

    if (environment !== "dev-private" && props.parameterName) {
      const certificateArn = aws_ssm.StringParameter.valueFromLookup(
        this,
        props.parameterName,
      );

      this.certificate = aws_certificatemanager.Certificate.fromCertificateArn(
        this,
        `${prefix}-certificate`,
        certificateArn,
      );
    }

    if (props.lambdaFunction) {
      this.apiGateway = new aws_apigateway.LambdaRestApi(
        this,
        `${prefix}-api-gateway`,
        {
          handler: props.lambdaFunction,
        },
      );

      if (environment !== "dev-private" && subDomainName && this.certificate) {
        this.apiGateway.addDomainName(`${prefix}-domain-name`, {
          domainName: `${subDomainName}.${getGoDaddyApiHost(environment, false)}`,
          certificate: this.certificate,
          endpointType: aws_apigateway.EndpointType.REGIONAL,
        });
      }
    }
  }
}
