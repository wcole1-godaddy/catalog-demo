#!/bin/bash

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -h|--help) display_help=1   ;;
        -r|--region) region="$2"    ; shift ;;
        -u|--update-service) update="$2"    ; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

if [[ -z ${GH_AUTH_TOKEN+x} ]]; then
  echo "GH_AUTH_TOKEN is not set"
  exit 1
fi

if [[ -z ${NODE_AUTH_TOKEN+x} ]]; then
  echo "NODE_AUTH_TOKEN is not set"
  exit 1
fi

REGION=us-west-2
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
CLUSTER_NAME=catalog-api-demo-cluster
SERVICE_NAME=catalog-api-demo-service

aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

docker build \
--file ./dockerfiles/api.Dockerfile \
--build-arg GH_AUTH_TOKEN=$GH_AUTH_TOKEN \
--build-arg NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN \
--platform=linux/amd64 \
-t catalog-api .

docker tag ai-assistant-api ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/catalog-api-demo-ecr-repo
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/catalog-api-demo-ecr-repo

if [[ "$update" == true ]]
then
  aws ecs update-service --region ${REGION} --cluster ${CLUSTER_NAME} --service ${SERVICE_NAME} --force-new-deployment
fi
