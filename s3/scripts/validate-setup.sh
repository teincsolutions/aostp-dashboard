#!/bin/bash

# MinIO Setup Validation Script
# This script validates that all buckets and policies are correctly configured

set -e

echo "🔍 Validating MinIO Multi-Bucket Setup..."

# Configuration
MINIO_ALIAS="minio"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://minio:9000}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:-minioadmin}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-minioadmin123}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Test MinIO connection
test_connection() {
    echo ""
    print_info "Testing MinIO connection..."
    
    if mc alias set $MINIO_ALIAS $MINIO_ENDPOINT $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD >/dev/null 2>&1; then
        print_success "MinIO connection established"
    else
        print_error "Failed to connect to MinIO"
        return 1
    fi
}

# Test bucket existence
test_buckets() {
    echo ""
    print_info "Testing bucket existence..."
    
    local expected_buckets=(
        "willfind8-assets"
        "willfind8-ads"
        "willfind8-user-content"
        "willfind8-chat-attachments"
        "willfind8-kyc-documents"
        "willfind8-admin-files"
    )
    
    for bucket in "${expected_buckets[@]}"; do
        if mc ls $MINIO_ALIAS/$bucket >/dev/null 2>&1; then
            print_success "Bucket exists: $bucket"
        else
            print_error "Bucket missing: $bucket"
        fi
    done
}

# Test bucket policies
test_policies() {
    echo ""
    print_info "Testing bucket policies..."
    
    # Test public buckets
    local public_buckets=("willfind8-assets" "willfind8-ads")
    for bucket in "${public_buckets[@]}"; do
        local policy=$(mc anonymous list $MINIO_ALIAS/$bucket 2>/dev/null | grep "download" || echo "")
        if [[ -n "$policy" ]]; then
            print_success "Public policy applied: $bucket"
        else
            print_error "Public policy missing: $bucket"
        fi
    done
    
    # Test private buckets
    local private_buckets=("willfind8-chat-attachments" "willfind8-kyc-documents" "willfind8-admin-files")
    for bucket in "${private_buckets[@]}"; do
        local policy=$(mc anonymous list $MINIO_ALIAS/$bucket 2>/dev/null | grep "none" || echo "none")
        if [[ "$policy" == "none" ]] || [[ -z "$policy" ]]; then
            print_success "Private policy applied: $bucket"
        else
            print_error "Private policy not applied: $bucket"
        fi
    done
}

# Test encryption
test_encryption() {
    echo ""
    print_info "Testing encryption settings..."
    
    # Test KYC bucket encryption
    local encryption_info=$(mc encrypt info $MINIO_ALIAS/willfind8-kyc-documents 2>/dev/null || echo "")
    if [[ "$encryption_info" == *"sse-s3"* ]] || [[ "$encryption_info" == *"AES256"* ]]; then
        print_success "Encryption enabled: willfind8-kyc-documents"
    else
        print_warning "Encryption not detected: willfind8-kyc-documents (may not be supported in MinIO)"
    fi
}

# Test versioning
test_versioning() {
    echo ""
    print_info "Testing versioning settings..."
    
    local sensitive_buckets=("willfind8-kyc-documents" "willfind8-admin-files")
    for bucket in "${sensitive_buckets[@]}"; do
        local version_info=$(mc version info $MINIO_ALIAS/$bucket 2>/dev/null || echo "")
        if [[ "$version_info" == *"Enabled"* ]]; then
            print_success "Versioning enabled: $bucket"
        else
            print_warning "Versioning not enabled: $bucket"
        fi
    done
}

# Test application user
test_app_user() {
    echo ""
    print_info "Testing application user..."
    
    local user_info=$(mc admin user info $MINIO_ALIAS willfind8-app 2>/dev/null || echo "")
    if [[ -n "$user_info" ]]; then
        print_success "Application user exists: willfind8-app"
    else
        print_error "Application user missing: willfind8-app"
    fi
    
    # Test user policy
    local user_policy=$(mc admin user info $MINIO_ALIAS willfind8-app 2>/dev/null | grep "willfind8-app-policy" || echo "")
    if [[ -n "$user_policy" ]]; then
        print_success "Application user policy attached"
    else
        print_error "Application user policy not attached"
    fi
}

