# Build stage
FROM node:18-alpine AS build
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Install production dependencies
RUN npm ci --only=production

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install express for the custom server
RUN npm install express

# Copy package files for proper Node.js module resolution
COPY package*.json ./

COPY --from=build /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy the custom server
COPY --chown=nextjs:nodejs server.js ./

USER nextjs

EXPOSE 8080

ENV PORT=8080
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
