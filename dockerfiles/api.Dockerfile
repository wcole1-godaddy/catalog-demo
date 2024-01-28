FROM node:18-alpine AS base

ARG AWS_REGION=us-west-2
ARG GH_AUTH_TOKEN
ARG NODE_AUTH_TOKEN
ARG DIR

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

ENV AWS_REGION=$AWS_REGION
ENV GH_AUTH_TOKEN=$GH_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN

RUN corepack enable

FROM base AS installer
WORKDIR /app
COPY . .

COPY pnpm-lock.yaml pnpm-lock.yaml
COPY .gitignore .gitignore
COPY .npmrc .npmrc
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

RUN pnpm dlx turbo run build --filter catalog-api...

FROM base AS runner
WORKDIR /app

# # # Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api
USER api


# # # Automatically leverage output traces to reduce image size
# # # https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer --chown=api:nodejs /app/apps/catalog-api/dist ./

EXPOSE 4000

ENV PORT 4000

CMD node index.js