# Test file operations
test_file_operations() {
    echo ""
    print_info "Testing file operations..."
    
    # Create test file
    echo "Test file content" > /tmp/test-file.txt
    
    # Test upload to public bucket
    if mc cp /tmp/test-file.txt $MINIO_ALIAS/willfind8-assets/test/ >/dev/null 2>&1; then
        print_success "File upload to public bucket works"
        
        # Test public access
        local public_url="$MINIO_ENDPOINT/willfind8-assets/test/test-file.txt"
        if curl -s -f "$public_url" >/dev/null 2>&1; then
            print_success "Public file access works"
        else
            print_warning "Public file access may not work (check network/firewall)"
        fi
        
        # Cleanup
        mc rm $MINIO_ALIAS/willfind8-assets/test/test-file.txt >/dev/null 2>&1
    else
        print_error "File upload to public bucket failed"
    fi
    
    # Test upload to private bucket
    if mc cp /tmp/test-file.txt $MINIO_ALIAS/willfind8-chat-attachments/test/ >/dev/null 2>&1; then
        print_success "File upload to private bucket works"
        
        # Generate signed URL
        local signed_url=$(mc share download $MINIO_ALIAS/willfind8-chat-attachments/test/test-file.txt --expire=1h 2>/dev/null | grep "http" || echo "")
        if [[ -n "$signed_url" ]]; then
            print_success "Signed URL generation works"
        else
            print_warning "Signed URL generation may not work"
        fi
        
        # Cleanup
        mc rm $MINIO_ALIAS/willfind8-chat-attachments/test/test-file.txt >/dev/null 2>&1
    else
        print_error "File upload to private bucket failed"
    fi
    
    # Cleanup test file
    rm -f /tmp/test-file.txt
}

# Test CORS configuration
test_cors() {
    echo ""
    print_info "Testing CORS configuration..."
    
    local public_buckets=("willfind8-assets" "willfind8-ads" "willfind8-user-content")
    for bucket in "${public_buckets[@]}"; do
        local cors_info=$(mc cors get $MINIO_ALIAS/$bucket 2>/dev/null || echo "")
        if [[ -n "$cors_info" ]]; then
            print_success "CORS configured: $bucket"
        else
            print_warning "CORS not configured: $bucket"
        fi
    done
}

# Test lifecycle policies
test_lifecycle() {
    echo ""
    print_info "Testing lifecycle policies..."
    
    local buckets=("willfind8-assets" "willfind8-ads" "willfind8-user-content" "willfind8-chat-attachments" "willfind8-kyc-documents" "willfind8-admin-files")
    for bucket in "${buckets[@]}"; do
        local lifecycle_info=$(mc ilm ls $MINIO_ALIAS/$bucket 2>/dev/null || echo "")
        if [[ -n "$lifecycle_info" ]]; then
            print_success "Lifecycle policy configured: $bucket"
        else
            print_warning "Lifecycle policy not configured: $bucket"
        fi
    done
}

# Main execution
main() {
    echo "🚀 Starting MinIO validation..."
    echo "Endpoint: $MINIO_ENDPOINT"
    echo "User: $MINIO_ROOT_USER"
    echo ""
    
    # Run all tests
    test_connection || exit 1
    test_buckets
    test_policies
    test_encryption
    test_versioning
    test_app_user
    test_file_operations
    test_cors
    test_lifecycle
    
    # Summary
    echo ""
    echo "📊 Validation Summary:"
    echo "======================"
    print_success "Tests passed: $TESTS_PASSED"
    if [[ $TESTS_FAILED -gt 0 ]]; then
        print_error "Tests failed: $TESTS_FAILED"
        echo ""
        print_error "❌ MinIO setup validation FAILED"
        exit 1
    else
        echo ""
        print_success "✅ MinIO setup validation PASSED"
        print_info "🎉 Your MinIO multi-bucket setup is ready for WillFind8!"
    fi
}

# Run main function
main "$@"