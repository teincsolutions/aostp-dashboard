# Payments API Documentation

Complete API documentation for payment processing and management endpoints.

---

## Base URL

```
/api/payments
```

All endpoints require authentication via JWT Bearer token unless marked as `@Public()`.

---

## Overview

The Payments API handles:

- **Payment Processing**: Record customer payments for invoices
- **Multiple Payment Methods**: Cash, Bank Transfer, Mobile Money (Hubtel), Credit Card
- **Exchange Rate Integration**: Automatic currency conversion
- **Invoice Allocation**: Link payments to specific invoices
- **Payment Gateway Integration**: Hubtel payment gateway for mobile money and cards
- **Automatic Receipt Generation**: PDF receipts stored in S3
- **Payment Tracking**: Search, filter, and view payment history
- **Statistics & Reporting**: Payment analytics and insights

---

## Payment Methods

| Method                 | Description                           | Gateway Required | Reference Required |
| ---------------------- | ------------------------------------- | ---------------- | ------------------ |
| `CASH`                 | Cash payment                          | No               | No                 |
| `BANK_TRANSFER`        | Bank wire transfer                    | No               | Optional           |
| `DIRECT_MOMO_TRANSFER` | Direct mobile money transfer (manual) | No               | **Yes**            |
| `MOBILE_MONEY`         | Mobile money via Hubtel gateway       | **Yes**          | No                 |
| `CARD`                 | Credit/debit card via Hubtel gateway  | **Yes**          | No                 |
| `CREDIT_CARD`          | Credit card (legacy)                  | No               | Optional           |

**Important Notes:**

- Gateway payments (`MOBILE_MONEY`, `CARD`) require callback processing
- `DIRECT_MOMO_TRANSFER` requires a transaction reference number
- All payments support decimal precision up to 2 decimal places

---

## Endpoints

### 1. Process Payment

Create a new payment and optionally allocate it to invoices.

**Endpoint:** `POST /payments`

**Required Roles:** `PAYMENT_CLERK`, `FINANCE_MANAGER`, `SUPER_ADMIN`

**Request Body:**

```json
{
  "customerId": "uuid-customer-id",
  "amount": 500.0,
  "currency": "USD",
  "exchangeRateId": "uuid-exchange-rate-id",
  "paymentMethod": "CASH",
  "reference": "TXN-123456789",
  "invoiceIds": ["uuid-invoice-1", "uuid-invoice-2"],
  "notes": "Payment for November invoices"
}
```

**Request Body Fields:**

| Field            | Type          | Required | Description                                                         |
| ---------------- | ------------- | -------- | ------------------------------------------------------------------- |
| `customerId`     | string (UUID) | Yes      | Customer making the payment                                         |
| `amount`         | number        | Yes      | Payment amount (minimum 0.01, max 2 decimal places)                 |
| `currency`       | string        | Yes      | Currency code (e.g., USD, GHS, CNY)                                 |
| `exchangeRateId` | string (UUID) | Yes      | Active exchange rate to use for conversion                          |
| `paymentMethod`  | string        | Yes      | Payment method (see table above)                                    |
| `reference`      | string        | No\*     | Transaction reference (\*Required for DIRECT_MOMO_TRANSFER)         |
| `invoiceIds`     | array[UUID]   | No       | Invoice IDs to allocate payment to (auto-allocated if not provided) |
| `notes`          | string        | No       | Additional notes or comments                                        |

**Response (Cash/Bank Transfer - 201):**

```json
{
  "id": "uuid-payment-id",
  "paymentCode": "PAY-20251204-ABC123",
  "customerId": "uuid-customer-id",
  "amount": 500.0,
  "currency": "USD",
  "exchangeRateId": "uuid-exchange-rate-id",
  "exchangeRate": {
    "id": "uuid-exchange-rate-id",
    "fromCurrency": "USD",
    "toCurrency": "GHS",
    "rate": 12.5,
    "effectiveFrom": "2025-12-01T00:00:00.000Z"
  },
  "localAmount": 6250.0,
  "paymentMethod": "CASH",
  "reference": "TXN-123456789",
  "gatewayTransactionId": null,
  "gatewayStatus": null,
  "notes": "Payment for November invoices",
  "processedById": "uuid-user-id",
  "processedBy": {
    "id": "uuid-user-id",
    "firstName": "John",
    "lastName": "Clerk",
    "role": "PAYMENT_CLERK"
  },
  "processedAt": "2025-12-04T14:30:00.000Z",
  "receiptKey": "receipts/payments/PAY-20251204-ABC123.pdf",
  "invoices": [
    {
      "id": "uuid-invoice-1",
      "invoiceNumber": "INV-2025-001",
      "totalAmount": 300.0,
      "paidAmount": 300.0,
      "status": "PAID"
    },
    {
      "id": "uuid-invoice-2",
      "invoiceNumber": "INV-2025-002",
      "totalAmount": 250.0,
      "paidAmount": 200.0,
      "status": "PARTIALLY_PAID"
    }
  ],
  "createdAt": "2025-12-04T14:30:00.000Z"
}
```

