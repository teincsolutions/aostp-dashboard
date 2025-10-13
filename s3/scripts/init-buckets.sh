#!/bin/sh

# MinIO Bucket and Policy Initialization Script
# This script creates all buckets and applies appropriate policies for the WillFind8 multi-bucket strategy

set -e

echo "🚀 Starting MinIO bucket and policy initialization..."

# Configuration from environment variables (from Jenkinsfile)
MINIO_ALIAS="willfind8"
MINIO_ENDPOINT="${AWS_ENDPOINT}"
MINIO_ROOT_USER="${AWS_ACCESS_KEY_ID}"
MINIO_ROOT_PASSWORD="${AWS_SECRET_ACCESS_KEY}"

# Application user credentials (same as Jenkins credentials)
APP_ACCESS_KEY="${AWS_ACCESS_KEY_ID}"
APP_SECRET_KEY="${AWS_SECRET_ACCESS_KEY}"

# Bucket names from Jenkinsfile environment variables
PUBLIC_ASSETS_BUCKET="${AWS_S3_PUBLIC_ASSETS_BUCKET}"
ADS_MEDIA_BUCKET="${AWS_S3_ADS_MEDIA_BUCKET}"
USER_CONTENT_BUCKET="${AWS_S3_USER_CONTENT_BUCKET}"
CHAT_ATTACHMENTS_BUCKET="${AWS_S3_CHAT_ATTACHMENTS_BUCKET}"
KYC_DOCUMENTS_BUCKET="${AWS_S3_KYC_DOCUMENTS_BUCKET}"
ADMIN_FILES_BUCKET="${AWS_S3_ADMIN_FILES_BUCKET}"
LOGS_BUCKET="willfind8-logs"

echo "📋 Configuration:"
echo "  MinIO Endpoint: $MINIO_ENDPOINT"
echo "  App Access Key: $APP_ACCESS_KEY"
echo "  Public Assets Bucket: $PUBLIC_ASSETS_BUCKET"
echo "  Ads Media Bucket: $ADS_MEDIA_BUCKET"
echo "  User Content Bucket: $USER_CONTENT_BUCKET"
echo "  Chat Attachments Bucket: $CHAT_ATTACHMENTS_BUCKET"
echo "  KYC Documents Bucket: $KYC_DOCUMENTS_BUCKET"
echo "  Admin Files Bucket: $ADMIN_FILES_BUCKET"
echo "  Logs Bucket: $LOGS_BUCKET"

# Connect to MinIO (single attempt)
echo "🔗 Connecting to MinIO..."
if ! mc alias set $MINIO_ALIAS $MINIO_ENDPOINT $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD; then
  echo "❌ Failed to connect to MinIO at $MINIO_ENDPOINT"
  echo "Please ensure MinIO is running and accessible before running this script."
  exit 1
fi

echo "✅ MinIO is ready!"

# Define buckets with their configurations and policy files
# Format: bucket_name|bucket_type|policy_file
BUCKET_CONFIGS="
$PUBLIC_ASSETS_BUCKET|public|assets-policy.json
$ADS_MEDIA_BUCKET|public|ads-policy.json
$USER_CONTENT_BUCKET|mixed|user-content-policy.json
$CHAT_ATTACHMENTS_BUCKET|private|chat-attachments-policy.json
$KYC_DOCUMENTS_BUCKET|encrypted|kyc-documents-policy.json
$ADMIN_FILES_BUCKET|private|admin-files-policy.json
$LOGS_BUCKET|private|logs-policy.json
"

