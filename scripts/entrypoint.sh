#!/bin/sh
set -e

echo "Starting Next.js application with environment variable replacement..."

# Ensure the script has LF line endings
sed -i 's/\r//' "$0"

# Perform the replacements with logging
echo "Replacing __NEXT_PUBLIC_API_BASE_URL__ with $NEXT_PUBLIC_API_BASE_URL..."
find /app/.next -type f -name '*.js' -exec sed -i "s|__NEXT_PUBLIC_API_BASE_URL__|$NEXT_PUBLIC_API_BASE_URL|g" {} +

echo "Replacing __NEXT_PUBLIC_GOOGLE_CLIENT_ID__ with $NEXT_PUBLIC_GOOGLE_CLIENT_ID..."
find /app/.next -type f -name '*.js' -exec sed -i "s|__NEXT_PUBLIC_GOOGLE_CLIENT_ID__|$NEXT_PUBLIC_GOOGLE_CLIENT_ID|g" {} +

echo "Replacement complete. Starting Node.js server..."

# Execute the main command from the Dockerfile's CMD
exec "$@"