**Response (Gateway Payment - 201):**

For `MOBILE_MONEY` or `CARD` payments, response includes gateway checkout information:

```json
{
  "payment": {
    "id": "uuid-payment-id",
    "paymentCode": "PAY-20251204-XYZ789",
    "amount": 500.0,
    "currency": "USD",
    "paymentMethod": "MOBILE_MONEY",
    "gatewayTransactionId": "hubtel-checkout-id-12345",
    "gatewayStatus": "PENDING"
  },
  "checkoutUrl": "https://checkout.hubtel.com/checkout/invoice/12345",
  "checkoutId": "hubtel-checkout-id-12345"
}
```

**Payment Allocation Logic:**

1. If `invoiceIds` provided: Payment is allocated to specified invoices in order
2. If `invoiceIds` not provided: Payment is auto-allocated to oldest UNPAID invoices first
3. Remaining amount after full invoice payment is carried over to next invoice
4. Overpayment is allowed (invoice balance becomes negative)

**Error Responses:**

```json
// 404 - Customer not found
{
  "statusCode": 404,
  "message": "Customer not found"
}

// 404 - Exchange rate not found
{
  "statusCode": 404,
  "message": "Exchange rate not found"
}

// 400 - Invalid amount
{
  "statusCode": 400,
  "message": "Payment amount must have at most 2 decimal places"
}

// 400 - Missing reference for Direct Momo
{
  "statusCode": 400,
  "message": "Reference is required for Direct Momo Transfer payments"
}
```

---

### 2. Payment Gateway Callback

**⚠️ Public endpoint** - Used by payment gateways to notify payment status.

**Endpoint:** `POST /payments/hubtel/callback/:token`

**Authentication:** None (public) - Uses signed token verification

**Path Parameters:**

- `token` (string, required) - Signed callback token for verification

**Request Body:** Gateway-specific callback data

**Hubtel Callback Example:**

```json
{
  "ResponseCode": "0000",
  "Data": {
    "TransactionId": "hubtel-txn-12345",
    "ClientReference": "PAY-20251204-XYZ789",
    "Amount": 500.0,
    "Status": "Success"
  }
}
```

**Response:**

```json
{
  "status": "success"
}
```

**How It Works:**

1. Gateway sends callback with signed token in URL
2. System verifies token authenticity and extracts payment info
3. System updates payment status based on gateway response
4. If payment successful, invoices are updated automatically
5. Payment receipt is generated and stored

**Error Responses:**

```json
// 401 - Invalid token
{
  "statusCode": 401,
  "message": "Invalid callback token"
}

// 400 - Invalid callback data
{
  "statusCode": 400,
  "message": "Invalid callback data"
}
```

---

### 3. Get All Payments (with Filtering & Pagination)

Retrieve paginated list of payments with advanced filtering.

**Endpoint:** `GET /payments`

**Required Roles:** `PAYMENT_CLERK`, `FINANCE_MANAGER`, `SUPER_ADMIN`

**Query Parameters:**

| Parameter       | Type   | Required | Description                                                                |
| --------------- | ------ | -------- | -------------------------------------------------------------------------- |
| `page`          | number | No       | Page number (default: 1)                                                   |
| `limit`         | number | No       | Items per page (default: 20)                                               |
| `sortBy`        | string | No       | Field to sort by (default: processedAt)                                    |
| `sortOrder`     | string | No       | Sort order: `asc` or `desc` (default: desc)                                |
| `customerId`    | string | No       | Filter by customer ID                                                      |
| `paymentMethod` | string | No       | Filter by payment method                                                   |
| `currency`      | string | No       | Filter by currency code                                                    |
| `dateFrom`      | string | No       | Filter from date (ISO format)                                              |
| `dateTo`        | string | No       | Filter to date (ISO format)                                                |
| `packingListId` | string | No       | Filter by packing list ID (payments for invoices in specific packing list) |
| `warehouseId`   | string | No       | Filter by warehouse ID (payments for packages in specific warehouse)       |

