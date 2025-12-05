# Invoice API Documentation

Complete API documentation for invoice management endpoints.

---

## Base URL

```
/api/invoices
```

All endpoints require authentication via JWT Bearer token.

---

## Endpoints

### 1. Generate Invoices from Packing List

Generate invoices for all packages in a packing list.

**Endpoint:** `POST /invoices/generate/:packingListId`

**Required Roles:** `OPERATIONS_CLERK`, `SUPER_ADMIN`

**Path Parameters:**

- `packingListId` (string, required) - UUID of the packing list

**Response:**

```json
{
  "message": "Generated 5 invoice(s)",
  "data": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-2025-001234",
      "customerId": "uuid",
      "packingListId": "uuid",
      "packageId": "uuid",
      "totalAmount": 150.5,
      "currency": "USD",
      "localAmount": 0,
      "paidAmount": 0,
      "balance": 150.5,
      "status": "UNPAID",
      "dueDate": "2025-12-31T00:00:00.000Z",
      "invoicePdfKey": "invoices/INV-2025-001234.pdf",
      "notes": "Invoice for package AOSTP-20251204-ABC123",
      "createdAt": "2025-12-04T10:00:00.000Z",
      "updatedAt": "2025-12-04T10:00:00.000Z",
      "customer": {
        "id": "uuid",
        "customerCode": "CUST-001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phoneNumber": "+233123456789"
      },
      "package": {
        "id": "uuid",
        "trackingCode": "AOSTP-20251204-ABC123",
        "description": "Electronics",
        "weight": 25.5,
        "cbm": 0.5
      }
    }
  ]
}
```

---

### 2. Get All Invoices (with Filtering & Pagination)

Retrieve all invoices with advanced filtering options.

**Endpoint:** `GET /invoices`

**Required Roles:** `OPERATIONS_CLERK`, `FINANCE_MANAGER`, `PAYMENT_CLERK`, `SUPER_ADMIN`

**Query Parameters:**

| Parameter       | Type              | Required | Description                                                                                                                                 |
| --------------- | ----------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `page`          | number            | No       | Page number (default: 1)                                                                                                                    |
| `limit`         | number            | No       | Items per page (default: 20)                                                                                                                |
| `customerId`    | string (UUID)     | No       | Filter by customer ID                                                                                                                       |
| `status`        | string            | No       | Filter by invoice status: `UNPAID`, `PARTIALLY_PAID`, `PAID`                                                                                |
| `packingListId` | string (UUID)     | No       | Filter by packing list ID                                                                                                                   |
| `dateFrom`      | string (ISO date) | No       | Filter invoices created from this date                                                                                                      |
| `dateTo`        | string (ISO date) | No       | Filter invoices created until this date                                                                                                     |
| `search`        | string            | No       | Search across invoice number, package tracking code, pickup code, packing list name, and container number (partial match, case-insensitive) |

**Example Request:**

