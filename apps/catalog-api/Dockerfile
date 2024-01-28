FROM node:20-slim AS base
ARG AWS_REGION=us-west-2
ARG GH_AUTH_TOKEN
ARG NODE_AUTH_TOKEN
ARG DIR

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV AWS_REGION=$AWS_REGION
ENV GH_AUTH_TOKEN=$GH_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=$NODE_AUTH_TOKE

RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
EXPOSE 8000
CMD [ "pnpm", "start" ]