**Example Requests:**

```bash
# Filter by payment method and date range
GET /api/payments?page=1&limit=20&paymentMethod=CASH&dateFrom=2025-12-01&dateTo=2025-12-31

# Filter by packing list
GET /api/payments?packingListId=uuid-packing-list-123

# Filter by warehouse
GET /api/payments?warehouseId=uuid-warehouse-456
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid-payment-id",
      "paymentCode": "PAY-20251204-ABC123",
      "customerId": "uuid-customer-id",
      "customer": {
        "id": "uuid-customer-id",
        "customerCode": "JOH12567",
        "firstName": "John",
        "lastName": "Doe",
        "phoneNumber": "+233501234567"
      },
      "amount": 500.0,
      "currency": "USD",
      "localAmount": 6250.0,
      "paymentMethod": "CASH",
      "reference": "TXN-123456789",
      "gatewayTransactionId": null,
      "gatewayStatus": null,
      "processedAt": "2025-12-04T14:30:00.000Z",
      "processedBy": {
        "firstName": "Jane",
        "lastName": "Clerk"
      },
      "_count": {
        "invoices": 2
      }
    }
  ],
  "meta": {
    "total": 156,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Filter Examples:**

```bash
# All cash payments
GET /api/payments?paymentMethod=CASH

# Payments in USD
GET /api/payments?currency=USD

# Customer's payments
GET /api/payments?customerId=uuid-customer-id

# Date range
GET /api/payments?dateFrom=2025-12-01&dateTo=2025-12-31

