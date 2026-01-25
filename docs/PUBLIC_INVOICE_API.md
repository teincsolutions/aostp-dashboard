# Public Invoice API

This document describes the public invoice endpoints that allow customers to access their invoices without authentication. These endpoints are designed to be used via links sent in SMS/WhatsApp notifications.

## Base URL

```
/public/invoices
```

---

## Endpoints

### 1. Get Invoice by Access Token

Retrieve invoice details using a unique access token. No authentication required.

**Endpoint:** `GET /public/invoices/:accessToken`

**Parameters:**

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| accessToken | string | path | Yes | Unique access token for the invoice (UUID format) |

**Response:** `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "invoiceNumber": "INV-2026-001",
  "totalAmount": 150.00,
  "currency": "USD",
  "exchangeRate": 14.5,
  "localAmount": 2175.00,
  "status": "UNPAID",
  "dueDate": "2026-02-15T00:00:00.000Z",
  "paidAmount": 0,
  "balance": 150.00,
  "notes": "Shipping charges for package PKG-001",
  "createdAt": "2026-01-20T10:30:00.000Z",
  "customer": {
    "customerCode": "JOHN-12345",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+233501234567",
    "email": "john.doe@example.com"
  },
  "packingList": {
    "name": "PL-2026-001",
    "eta": "2026-02-01T00:00:00.000Z"
  },
  "package": {
    "trackingCode": "PKG-2026-001",
    "description": "Electronics - Laptop",
    "weight": 2.5,
    "cbm": 0.05,
    "shippingMode": "AIR",
    "quantity": 1
  },
  "payments": [
    {
      "id": "payment-uuid",
      "paymentCode": "PAY-2026-001",
      "amount": 50.00,
      "currency": "USD",
      "localAmount": 725.00,
      "paymentMethod": "MOBILE_MONEY",
      "processedAt": "2026-01-22T14:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

| Status Code | Description |
|-------------|-------------|
| 404 | Invoice not found - Invalid or expired access token |

```json
{
  "statusCode": 404,
  "message": "Invoice not found",
  "error": "Not Found"
}
```

---

### 2. Download Invoice PDF

Get a signed URL to download the invoice PDF. No authentication required.

**Endpoint:** `GET /public/invoices/:accessToken/pdf`

**Parameters:**

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| accessToken | string | path | Yes | Unique access token for the invoice (UUID format) |

**Response:** `200 OK`

```json
{
  "url": "https://s3.amazonaws.com/bucket/invoices/inv-123.pdf?signature=..."
}
```

The returned URL is a pre-signed S3 URL that is valid for a limited time (typically 15 minutes).

**Error Responses:**

| Status Code | Description |
|-------------|-------------|
| 404 | Invoice not found or PDF not available |

```json
{
  "statusCode": 404,
  "message": "Invoice not found"
}
```

```json
{
  "statusCode": 404,
  "message": "Couldn't generate PDF for invoice INV-2026-001"
}
```

---

## Data Types

### Invoice Status

| Value | Description |
|-------|-------------|
| UNPAID | Invoice has not been paid |
| PARTIAL | Invoice has been partially paid |
| PAID | Invoice has been fully paid |
| OVERDUE | Invoice is past due date |
| CANCELLED | Invoice has been cancelled |

### Shipping Mode

| Value | Description |
|-------|-------------|
| AIR | Air freight shipping |
| SEA | Sea freight shipping |

---

## Usage Example

### Frontend Integration

The public invoice URL format is:
```
{FRONTEND_URL}/invoice/{accessToken}
```

Example:
```
https://app.aostp.com/invoice/550e8400-e29b-41d4-a716-446655440000
```

### SMS/WhatsApp Message Example

When an invoice is issued, customers receive:
```
Hi John, invoice INV-2026-001 for USD150 is due 2/15/2026. View your invoice: https://app.aostp.com/invoice/550e8400-e29b-41d4-a716-446655440000
```

### Fetching Invoice in Frontend

```javascript
// Fetch invoice details
const response = await fetch(`/api/public/invoices/${accessToken}`);
const invoice = await response.json();

// Download PDF
const pdfResponse = await fetch(`/api/public/invoices/${accessToken}/pdf`);
const { url } = await pdfResponse.json();
window.open(url, '_blank'); // Opens PDF in new tab
```

---

## Environment Configuration

Add the following to your `.env` file:

```env
# Frontend URL for generating public invoice links
FRONTEND_URL=https://app.aostp.com
```

---

## Security Considerations

1. **Access Token**: Each invoice has a unique UUID access token that acts as a secure, unguessable link
2. **No Authentication**: These endpoints are intentionally public to allow customers without accounts to view their invoices
3. **Limited Data**: Only non-sensitive invoice information is exposed (no internal IDs, user data, or system information)
4. **Signed URLs**: PDF download URLs are pre-signed and expire after a short time
5. **Rate Limiting**: Standard API rate limiting applies to prevent abuse
