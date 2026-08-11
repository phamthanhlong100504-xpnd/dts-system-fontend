# Stage 1: dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --loglevel=error

# Stage 2: build
# Backend URLs bake vào rewrites() LÚC BUILD (next.config.ts freeze destinations lúc build).
# Truyền qua --build-arg trong deploy.yml; default = production public URLs.
ARG IDENTITY_API_URL=http://103.75.182.249:8081
ARG PRACTICE_API_URL=http://103.75.182.249:8083
ARG PROGRESS_API_URL=http://103.75.182.249:8084

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV IDENTITY_API_URL=${IDENTITY_API_URL} \
    PRACTICE_API_URL=${PRACTICE_API_URL} \
    PROGRESS_API_URL=${PROGRESS_API_URL}
RUN npm run build

# Stage 3: runner (standalone)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