# Combined filters
GET /api/payments?paymentMethod=MOBILE_MONEY&dateFrom=2025-12-01&currency=GHS
```

---

### 4. Get Payment Statistics

Retrieve payment analytics and statistics.

**Endpoint:** `GET /payments/stats`

**Required Roles:** `FINANCE_MANAGER`, `SUPER_ADMIN`

**Query Parameters:**

| Parameter    | Type   | Required | Description              |
| ------------ | ------ | -------- | ------------------------ |
| `dateFrom`   | string | No       | Start date (ISO format)  |
| `dateTo`     | string | No       | End date (ISO format)    |
| `customerId` | string | No       | Filter stats by customer |

**Example Request:**

```bash
GET /api/payments/stats?dateFrom=2025-12-01&dateTo=2025-12-31
```

**Response:**

```json
{
  "period": {
    "from": "2025-12-01T00:00:00.000Z",
    "to": "2025-12-31T23:59:59.999Z"
  },
  "summary": {
    "totalPayments": 150,
    "totalAmount": 45000.0,
    "totalLocalAmount": 562500.0,
    "currencies": ["USD", "GHS", "CNY"],
    "averagePayment": 300.0
  },
  "byMethod": {
    "CASH": {
      "count": 80,
      "amount": 24000.0,
      "percentage": 53.33
    },
    "MOBILE_MONEY": {
      "count": 45,
      "amount": 13500.0,
      "percentage": 30.0
    },
    "BANK_TRANSFER": {
      "count": 20,
      "amount": 6000.0,
      "percentage": 13.33
    },
    "DIRECT_MOMO_TRANSFER": {
      "count": 5,
      "amount": 1500.0,
      "percentage": 3.33
    }
  },
  "byCurrency": {
    "USD": {
      "count": 100,
      "amount": 30000.0
    },
    "GHS": {
      "count": 30,
      "amount": 9000.0
    },
    "CNY": {
      "count": 20,
      "amount": 6000.0
    }
  },
  "gatewayStatus": {
    "PENDING": 5,
    "COMPLETED": 40,
    "FAILED": 2
  },
  "topCustomers": [
    {
      "customerId": "uuid-1",
      "customerCode": "JOH12567",
      "customerName": "John Doe",
      "totalPayments": 5,
      "totalAmount": 2500.0
    }
  ]
}
```

---

### 5. Get Customer Payments

Retrieve all payments for a specific customer.

**Endpoint:** `GET /payments/customer/:customerId`

**Required Roles:** `PAYMENT_CLERK`, `FINANCE_MANAGER`, `SUPER_ADMIN`, `CUSTOMER`

**Path Parameters:**

- `customerId` (string, required) - Customer UUID

**Query Parameters:**

| Parameter | Type   | Required | Description                  |
| --------- | ------ | -------- | ---------------------------- |
| `page`    | number | No       | Page number (default: 1)     |
| `limit`   | number | No       | Items per page (default: 20) |

**Example Request:**

```bash
GET /api/payments/customer/uuid-customer-id?page=1&limit=20
```

**Response:** Same structure as "Get All Payments"

---

### 6. Get Payment by Payment Code

Retrieve a payment by its unique payment code.

**Endpoint:** `GET /payments/code/:paymentCode`

**Required Roles:** `PAYMENT_CLERK`, `FINANCE_MANAGER`, `SUPER_ADMIN`, `CUSTOMER`

**Path Parameters:**

- `paymentCode` (string, required) - Payment code (e.g., PAY-20251204-ABC123)

**Example Request:**

```bash
GET /api/payments/code/PAY-20251204-ABC123
```

**Response:**

```json
{
  "id": "uuid-payment-id",
  "paymentCode": "PAY-20251204-ABC123",
  "customerId": "uuid-customer-id",
  "customer": {
    "id": "uuid-customer-id",
    "customerCode": "JOH12567",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+233501234567"
  },
  "amount": 500.0,
  "currency": "USD",
  "exchangeRateId": "uuid-exchange-rate-id",
  "exchangeRate": {
    "fromCurrency": "USD",
    "toCurrency": "GHS",
    "rate": 12.5
  },
  "localAmount": 6250.0,
  "paymentMethod": "CASH",
  "reference": "TXN-123456789",
  "gatewayTransactionId": null,
  "gatewayStatus": null,
  "notes": "Payment for November invoices",
  "receiptKey": "receipts/payments/PAY-20251204-ABC123.pdf",
  "processedById": "uuid-user-id",
  "processedBy": {
    "id": "uuid-user-id",
    "firstName": "Jane",
    "lastName": "Clerk",
    "email": "jane.clerk@company.com",
    "role": "PAYMENT_CLERK"
  },
  "processedAt": "2025-12-04T14:30:00.000Z",
  "invoices": [
    {
      "id": "uuid-invoice-1",
      "invoiceNumber": "INV-2025-001",
      "totalAmount": 300.0,
      "paidAmount": 300.0,
      "balance": 0.0,
      "status": "PAID"
    },
    {
      "id": "uuid-invoice-2",
      "invoiceNumber": "INV-2025-002",
      "totalAmount": 250.0,
      "paidAmount": 200.0,
      "balance": 50.0,
      "status": "PARTIALLY_PAID"
    }
  ],
  "createdAt": "2025-12-04T14:30:00.000Z"
}
```

---

### 7. Get Payment by ID

Retrieve detailed payment information by ID.

**Endpoint:** `GET /payments/:id`

**Required Roles:** `PAYMENT_CLERK`, `FINANCE_MANAGER`, `SUPER_ADMIN`

**Path Parameters:**

- `id` (string, required) - Payment UUID

**Example Request:**

```bash
GET /api/payments/uuid-payment-id
```

**Response:** Same structure as "Get Payment by Payment Code"

---

### 8. Update Payment

Update payment information (limited fields).

**Endpoint:** `PATCH /payments/:id`

**Required Roles:** `PAYMENT_CLERK`, `FINANCE_MANAGER`, `SUPER_ADMIN`

**Path Parameters:**

- `id` (string, required) - Payment UUID

**Request Body:**

All fields are optional. Only include fields to update.

```json
{
  "reference": "UPDATED-TXN-987654321",
  "notes": "Updated payment notes"
}
```

**Updatable Fields:**

| Field       | Type   | Description           |
| ----------- | ------ | --------------------- |
| `reference` | string | Transaction reference |
| `notes`     | string | Payment notes         |

**Response:** Updated payment object (same structure as GET)

**Notes:**

- Cannot update `amount`, `currency`, or `paymentMethod` after creation
- Cannot update gateway-related fields
- Cannot change invoice allocations

---

### 9. Get Payment Receipt

Retrieve the payment receipt PDF URL.

**Endpoint:** `GET /payments/:id/receipt`

**Required Roles:** `PAYMENT_CLERK`, `FINANCE_MANAGER`, `SUPER_ADMIN`, `CUSTOMER`

**Path Parameters:**

- `id` (string, required) - Payment UUID

**Example Request:**

```bash
GET /api/payments/uuid-payment-id/receipt
```

**Response:**

```json
{
  "url": "https://s3.amazonaws.com/bucket/receipts/payments/PAY-20251204-ABC123.pdf?signature=xyz",
  "key": "receipts/payments/PAY-20251204-ABC123.pdf"
}
```

**Notes:**

- Receipt is auto-generated when payment is created
- If receipt doesn't exist, system attempts to generate one
- URL is pre-signed and expires after a certain time
- PDF includes: payment details, customer info, invoice allocation, exchange rate

**Error Response (404):**

```json
{
  "statusCode": 404,
  "message": "Receipt not found and could not be generated"
}
```

---

## Payment Workflows

### Workflow 1: Cash Payment

```bash
# Step 1: Get active exchange rate
GET /api/exchange-rates?isActive=true&toCurrency=GHS