```bash
GET /api/invoices?page=1&limit=20&status=UNPAID&customerId=uuid&search=AOSTP-20251204
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "invoiceNumber": "INV-2025-001234",
      "customerId": "uuid",
      "packingListId": "uuid",
      "packageId": "uuid",
      "totalAmount": 150.5,
      "currency": "USD",
      "localAmount": 0,
      "paidAmount": 0,
      "balance": 150.5,
      "status": "UNPAID",
      "dueDate": "2025-12-31T00:00:00.000Z",
      "invoicePdfKey": "invoices/INV-2025-001234.pdf",
      "notes": "Invoice for package AOSTP-20251204-ABC123",
      "createdAt": "2025-12-04T10:00:00.000Z",
      "updatedAt": "2025-12-04T10:00:00.000Z",
      "customer": {
        "customerCode": "CUST-001",
        "firstName": "John",
        "lastName": "Doe"
      },
      "packingList": {
        "id": "uuid",
        "name": "PL-2025-001",
        "container": {
          "containerNumber": "CONT-123456"
        }
      },
      "package": {
        "id": "uuid",
        "trackingCode": "AOSTP-20251204-ABC123",
        "description": "Electronics",
        "weight": 25.5,
        "cbm": 0.5
      },
      "payments": [
        {
          "id": "uuid",
          "amount": 50.0,
          "currency": "USD",
          "processedAt": "2025-12-04T12:00:00.000Z"
        }
      ]
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

**Filter Examples:**

1. **Filter by status and date range:**

   ```
   GET /api/invoices?status=UNPAID&dateFrom=2025-01-01&dateTo=2025-12-31
   ```

2. **Filter by customer and packing list:**

   ```
   GET /api/invoices?customerId=uuid&packingListId=uuid
   ```

3. **Search by package tracking code:**

   ```
   GET /api/invoices?search=AOSTP-20251204-ABC123
   ```

4. **Search by pickup code:**

   ```
   GET /api/invoices?search=PICK-123456
   ```

5. **Search by packing list name:**

   ```
   GET /api/invoices?search=PL-2025
   ```

6. **Search by container number:**

   ```
   GET /api/invoices?search=CONT-123456
   ```

7. **Search by invoice number:**

   ```
   GET /api/invoices?search=INV-2025-001234
   ```

8. **Combined filters:**
   ```
   GET /api/invoices?status=PARTIALLY_PAID&search=PL-2025&page=1&limit=50
   ```

---

### 3. Get Pending Invoices

Retrieve all unpaid or partially paid invoices.

**Endpoint:** `GET /invoices/pending`

**Required Roles:** `FINANCE_MANAGER`, `PAYMENT_CLERK`, `SUPER_ADMIN`

**Query Parameters:**

- `customerId` (string, optional) - Filter by customer ID

**Example Request:**

```bash
GET /api/invoices/pending?customerId=uuid
```

**Response:**

```json
[
  {
    "id": "uuid",
    "invoiceNumber": "INV-2025-001234",
    "totalAmount": 150.5,
    "paidAmount": 50.0,
    "balance": 100.5,
    "status": "PARTIALLY_PAID",
    "dueDate": "2025-12-31T00:00:00.000Z",
    "customer": {
      "customerCode": "CUST-001",
      "firstName": "John",
      "lastName": "Doe"
    },
    "packingList": {
      "name": "PL-2025-001"
    }
  }
]
```

---

### 4. Get Customer Invoices

Retrieve all invoices for a specific customer.

**Endpoint:** `GET /invoices/customer/:customerId`

**Required Roles:** `OPERATIONS_CLERK`, `FINANCE_MANAGER`, `PAYMENT_CLERK`, `SUPER_ADMIN`, `CUSTOMER`

**Path Parameters:**

- `customerId` (string, required) - UUID of the customer

**Query Parameters:**

- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 20)

**Example Request:**

```bash
GET /api/invoices/customer/uuid?page=1&limit=10
```

**Response:** Same structure as "Get All Invoices"

---

### 5. Get Invoice by ID

Retrieve detailed information about a specific invoice.

**Endpoint:** `GET /invoices/:id`

**Required Roles:** `OPERATIONS_CLERK`, `FINANCE_MANAGER`, `PAYMENT_CLERK`, `SUPER_ADMIN`, `CUSTOMER`

**Path Parameters:**

- `id` (string, required) - UUID of the invoice

**Example Request:**

```bash
GET /api/invoices/uuid
```

**Response:**

```json
{
  "id": "uuid",
  "invoiceNumber": "INV-2025-001234",
  "customerId": "uuid",
  "packingListId": "uuid",
  "packageId": "uuid",
  "totalAmount": 150.5,
  "currency": "USD",
  "localAmount": 0,
  "paidAmount": 50.0,
  "balance": 100.5,
  "status": "PARTIALLY_PAID",
  "dueDate": "2025-12-31T00:00:00.000Z",
  "invoicePdfKey": "invoices/INV-2025-001234.pdf",
  "notes": "Updated due to package AOSTP-20251204-ABC123 update",
  "createdAt": "2025-12-04T10:00:00.000Z",
  "updatedAt": "2025-12-04T14:00:00.000Z",
  "customer": {
    "id": "uuid",
    "customerCode": "CUST-001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "+233123456789"
  },
  "packingList": {
    "id": "uuid",
    "name": "PL-2025-001",
    "loadingDate": "2025-12-01T00:00:00.000Z",
    "container": {
      "containerNumber": "CONT-123456",
      "departureCity": {
        "name": "Guangzhou"
      },
      "destinationCity": {
        "name": "Accra"
      }
    }
  },
  "package": {
    "id": "uuid",
    "trackingCode": "AOSTP-20251204-ABC123",
    "description": "Electronics",
    "weight": 25.5,
    "cbm": 0.5,
    "pickupCode": "PICK-123456",
    "items": [
      {
        "id": "uuid",
        "description": "Laptop",
        "quantity": 2
      }
    ],
    "warehouse": {
      "name": "Main Warehouse"
    }
  },
  "payments": [
    {
      "id": "uuid",
      "paymentCode": "PAY-2025-001",
      "amount": 50.0,
      "currency": "USD",
      "paymentMethod": "MOBILE_MONEY",
      "processedAt": "2025-12-04T12:00:00.000Z",
      "processedBy": {
        "firstName": "Admin",
        "lastName": "User"
      }
    }
  ]
}
```

---

### 6. Update Invoice

Update invoice details (notes, due date, etc.).

**Endpoint:** `PATCH /invoices/:id`

**Required Roles:** `OPERATIONS_CLERK`, `FINANCE_MANAGER`, `SUPER_ADMIN`

**Path Parameters:**

- `id` (string, required) - UUID of the invoice

**Request Body:**

```json
{
  "dueDate": "2025-12-31T00:00:00.000Z",
  "notes": "Updated payment terms",
  "status": "PAID",
  "paidAmount": 150.5
}
```

**Request Body Fields:**

- `dueDate` (string, optional) - ISO date string
- `notes` (string, optional) - Additional notes
- `status` (string, optional) - Invoice status: `UNPAID`, `PARTIALLY_PAID`, `PAID`
- `paidAmount` (number, optional) - Amount paid (minimum: 0)

**Response:** Same structure as "Get Invoice by ID"

**Important Notes:**

- **Manual status updates:** You can manually set the invoice status and paidAmount through this endpoint for administrative corrections.
- **Automatic updates:** When payments are processed through the payments API or when the linked package is updated, the invoice status, paidAmount, balance, and totalAmount are automatically recalculated.
- **Use case:** This manual update is useful for:
  - Correcting data entry errors
  - Marking invoices as paid when payment was received outside the system
  - Administrative adjustments
  - Updating due dates or notes

---

### 7. Download Invoice PDF

Get a signed URL to download the invoice PDF.

**Endpoint:** `GET /invoices/:id/download-pdf`

**Required Roles:** `OPERATIONS_CLERK`, `FINANCE_MANAGER`, `PAYMENT_CLERK`, `SUPER_ADMIN`, `CUSTOMER`

**Path Parameters:**

- `id` (string, required) - UUID of the invoice

**Example Request:**

```bash
GET /api/invoices/uuid/download-pdf
```

**Response:**

```json
{
  "url": "https://cdn.example.com/invoices/INV-2025-001234.pdf?signature=xyz"
}
```

**Note:** If the PDF doesn't exist, it will be generated on-the-fly.

---

### 8. Regenerate Invoice PDF

Force regeneration of the invoice PDF with latest data.

**Endpoint:** `POST /invoices/:id/regenerate-pdf`

**Required Roles:** `OPERATIONS_CLERK`, `FINANCE_MANAGER`, `SUPER_ADMIN`

**Path Parameters:**

- `id` (string, required) - UUID of the invoice

**Example Request:**

```bash
POST /api/invoices/uuid/regenerate-pdf
```

**Response:**

```json
{
  "message": "Invoice PDF regenerated successfully",
  "url": "https://cdn.example.com/invoices/INV-2025-001234.pdf?signature=xyz",
  "key": "invoices/INV-2025-001234.pdf"
}
```

**Use Cases:**

- Invoice data was updated (amounts, customer info, etc.)
- Package information changed
- Need to reflect latest payment status

---

### 9. Delete Invoice

Delete an invoice (only if no payments exist).

**Endpoint:** `DELETE /invoices/:id`

**Required Roles:** `FINANCE_MANAGER`, `SUPER_ADMIN`

**Path Parameters:**

- `id` (string, required) - UUID of the invoice

**Example Request:**

```bash
DELETE /api/invoices/uuid
```

**Response:**

```json
{
  "id": "uuid",
  "invoiceNumber": "INV-2025-001234",
  "status": "UNPAID"
}
```

**Error Response (400):**

```json
{
  "statusCode": 400,
  "message": "Cannot delete invoice that has associated payments"
}
```

---

## Invoice Status Values

| Status           | Description                              |
| ---------------- | ---------------------------------------- |
| `UNPAID`         | No payments received                     |
| `PARTIALLY_PAID` | Some payment received, balance remaining |
| `PAID`           | Fully paid                               |

---

## Important Notes

### Automatic Invoice Updates

When a package is updated (shipping cost, currency, dimensions, etc.), the linked invoice is **automatically updated** with:

- New `totalAmount` based on package `shippingCost`
- Recalculated `balance` (totalAmount - paidAmount)
- Updated `status` (UNPAID/PARTIALLY_PAID/PAID)
- Updated `currency` from package `shippingCurrency`
- Notes indicating the invoice was updated

All amounts are rounded to **2 decimal places** for consistency.

### Currency and Exchange Rates

- Invoices are created in the package's shipping currency (usually USD)
- `localAmount` is calculated at payment time using the exchange rate
- Exchange rates are managed separately via the `/exchange-rates` endpoints

### Payment Processing

- Invoices are linked to payments via the payments system
- Multiple payments can be applied to a single invoice
- Payment allocation automatically updates invoice `paidAmount`, `balance`, and `status`

### PDF Generation

- Invoice PDFs are generated automatically when invoices are created from packing lists
- PDFs can be regenerated manually if data changes
- PDF URLs are signed and expire after a certain period

---

## Common Workflows

### 1. Generate Invoices for a Container

```bash
# Step 1: Create packing list for container
POST /api/packing-lists
{
  "containerId": "uuid",
  "packages": ["pkg-uuid-1", "pkg-uuid-2"]
}

