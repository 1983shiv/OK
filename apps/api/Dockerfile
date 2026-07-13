FROM node:22-alpine AS builder
RUN npm install -g pnpm@11.3.0
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @optionkart/api exec prisma generate
RUN pnpm --filter @optionkart/types build
RUN pnpm --filter @optionkart/utils build
RUN pnpm --filter @optionkart/api build

FROM node:22-alpine AS production
RUN npm install -g pnpm@11.3.0
WORKDIR /app
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/utils/package.json ./packages/utils/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 3001
CMD ["node", "apps/api/dist/main"]