# Step 2: Process payment
POST /api/payments
{
  "customerId": "uuid-customer-id",
  "amount": 500.00,
  "currency": "USD",
  "exchangeRateId": "uuid-exchange-rate-id",
  "paymentMethod": "CASH",
  "invoiceIds": ["uuid-invoice-1", "uuid-invoice-2"]
}

# Step 3: Get receipt
GET /api/payments/{paymentId}/receipt
```

---

### Workflow 2: Mobile Money (Gateway Payment)

```bash
# Step 1: Initiate payment
POST /api/payments
{
  "customerId": "uuid-customer-id",
  "amount": 500.00,
  "currency": "GHS",
  "exchangeRateId": "uuid-exchange-rate-id",
  "paymentMethod": "MOBILE_MONEY"
}

# Response includes checkoutUrl
{
  "payment": { "paymentCode": "PAY-20251204-XYZ789", ... },
  "checkoutUrl": "https://checkout.hubtel.com/checkout/invoice/12345"
}

# Step 2: Customer completes payment on gateway

# Step 3: Gateway sends callback to /payments/hubtel/callback/:token
# System automatically updates payment and invoice status

# Step 4: Check payment status
GET /api/payments/code/PAY-20251204-XYZ789
```

---

### Workflow 3: Direct Momo Transfer (Manual)

```bash
# Customer sends mobile money directly, provides reference

# Step 1: Record payment with reference
POST /api/payments
{
  "customerId": "uuid-customer-id",
  "amount": 500.00,
  "currency": "GHS",
  "exchangeRateId": "uuid-exchange-rate-id",
  "paymentMethod": "DIRECT_MOMO_TRANSFER",
  "reference": "MTN-TXN-123456789"  # Required!
}

# Payment is immediately confirmed (no gateway callback needed)
```

---

### Workflow 4: Payment Allocation

```bash
# Scenario: Customer has 3 unpaid invoices
# INV-001: $200
# INV-002: $300
# INV-003: $150

# Option A: Auto-allocation (oldest first)
POST /api/payments
{
  "customerId": "uuid",
  "amount": 550.00,
  "currency": "USD",
  ...
  # No invoiceIds specified
}

# Result:
# - INV-001: PAID ($200)
# - INV-002: PAID ($300)
# - INV-003: PARTIALLY_PAID ($50 of $150)

# Option B: Manual allocation
POST /api/payments
{
  "customerId": "uuid",
  "amount": 550.00,
  "currency": "USD",
  ...
  "invoiceIds": ["inv-002-uuid", "inv-003-uuid"]
}