# Step 2: Generate invoices from packing list
POST /api/invoices/generate/{packingListId}

# Response: Invoices created for each package
```

### 2. Process Payment for Invoice

```bash
# Step 1: Get pending invoices for customer
GET /api/invoices/pending?customerId=uuid

# Step 2: Create payment and link to invoice(s)
POST /api/payments
{
  "customerId": "uuid",
  "amount": 150.50,
  "currency": "USD",
  "exchangeRateId": "uuid",
  "paymentMethod": "MOBILE_MONEY",
  "invoiceIds": ["invoice-uuid-1", "invoice-uuid-2"]
}

# Result: Invoice status and balance automatically updated
```

### 3. Update Package and Invoice

```bash
# Step 1: Update package shipping cost
PATCH /api/packages/{packageId}
{
  "shippingRate": 25.00,
  "weight": 30.5
}

# Result: Linked invoice automatically updated with new total

# Step 2: Regenerate invoice PDF
POST /api/invoices/{invoiceId}/regenerate-pdf
```

### 4. Search and Filter Invoices

```bash
# Find all unpaid invoices for a specific packing list
GET /api/invoices?status=UNPAID&search=PL-2025-001

# Find invoice by package tracking code
GET /api/invoices?search=AOSTP-20251204-ABC123

# Find invoice by pickup code
GET /api/invoices?search=PICK-123456

