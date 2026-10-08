# TinyCare: web app + API in one container.  docker build -t tinycare . && see docs/DEPLOY.md
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# The web build talks to the API on the same origin it is served from.
ENV EXPO_PUBLIC_API_URL=same-origin
RUN npm run build:web

FROM node:22-alpine
ENV NODE_ENV=production PORT=8080 TINYCARE_DATA_DIR=/data TINYCARE_WEB_DIR=/app/dist
WORKDIR /app
# The server has no npm dependencies, so only the built site, the server and the legal pages are needed.
COPY --from=build /app/dist ./dist
COPY --from=build /app/docs ./docs
COPY --from=build /app/server/index.mjs ./server/index.mjs
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1
CMD ["node", "--disable-warning=ExperimentalWarning", "server/index.mjs"]
