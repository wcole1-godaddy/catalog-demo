import {
  ECRClient,
  ImageIdentifier,
  ListImagesCommand,
  ListImagesCommandInput,
} from "@aws-sdk/client-ecr";

const client = new ECRClient({});

export async function getEcrImages({
  repositoryName,
  maxResults = 1,
}: ListImagesCommandInput) {
  try {
    const response = await client.send(
      new ListImagesCommand({
        repositoryName,
        maxResults,
      })
    );

    return response.imageIds || [];
  } catch (err) {
    return [];
  }
}