# Result:
# - INV-001: UNPAID (unchanged)
# - INV-002: PAID ($300)
# - INV-003: PAID ($150), plus $100 overpayment
```

---

## Payment Gateway Integration

### Supported Gateways

Currently integrated: **Hubtel (Ghana)**

**Payment Methods:**

- Mobile Money (MTN, Vodafone, AirtelTigo)
- Visa/Mastercard

### How Gateway Payments Work

1. **Initiation:**
   - Client calls `POST /payments` with `paymentMethod: MOBILE_MONEY` or `CARD`
   - System creates payment record with `gatewayStatus: PENDING`
   - System initiates checkout with Hubtel
   - Returns `checkoutUrl` to client

2. **Customer Payment:**
   - Customer is redirected to gateway checkout page
   - Customer completes payment on gateway

3. **Callback Processing:**
   - Gateway sends callback to `/payments/hubtel/callback/:token`
   - System verifies signed token
   - System updates payment status based on gateway response
   - If successful, invoices are automatically updated

4. **Status Updates:**
   - `PENDING` → Payment initiated, waiting for customer
   - `COMPLETED` → Payment successful
   - `FAILED` → Payment failed or cancelled
   - `REFUNDED` → Payment refunded

### Callback Security

- All callbacks use signed tokens for verification
- Tokens expire after 24 hours
- Includes payment method and code in token
- Prevents replay attacks and unauthorized callbacks

---

## Important Notes

### Decimal Precision

All financial amounts are rounded to 2 decimal places:

- Payment amounts
- Exchange rates
- Local amounts (converted amounts)

**Example:**

```json
{
  "amount": 123.456, // ❌ Invalid - 3 decimals
  "amount": 123.46 // ✅ Valid - rounded to 2 decimals
}
```

### Exchange Rate Handling

- Exchange rate must be **active** at payment time
- System calculates `localAmount = amount * exchangeRate.rate`
- Both amounts are rounded to 2 decimal places
- Exchange rate is locked in payment record (historical reference)

### Payment Code Generation

Format: `PAY-YYYYMMDD-XXXXXX`

- Prefix: `PAY`
- Date: Current date (YYYYMMDD)
- Suffix: Random 6-character alphanumeric

Example: `PAY-20251204-A7B9C2`

### Invoice Status After Payment

| Payment Amount           | Invoice Status   |
| ------------------------ | ---------------- |
| `paidAmount = 0`         | `UNPAID`         |
| `0 < paidAmount < total` | `PARTIALLY_PAID` |
| `paidAmount >= total`    | `PAID`           |

### Receipt Generation

- Automatically generated on payment creation
- Stored in S3: `receipts/payments/{paymentCode}.pdf`
- Includes: payment details, customer info, invoice allocation
- Pre-signed URL valid for 1 hour

---

## Best Practices

### 1. Always Use Active Exchange Rates

```bash
# Get latest active rate
GET /api/exchange-rates?isActive=true&toCurrency=GHS&fromCurrency=USD

# Use the returned exchange rate ID in payment
```

### 2. Handle Gateway Payments Asynchronously

```javascript
// Client-side example
const response = await createPayment({
  paymentMethod: 'MOBILE_MONEY',
  ...
});

if (response.checkoutUrl) {
  // Redirect customer to gateway
  window.location.href = response.checkoutUrl;

  // Poll for payment status (or use webhooks)
  const pollStatus = setInterval(async () => {
    const payment = await getPayment(response.payment.paymentCode);
    if (payment.gatewayStatus === 'COMPLETED') {
      clearInterval(pollStatus);
      showSuccessMessage();
    }
  }, 5000);
}
```

### 3. Provide Transaction References

For `DIRECT_MOMO_TRANSFER`, always include the mobile money transaction reference for audit purposes.

### 4. Use Payment Codes for Customer Communication

Payment codes are customer-friendly and can be shared in:

- SMS notifications
- Email receipts
- Customer support

### 5. Monitor Gateway Payment Status

```bash
# Check payments stuck in PENDING status
GET /api/payments?gatewayStatus=PENDING&dateFrom=2025-12-01
```

### 6. Leverage Payment Statistics

```bash
# Daily revenue check
GET /api/payments/stats?dateFrom=2025-12-04&dateTo=2025-12-04

# Monthly reporting
GET /api/payments/stats?dateFrom=2025-12-01&dateTo=2025-12-31
```

---

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": [
    "amount must be a positive number",
    "Payment amount must have at most 2 decimal places"
  ],
  "error": "Bad Request"
}
```

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

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Payment not found",
  "error": "Not Found"
}
```

---

## Testing Examples

### cURL Examples

```bash
# Create cash payment
curl -X POST "http://localhost:3000/api/payments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "uuid-customer-id",
    "amount": 500.00,
    "currency": "USD",
    "exchangeRateId": "uuid-exchange-rate-id",
    "paymentMethod": "CASH",
    "invoiceIds": ["uuid-invoice-1"]
  }'

# Get all payments with filters
curl -X GET "http://localhost:3000/api/payments?page=1&limit=20&paymentMethod=CASH" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get payment statistics
curl -X GET "http://localhost:3000/api/payments/stats?dateFrom=2025-12-01&dateTo=2025-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get customer payments
curl -X GET "http://localhost:3000/api/payments/customer/uuid-customer-id" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get payment by code
curl -X GET "http://localhost:3000/api/payments/code/PAY-20251204-ABC123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get payment receipt
curl -X GET "http://localhost:3000/api/payments/uuid-payment-id/receipt" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update payment
curl -X PATCH "http://localhost:3000/api/payments/uuid-payment-id" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Updated payment information"
  }'

