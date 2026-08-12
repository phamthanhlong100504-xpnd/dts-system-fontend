# Stage 1: dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --loglevel=error

# Stage 2: build
FROM node:22-alpine AS builder
# Backend URLs bake vào rewrites() LÚC BUILD (next.config.ts freeze destinations lúc build).
# Phải khai báo ARG TRONG stage builder — ARG nằm giữa 2 FROM không vào được stage
# (mở rộng ${ARG} thành chuỗi rỗng → destination bake thành relative /api/:path* → 404).
# Truyền qua --build-arg trong deploy.yml; default = internal Docker network URLs.
ARG IDENTITY_API_URL=http://dts-identity-service:8081
ARG PRACTICE_API_URL=http://dts-practice-service:8087
ARG PROGRESS_API_URL=http://dts-progress:8083
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
