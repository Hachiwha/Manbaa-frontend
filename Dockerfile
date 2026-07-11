# syntax=docker/dockerfile:1

# This app targets the Cloudflare Workers runtime (see wrangler.jsonc) via
# @cloudflare/vite-plugin. `npm run build` emits a workerd-compatible bundle
# (dist/server/index.js + dist/server/wrangler.json), not a plain Node HTTP
# server — so the container serves it with `wrangler dev`, which runs the
# real Workers runtime (workerd) locally. That binary requires glibc, so
# this uses Debian slim rather than Alpine (musl breaks workerd).

FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_* vars are inlined into the client bundle at build time (Vite, not
# runtime) — pass them as build args, e.g.:
#   docker build --build-arg VITE_API_BASE_URL=https://api.example.com .
ARG VITE_API_BASE_URL=http://localhost:3000
ARG VITE_API_PREFIX=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_API_PREFIX=${VITE_API_PREFIX}

RUN npm run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# node_modules carries the wrangler CLI (a devDependency) needed to serve
# the build; copying it from the builder avoids a second, --omit=dev
# install that would drop wrangler.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 8080

CMD ["node_modules/.bin/wrangler", "dev", "--config", "dist/server/wrangler.json", "--ip", "0.0.0.0", "--port", "8080"]