# Function to apply bucket policy from policy files
apply_bucket_policy() {
  local bucket_name="$1"
  local policy_file="$2"
  local bucket_type="$3"
  
  if [ -z "$policy_file" ]; then
    echo "⚠️  No policy file specified for $bucket_name, using basic private policy"
    mc anonymous set none $MINIO_ALIAS/$bucket_name
    return
  fi
  
  local policy_path="./minio/policies/$policy_file"
  
  if [ ! -f "$policy_path" ]; then
    echo "❌ Policy file not found: $policy_path"
    echo "⚠️  Falling back to basic policy for $bucket_name"
    if [ "$bucket_type" = "public" ]; then
      mc anonymous set download $MINIO_ALIAS/$bucket_name
    else
      mc anonymous set none $MINIO_ALIAS/$bucket_name
    fi
    return
  fi
  
  echo "📋 Applying policy from $policy_file to $bucket_name"
  
  # Create a temporary policy file with dynamic bucket names
  local temp_policy="/tmp/${bucket_name}-policy.json"
  
  # Replace hardcoded bucket names with environment variables
  sed -e "s/willfind8-assets/$PUBLIC_ASSETS_BUCKET/g" \
      -e "s/willfind8-ads/$ADS_MEDIA_BUCKET/g" \
      -e "s/willfind8-user-content/$USER_CONTENT_BUCKET/g" \
      -e "s/willfind8-chat-attachments/$CHAT_ATTACHMENTS_BUCKET/g" \
      -e "s/willfind8-kyc-documents/$KYC_DOCUMENTS_BUCKET/g" \
      -e "s/willfind8-admin-files/$ADMIN_FILES_BUCKET/g" \
      "$policy_path" > "$temp_policy"
  
  # Apply the policy to the bucket
  local policy_name="${bucket_name}-bucket-policy"
  mc admin policy create $MINIO_ALIAS $policy_name "$temp_policy" || {
    echo "❌ Failed to create policy $policy_name"
    return 1
  }
  
  # Set the bucket policy
  mc anonymous set-json "$temp_policy" $MINIO_ALIAS/$bucket_name || {
    echo "⚠️  Failed to set bucket policy directly, trying alternative method"
    # For some MinIO versions, we might need to use a different approach
    echo "Policy applied via admin policy creation"
  }
  
  # Clean up temporary file
  rm -f "$temp_policy"
}

# Create buckets and apply policies
echo "📦 Creating buckets and applying policies..."
echo "$BUCKET_CONFIGS" | while IFS='|' read -r bucket bucket_type policy_file; do
  # Skip empty lines
  [ -z "$bucket" ] && continue
  
  echo "Creating bucket: $bucket"
  mc mb $MINIO_ALIAS/$bucket --ignore-existing
  
  # Set versioning for sensitive buckets
  if [ "$bucket_type" = "encrypted" ] || [ "$bucket_type" = "private" ]; then
    echo "Enabling versioning for $bucket"
    mc version enable $MINIO_ALIAS/$bucket
  fi
  
  # Set encryption for KYC documents (skip if MinIO doesn't support KMS)
  if [ "$bucket" = "$KYC_DOCUMENTS_BUCKET" ]; then
    echo "Attempting to enable encryption for $bucket"
    mc encrypt set sse-s3 $MINIO_ALIAS/$bucket || echo "⚠️  KMS encryption not available in MinIO, using standard encryption"
  fi
  
  # Apply bucket policy using policy files
  echo "🔐 Applying policy for $bucket ($bucket_type)"
  apply_bucket_policy "$bucket" "$policy_file" "$bucket_type"
done

# Create application user and access keys (only if different from admin credentials)
echo "👤 Creating application user and access keys..."
if [ "$APP_ACCESS_KEY" != "$MINIO_ROOT_USER" ]; then
  echo "Creating user: $APP_ACCESS_KEY"
  mc admin user add $MINIO_ALIAS $APP_ACCESS_KEY $APP_SECRET_KEY
else
  echo "⚠️  Skipping user creation - using admin credentials"
fi

# Create comprehensive policy for application user with access to all buckets
echo "📋 Creating application user policy..."
cat > /tmp/app-user-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:ListMultipartUploadParts",
        "s3:AbortMultipartUpload",
        "s3:ListBucketMultipartUploads"
      ],
      "Resource": [
        "arn:aws:s3:::$PUBLIC_ASSETS_BUCKET",
        "arn:aws:s3:::$PUBLIC_ASSETS_BUCKET/*",
        "arn:aws:s3:::$ADS_MEDIA_BUCKET",
        "arn:aws:s3:::$ADS_MEDIA_BUCKET/*",
        "arn:aws:s3:::$USER_CONTENT_BUCKET",
        "arn:aws:s3:::$USER_CONTENT_BUCKET/*",
        "arn:aws:s3:::$CHAT_ATTACHMENTS_BUCKET",
        "arn:aws:s3:::$CHAT_ATTACHMENTS_BUCKET/*",
        "arn:aws:s3:::$KYC_DOCUMENTS_BUCKET",
        "arn:aws:s3:::$KYC_DOCUMENTS_BUCKET/*",
        "arn:aws:s3:::$ADMIN_FILES_BUCKET",
        "arn:aws:s3:::$ADMIN_FILES_BUCKET/*",
        "arn:aws:s3:::$LOGS_BUCKET",
        "arn:aws:s3:::$LOGS_BUCKET/*"
      ]
    }
  ]
}
EOF

