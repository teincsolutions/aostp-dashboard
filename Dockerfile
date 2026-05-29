FROM node:20-alpine AS build
WORKDIR /app

# Accept build-time environment variables
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}

# Copy package.json and package-lock.json to leverage Docker's caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application files
COPY . .
# Build with the environment-specific API URL
RUN npm run build

#Create a lightweight runtime image
FROM node:20-alpine AS production

WORKDIR /app
# Set the port for the Next.js server

ENV PORT=8080
# Explicitly set the host to 0.0.0.0 for Docker networking
ENV HOSTNAME=0.0.0.0

# Next.js standalone mode copies required files into .next/standalone
COPY --from=build /app/.next/standalone ./
# Copy public and static assets if needed, as standalone mode doesn't include them
COPY --from=build /app/public ./public
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/scripts/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose the port the server listens on
EXPOSE 8080

# Set the entrypoint to your custom script
ENTRYPOINT ["/app/entrypoint.sh"]

# Set the command to run the Next.js standalone server
CMD ["node", "server.js"]