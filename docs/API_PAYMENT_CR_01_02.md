# Payment System API Documentation - CR-01 & CR-02

**API Version:** v1  
**Base URL:** `/api/v1`  
**Date:** December 16, 2025

---

## Table of Contents

1. [Payment Reference Document Upload (CR-01)](#1-payment-reference-document-upload-cr-01)
2. [Payment Creation with Source (CR-02)](#2-payment-creation-with-source-cr-02)
3. [Payment Document Download (CR-01)](#3-payment-document-download-cr-01)
4. [Filter Payments by Source (CR-02)](#4-filter-payments-by-source-cr-02)
5. [Payment Statistics with Source Breakdown (CR-02)](#5-payment-statistics-with-source-breakdown-cr-02)
6. [Payment Reports with Source Grouping (CR-02)](#6-payment-reports-with-source-grouping-cr-02)

---

## Authentication

All endpoints (except where noted) require JWT authentication.

**Header:**

```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Payment Reference Document Upload (CR-01)

Upload a supporting reference document for a payment.

### Endpoint

```
POST /api/v1/uploads/payments
```

### Authentication

✅ Required

### Authorization

- Payment Clerk
- Finance Manager
- Super Admin

### Request

**Content-Type:** `multipart/form-data`

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Document file (PDF, JPG, PNG) |
| `folder` | String | Yes | Must be `"reference-documents"` |
| `paymentId` | UUID | Yes | UUID of the payment |
| `bucketType` | String | No | Bucket type (default: payments) |
| `fileName` | String | No | Original file name |

**File Constraints:**

- **Max Size:** 5MB
- **Allowed Types:** PDF, JPG, PNG

### Response

**Status:** `201 Created`

```json
{
  "url": "https://cdn.aostp.com/payments/reference-documents/550e8400-e29b-41d4-a716-446655440000/1734345600_abc123def.pdf",
  "key": "reference-documents/550e8400-e29b-41d4-a716-446655440000/1734345600_abc123def.pdf",
  "size": 1048576,
  "bucket": "aostp-payments"
}
```

### Error Responses

**400 Bad Request** - File validation failed

```json
{
  "statusCode": 400,
  "message": "File size exceeds 5MB limit for payment reference documents",
  "error": "Bad Request"
}
```

**400 Bad Request** - Invalid file type

```json
{
  "statusCode": 400,
  "message": "Only PDF, JPG, and PNG files are allowed for payment reference documents",
  "error": "Bad Request"
}
```

**401 Unauthorized** - Missing or invalid token

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**403 Forbidden** - Insufficient permissions

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### cURL Example

```bash
curl -X POST "https://api.aostp.com/api/v1/uploads/payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/receipt.pdf" \
  -F "folder=reference-documents" \
  -F "paymentId=550e8400-e29b-41d4-a716-446655440000"
```

### JavaScript Example

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folder', 'reference-documents');
formData.append('paymentId', '550e8400-e29b-41d4-a716-446655440000');

const response = await fetch('/api/v1/uploads/payments', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const result = await response.json();
console.log('Document uploaded:', result.key);
```

---

## 2. Payment Creation with Source (CR-02)

Create a new payment with payment source and optional reference document.

### Endpoint

```
POST /api/v1/payments
```

### Authentication

✅ Required

### Authorization

- Payment Clerk
- Finance Manager
- Super Admin

### Request

**Content-Type:** `application/json`

```json
{
  "customerId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 1500.0,
  "currency": "USD",
  "exchangeRateId": "660e8400-e29b-41d4-a716-446655440001",
  "paymentMethod": "BANK_TRANSFER",
  "reference": "TXN-2025-12345",
  "invoiceIds": ["770e8400-e29b-41d4-a716-446655440002"],
  "notes": "Payment via wire transfer",
  "paymentSource": "PAID_IN_GHANA",
  "referenceDocumentKey": "reference-documents/550e8400-e29b-41d4-a716-446655440000/1734345600_abc123def.pdf"
}
```

**Fields:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `customerId` | UUID | Yes | - | Customer ID |
| `amount` | Number | Yes | - | Payment amount (max 2 decimals) |
| `currency` | String | Yes | "USD" | Currency code |
| `exchangeRateId` | UUID | Yes | - | Exchange rate ID |
| `paymentMethod` | String | Yes | - | Payment method |
| `reference` | String | No* | - | Transaction reference (*Required for DIRECT_MOMO_TRANSFER) |
| `invoiceIds` | UUID[] | No | - | Invoices to apply payment to |
| `notes` | String | No | - | Additional notes |
| `paymentSource` | Enum | No | "PAID_IN_GHANA" | Payment origin (CR-02) |
| `referenceDocumentKey` | String | No | - | S3 key from document upload (CR-01) |

**Payment Source Values:**

- `PAID_IN_GHANA` (default)
- `PAID_IN_CHINA`

**Payment Method Values:**

- `CASH`
- `BANK_TRANSFER`
- `MOBILE_MONEY`
- `CARD`
- `CREDIT_CARD`
- `DIRECT_MOMO_TRANSFER`

### Response

**Status:** `201 Created`

```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "paymentCode": "PAY-2025-00123",
  "customerId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 1500.0,
  "currency": "USD",
  "localAmount": 15000.0,
  "paymentMethod": "BANK_TRANSFER",
  "paymentSource": "PAID_IN_GHANA",
  "reference": "TXN-2025-12345",
  "referenceDocumentKey": "reference-documents/550e8400-e29b-41d4-a716-446655440000/1734345600_abc123def.pdf",
  "notes": "Payment via wire transfer",
  "processedById": "990e8400-e29b-41d4-a716-446655440004",
  "processedAt": "2025-12-16T10:30:00.000Z",
  "createdAt": "2025-12-16T10:30:00.000Z",
  "receiptKey": null,
  "gatewayTransactionId": null,
  "gatewayStatus": null,
  "customer": {
    "customerCode": "CUST-001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+233240000000"
  },
  "exchangeRate": {
    "rate": 10.0,
    "fromCurrency": "USD",
    "toCurrency": "GHS"
  },
  "processedBy": {
    "id": "990e8400-e29b-41d4-a716-446655440004",
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@aostp.com"
  }
}
```

### Error Responses

**400 Bad Request** - Validation error

```json
{
  "statusCode": 400,
  "message": [
    "amount must be a number conforming to the specified constraints",
    "Payment amount must have at most 2 decimal places"
  ],
  "error": "Bad Request"
}
```

**404 Not Found** - Customer not found

```json
{
  "statusCode": 404,
  "message": "Customer with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

### cURL Example

```bash
curl -X POST "https://api.aostp.com/api/v1/payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 1500.00,
    "currency": "USD",
    "exchangeRateId": "660e8400-e29b-41d4-a716-446655440001",
    "paymentMethod": "BANK_TRANSFER",
    "paymentSource": "PAID_IN_GHANA",
    "referenceDocumentKey": "reference-documents/550e8400-.../doc.pdf"
  }'
```

---

## 3. Payment Document Download (CR-01)

Generate a presigned URL to download a payment reference document.

### Endpoint

```
GET /api/v1/payments/:id/document
```

### Authentication

✅ Required

### Authorization

- Finance Manager
- Super Admin

### Path Parameters

| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ----------- |
| `id`      | UUID | Yes      | Payment ID  |

### Response

**Status:** `200 OK`

```json
{
  "url": "https://s3.amazonaws.com/aostp-payments/reference-documents/...?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...",
  "key": "reference-documents/550e8400-e29b-41d4-a716-446655440000/1734345600_abc123def.pdf"
}
```

**URL Expiry:** 1 hour (3600 seconds)

### Error Responses

**404 Not Found** - Payment not found

```json
{
  "statusCode": 404,
  "message": "Payment with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

**404 Not Found** - No document attached

```json
{
  "statusCode": 404,
  "message": "No reference document found for this payment",
  "error": "Not Found"
}
```

**403 Forbidden** - Insufficient permissions

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### cURL Example

```bash
curl -X GET "https://api.aostp.com/api/v1/payments/550e8400-e29b-41d4-a716-446655440000/document" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### JavaScript Example

```javascript
const response = await fetch(`/api/v1/payments/${paymentId}/document`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const { url, key } = await response.json();

// Download the document
window.open(url, '_blank');
```

---

## 4. Filter Payments by Source (CR-02)

Retrieve payments filtered by payment source with pagination.

### Endpoint

```
GET /api/v1/payments
```

### Authentication

✅ Required

### Authorization

- Payment Clerk
- Finance Manager
- Super Admin

### Query Parameters

| Parameter       | Type   | Required | Default | Description                      |
| --------------- | ------ | -------- | ------- | -------------------------------- |
| `page`          | Number | No       | 1       | Page number                      |
| `limit`         | Number | No       | 20      | Items per page                   |
| `sortBy`        | String | No       | -       | Sort field                       |
| `sortOrder`     | String | No       | "desc"  | Sort order (asc/desc)            |
| `customerId`    | UUID   | No       | -       | Filter by customer               |
| `paymentMethod` | String | No       | -       | Filter by payment method         |
| `currency`      | String | No       | -       | Filter by currency               |
| `dateFrom`      | Date   | No       | -       | Filter from date (ISO format)    |
| `dateTo`        | Date   | No       | -       | Filter to date (ISO format)      |
| `packingListId` | UUID   | No       | -       | Filter by packing list           |
| `warehouseId`   | UUID   | No       | -       | Filter by warehouse              |
| `paymentSource` | Enum   | No       | -       | Filter by payment source (CR-02) |

**Payment Source Values:**

- `PAID_IN_GHANA`
- `PAID_IN_CHINA`

### Response

**Status:** `200 OK`

```json
{
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "paymentCode": "PAY-2025-00123",
      "customerId": "550e8400-e29b-41d4-a716-446655440000",
      "amount": 1500.0,
      "currency": "USD",
      "localAmount": 15000.0,
      "paymentMethod": "BANK_TRANSFER",
      "paymentSource": "PAID_IN_GHANA",
      "reference": "TXN-2025-12345",
      "referenceDocumentKey": "reference-documents/.../doc.pdf",
      "processedAt": "2025-12-16T10:30:00.000Z",
      "customer": {
        "customerCode": "CUST-001",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### cURL Examples

**Filter by Ghana payments:**

```bash
curl -X GET "https://api.aostp.com/api/v1/payments?paymentSource=PAID_IN_GHANA&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Filter by China payments with date range:**

```bash
curl -X GET "https://api.aostp.com/api/v1/payments?paymentSource=PAID_IN_CHINA&dateFrom=2025-12-01&dateTo=2025-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 5. Payment Statistics with Source Breakdown (CR-02)

Get payment statistics including breakdown by payment source.

### Endpoint

```
GET /api/v1/payments/stats
```

### Authentication

✅ Required

### Authorization

- Finance Manager
- Super Admin

### Query Parameters

| Parameter    | Type | Required | Description                   |
| ------------ | ---- | -------- | ----------------------------- |
| `dateFrom`   | Date | No       | Filter from date (ISO format) |
| `dateTo`     | Date | No       | Filter to date (ISO format)   |
| `customerId` | UUID | No       | Filter by customer            |

### Response

**Status:** `200 OK`

```json
{
  "totals": {
    "count": 250,
    "totalAmount": 125000.0,
    "totalLocalAmount": 1250000.0,
    "averageAmount": 500.0
  },
  "byPaymentMethod": [
    {
      "paymentMethod": "MOBILE_MONEY",
      "_count": { "id": 100 },
      "_sum": { "amount": 50000.0, "localAmount": 500000.0 }
    },
    {
      "paymentMethod": "BANK_TRANSFER",
      "_count": { "id": 80 },
      "_sum": { "amount": 45000.0, "localAmount": 450000.0 }
    },
    {
      "paymentMethod": "CASH",
      "_count": { "id": 70 },
      "_sum": { "amount": 30000.0, "localAmount": 300000.0 }
    }
  ],
  "byCurrency": [
    {
      "currency": "USD",
      "_count": { "id": 200 },
      "_sum": { "amount": 100000.0, "localAmount": 1000000.0 }
    },
    {
      "currency": "GHS",
      "_count": { "id": 50 },
      "_sum": { "amount": 25000.0, "localAmount": 250000.0 }
    }
  ],
  "byPaymentSource": [
    {
      "paymentSource": "PAID_IN_GHANA",
      "_count": { "id": 180 },
      "_sum": { "amount": 90000.0, "localAmount": 900000.0 }
    },
    {
      "paymentSource": "PAID_IN_CHINA",
      "_count": { "id": 70 },
      "_sum": { "amount": 35000.0, "localAmount": 350000.0 }
    }
  ]
}
```

### cURL Example

```bash
curl -X GET "https://api.aostp.com/api/v1/payments/stats?dateFrom=2025-12-01&dateTo=2025-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### JavaScript Example

```javascript
const response = await fetch(
  '/api/v1/payments/stats?dateFrom=2025-12-01&dateTo=2025-12-31',
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);

const stats = await response.json();

console.log(
  'Ghana payments:',
  stats.byPaymentSource.find((s) => s.paymentSource === 'PAID_IN_GHANA'),
);
console.log(
  'China payments:',
  stats.byPaymentSource.find((s) => s.paymentSource === 'PAID_IN_CHINA'),
);
```

---

## 6. Payment Reports with Source Grouping (CR-02)

Generate detailed payment reports with source breakdown.

### Endpoint

```
GET /api/v1/reports/payments
```

### Authentication

✅ Required

### Authorization

- Finance Manager
- Super Admin

### Query Parameters

| Parameter     | Type | Required | Description                    |
| ------------- | ---- | -------- | ------------------------------ |
| `fromDate`    | Date | No       | Report start date (ISO format) |
| `toDate`      | Date | No       | Report end date (ISO format)   |
| `customerId`  | UUID | No       | Filter by customer             |
| `warehouseId` | UUID | No       | Filter by warehouse            |

### Response

**Status:** `200 OK`

```json
{
  "payments": [
    {
      "paymentCode": "PAY-2025-00123",
      "customerCode": "CUST-001",
      "customerName": "John Doe",
      "amount": 1500.0,
      "localAmount": 15000.0,
      "currency": "USD",
      "paymentMethod": "BANK_TRANSFER",
      "paymentSource": "PAID_IN_GHANA",
      "processedAt": "2025-12-16T10:30:00.000Z",
      "warehouse": "China Main",
      "processedBy": "Admin User <admin@aostp.com>"
    }
  ],
  "totals": {
    "usdTotal": 125000.0,
    "ghsTotal": 1250000.0,
    "otherCurrencies": [
      {
        "currency": "EUR",
        "total": 5000.0
      }
    ],
    "byPaymentSource": [
      {
        "paymentSource": "PAID_IN_GHANA",
        "count": 180,
        "totalAmount": 90000.0,
        "totalLocalAmount": 900000.0
      },
      {
        "paymentSource": "PAID_IN_CHINA",
        "count": 70,
        "totalAmount": 35000.0,
        "totalLocalAmount": 350000.0
      }
    ]
  },
  "totalCount": 250
}
```

### cURL Example

```bash
curl -X GET "https://api.aostp.com/api/v1/reports/payments?fromDate=2025-12-01&toDate=2025-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Export to Excel/CSV

The report data can be processed client-side for export:

```javascript
const response = await fetch(
  '/api/v1/reports/payments?fromDate=2025-12-01&toDate=2025-12-31',
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);

const report = await response.json();

// Use library like xlsx or csv-parse to export
// report.payments contains all payment details
// report.totals.byPaymentSource contains source breakdown
```

---

## Common Error Responses

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Complete Workflow Example

### Scenario: Record payment from Ghana with receipt document

**Step 1: Upload reference document**

```bash
curl -X POST "https://api.aostp.com/api/v1/uploads/payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@bank_receipt.pdf" \
  -F "folder=reference-documents" \
  -F "paymentId=550e8400-e29b-41d4-a716-446655440000"
```

**Response:**

```json
{
  "key": "reference-documents/550e8400-e29b-41d4-a716-446655440000/1734345600_abc.pdf"
}
```

**Step 2: Create payment with document**

```bash
curl -X POST "https://api.aostp.com/api/v1/payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 2500.00,
    "currency": "USD",
    "exchangeRateId": "660e8400-e29b-41d4-a716-446655440001",
    "paymentMethod": "BANK_TRANSFER",
    "paymentSource": "PAID_IN_GHANA",
    "reference": "BANK-TXN-2025-98765",
    "referenceDocumentKey": "reference-documents/550e8400-e29b-41d4-a716-446655440000/1734345600_abc.pdf",
    "invoiceIds": ["770e8400-e29b-41d4-a716-446655440002"]
  }'
```

**Step 3: Verify payment created**

```bash
curl -X GET "https://api.aostp.com/api/v1/payments?paymentSource=PAID_IN_GHANA&limit=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Step 4: Download document (Finance Manager only)**

```bash
curl -X GET "https://api.aostp.com/api/v1/payments/880e8400-e29b-41d4-a716-446655440003/document" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Rate Limiting

All API endpoints are subject to rate limiting:

- **Standard users:** 100 requests per minute
- **Finance users:** 200 requests per minute
- **Admin users:** 500 requests per minute

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1734346200
```

---

## Changelog

### Version 1.1.0 - December 16, 2025

- ✅ Added payment reference document upload (CR-01)
- ✅ Added payment source field (CR-02)
- ✅ Added payment source filter
- ✅ Enhanced payment statistics with source breakdown
- ✅ Updated payment reports to include source grouping
- ✅ Added document download endpoint with role restrictions

---

## Support

For API support and questions:

- **Email:** api-support@aostp.com
- **Documentation:** https://docs.aostp.com
- **Status Page:** https://status.aostp.com

---

**Document Version:** 1.0  
**Last Updated:** December 16, 2025  
**Maintained By:** AOSTP API Team