# Find invoice by container number
GET /api/invoices?search=CONT-123456

# Find invoice by invoice number
GET /api/invoices?search=INV-2025-001234

# Find partially paid invoices in date range
GET /api/invoices?status=PARTIALLY_PAID&dateFrom=2025-01-01&dateTo=2025-12-31
```

### 5. Manually Update Invoice Status

```bash
# Mark invoice as paid (e.g., payment received outside system)
PATCH /api/invoices/{invoiceId}
{
  "status": "PAID",
  "paidAmount": 150.50,
  "notes": "Payment received via bank transfer on 2025-12-04"
}

# Mark as partially paid
PATCH /api/invoices/{invoiceId}
{
  "status": "PARTIALLY_PAID",
  "paidAmount": 75.25,
  "notes": "Partial payment received"
}

# Update only the due date
PATCH /api/invoices/{invoiceId}
{
  "dueDate": "2026-01-15T00:00:00.000Z",
  "notes": "Extended payment deadline"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Cannot delete invoice that has associated payments",
  "error": "Bad Request"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Invoice with ID {id} not found",
  "error": "Not Found"
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

---

## Rate Limits

Standard API rate limits apply:

- 100 requests per minute per user
- 1000 requests per hour per user

---

## Testing Examples

### cURL Examples

```bash
# Get all unpaid invoices
curl -X GET "http://localhost:3000/api/invoices?status=UNPAID&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search by tracking code, pickup code, container number, etc.
curl -X GET "http://localhost:3000/api/invoices?search=AOSTP-20251204-ABC123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Generate invoices from packing list
curl -X POST "http://localhost:3000/api/invoices/generate/{packingListId}" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Download invoice PDF
curl -X GET "http://localhost:3000/api/invoices/{invoiceId}/download-pdf" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update invoice status manually
curl -X PATCH "http://localhost:3000/api/invoices/{invoiceId}" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PAID",
    "paidAmount": 150.50,
    "notes": "Payment received via bank transfer"
  }'
```

---

## Changelog

### Version 1.1.0 (December 2025)

- ✅ Added automatic invoice updates when package is modified
- ✅ Added unified `search` parameter that searches across:
  - Invoice number
  - Package tracking code
  - Package pickup code
  - Packing list name
  - Container number
- ✅ Added manual invoice status update capability (PAID, PARTIALLY_PAID, UNPAID)
- ✅ Added manual paidAmount update for administrative corrections
- ✅ Improved 2-decimal precision for all amounts
- ✅ Enhanced documentation with manual status update examples

### Version 1.0.0 (November 2025)

- Initial invoice API implementation
- Generate invoices from packing lists
- PDF generation and download
- Payment integration