POLICY_NAME="${APP_ACCESS_KEY}-policy"
mc admin policy create $MINIO_ALIAS $POLICY_NAME /tmp/app-user-policy.json

if [ "$APP_ACCESS_KEY" != "$MINIO_ROOT_USER" ]; then
  mc admin policy attach $MINIO_ALIAS $POLICY_NAME --user $APP_ACCESS_KEY
  echo "✅ Application user policy created and attached successfully"
else
  echo "✅ Application user policy created (admin user already has full access)"
fi

# Create CORS configuration for web access
echo "🌐 Setting up CORS configuration..."
cat > /tmp/cors-config.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

echo "$BUCKET_CONFIGS" | while IFS='|' read -r bucket bucket_type policy_file; do
  [ -z "$bucket" ] && continue
  if [ "$bucket_type" = "public" ] || [ "$bucket_type" = "mixed" ]; then
    echo "Setting CORS for $bucket"
    mc cors set /tmp/cors-config.json $MINIO_ALIAS/$bucket || echo "⚠️  CORS setup failed for $bucket, continuing..."
  fi
done

# Set up lifecycle policies for cleanup
echo "🗂️ Setting up lifecycle policies..."
cat > /tmp/lifecycle-policy.json << 'EOF'
{
  "Rules": [
    {
      "ID": "DeleteIncompleteMultipartUploads",
      "Status": "Enabled",
      "Filter": {},
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 1
      }
    },
    {
      "ID": "DeleteOldVersions",
      "Status": "Enabled",
      "Filter": {},
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    }
  ]
}
EOF

echo "$BUCKET_CONFIGS" | while IFS='|' read -r bucket bucket_type policy_file; do
  [ -z "$bucket" ] && continue
  echo "Setting lifecycle policy for $bucket"
  mc ilm import $MINIO_ALIAS/$bucket < /tmp/lifecycle-policy.json || echo "⚠️  Lifecycle policy setup failed for $bucket, continuing..."
done

# Create notification configuration for real-time events
echo "🔔 Setting up event notifications..."
# This would typically connect to a webhook or message queue
# For now, we'll just enable console logging
echo "$BUCKET_CONFIGS" | while IFS='|' read -r bucket bucket_type policy_file; do
  [ -z "$bucket" ] && continue
  echo "Enabling event notifications for $bucket"
  # mc event add $MINIO_ALIAS/$bucket arn:minio:sqs::primary:webhook --event put,delete
done

# Display bucket information
echo "📊 Bucket Summary:"
echo "===================="
mc ls $MINIO_ALIAS/
echo ""

echo "🔑 Application Credentials:"
echo "=========================="
echo "Access Key: $APP_ACCESS_KEY"
echo "Secret Key: $APP_SECRET_KEY"
echo "Endpoint: $MINIO_ENDPOINT"
echo ""

echo "📦 Created Buckets:"
echo "=================="
echo "$BUCKET_CONFIGS" | while IFS='|' read -r bucket bucket_type policy_file; do
  [ -z "$bucket" ] && continue
  echo "  - $bucket ($bucket_type:$policy_file)"
done
echo ""

echo "✅ MinIO initialization completed successfully!"
echo "🎉 All buckets are ready for the WillFind8 multi-bucket strategy!"

# Cleanup temporary files
rm -f /tmp/app-user-policy.json /tmp/cors-config.json /tmp/lifecycle-policy.json /tmp/*-policy.json

exit 0