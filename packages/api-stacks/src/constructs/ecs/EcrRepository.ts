import { Construct } from "constructs";
import {
	CfnReplicationConfiguration,
	Repository,
	RepositoryEncryption,
	TagMutability,
} from "aws-cdk-lib/aws-ecr";
import { Key } from "aws-cdk-lib/aws-kms";
import { Aws } from "aws-cdk-lib";

export interface EcrRepositoryProps {
	kmsKey: string;
	repositoryName: string;
	replicationRegions?: string[];
}

export class EcrRepository extends Construct {
	repo: Repository;

	constructor(scope: Construct, id: string, props: EcrRepositoryProps) {
		super(scope, id);

		// this.kmsKey = StringParameter.fromStringParameterName(
		// 	this,
		// 	"KmsKey",
		// 	"/AdminParams/Team/KMSKeyArn",
		// ).stringValue;

		this.setupEcr(props);
	}

	setupEcr(props: EcrRepositoryProps) {
		this.repo = new Repository(this, "Repository", {
			repositoryName: props.repositoryName,
			imageTagMutability: TagMutability.IMMUTABLE,
			encryption: RepositoryEncryption.KMS,
			encryptionKey: Key.fromKeyArn(this, "Key", props.kmsKey),
		});

		const replicationRegions = props.replicationRegions;
		if (replicationRegions) {
			new CfnReplicationConfiguration(this, "ReplicationConfiguration", {
				replicationConfiguration: {
					rules: [
						{
							destinations: replicationRegions.map((region) => {
								return {
									region,
									registryId: Aws.ACCOUNT_ID,
								};
							}),
						},
					],
				},
			});
		}
	}
}