# Simulate gateway callback (testing only)
curl -X POST "http://localhost:3000/api/payments/hubtel/callback/signed-token" \
  -H "Content-Type: application/json" \
  -d '{
    "ResponseCode": "0000",
    "Data": {
      "TransactionId": "hubtel-txn-12345",
      "ClientReference": "PAY-20251204-XYZ789",
      "Amount": 500.00,
      "Status": "Success"
    }
  }'
```

---

## Troubleshooting

### Common Issues

**1. "Exchange rate not found"**

**Problem:** Invalid or inactive exchange rate ID

**Solution:**

```bash
# Get active exchange rates
GET /api/exchange-rates?isActive=true&toCurrency=GHS
```

---

**2. "Reference is required for Direct Momo Transfer payments"**

**Problem:** Missing transaction reference for DIRECT_MOMO_TRANSFER

**Solution:** Always include reference field:

```json
{
  "paymentMethod": "DIRECT_MOMO_TRANSFER",
  "reference": "MTN-TXN-123456789"
}
```

---

**3. Gateway Payment Stuck in PENDING**

**Problem:** Callback not received or failed

**Possible causes:**

- Customer didn't complete payment
- Network issue with callback
- Callback token expired

**Solution:**

```bash
# Check payment status
GET /api/payments/code/PAY-20251204-XYZ789

# If stuck for >30 minutes, may need manual verification with gateway
```

---

**4. "Payment amount must have at most 2 decimal places"**

**Problem:** Amount has more than 2 decimal places

**Solution:** Round to 2 decimals:

```javascript
const amount = Math.round(rawAmount * 100) / 100;
```

---

**5. Invoice Not Updated After Payment**

**Problem:** For gateway payments, invoice only updates after callback

**Explanation:**

- Gateway payments: Invoice updated after successful callback
- Direct payments: Invoice updated immediately

**Solution:** Check `gatewayStatus`:

- If `PENDING`, wait for callback
- If `COMPLETED`, invoice should be updated
- If `FAILED`, payment didn't go through

---

## Technical Implementation Notes

### Database Schema

**Payment Model:**

```typescript
{
  id: UUID (Primary Key)
  paymentCode: String (Unique, indexed)
  customerId: UUID (Foreign Key → Customer)
  amount: Float (2 decimal places)
  currency: String
  exchangeRateId: UUID (Foreign Key → ExchangeRate)
  localAmount: Float (2 decimal places)
  paymentMethod: String
  reference: String (nullable)
  gatewayTransactionId: String (nullable, indexed)
  gatewayStatus: PaymentGatewayStatus enum (nullable)
  notes: String (nullable)
  receiptKey: String (nullable) // S3 key
  processedById: UUID (Foreign Key → User)
  processedAt: DateTime
  createdAt: DateTime
}
```

**Relationships:**

- `customer` → Many-to-One with Customer
- `exchangeRate` → Many-to-One with ExchangeRate
- `processedBy` → Many-to-One with User
- `invoices` → Many-to-Many with Invoice (junction table)

**Indexes:**

- `paymentCode` (unique)
- `customerId`
- `gatewayTransactionId`
- `processedAt`
- `paymentMethod`

### Payment Gateway Status Enum

```typescript
enum PaymentGatewayStatus {
  PENDING     // Payment initiated, awaiting customer action
  COMPLETED   // Payment successful
  FAILED      // Payment failed or cancelled
  CANCELLED   // Payment cancelled by customer
  REFUNDED    // Payment refunded
}
```

---

## Changelog

### Version 1.1.0 (December 2025)

- ✅ Added decimal precision validation (2 decimal places)
- ✅ Automatic rounding for all financial amounts
- ✅ Enhanced error messages for decimal validation
- ✅ Updated payment receipt generation with precise amounts

### Version 1.0.0 (November 2025)

- Initial payment API implementation
- Multiple payment methods support
- Hubtel gateway integration
- Automatic invoice allocation
- Payment receipt generation (PDF)
- Statistics and reporting endpoints
- Signed callback token verification
- Exchange rate integration
- Payment tracking and history
