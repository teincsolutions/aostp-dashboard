# Package Delivery API

## Overview

The Package Delivery API manages the recording and tracking of package deliveries to customers. It handles the entire delivery process including creating delivery records, updating package statuses, and sending notifications.

## Base URL

```
/package-delivery
```

## Authentication

All endpoints require:

- **Bearer Token** authentication
- **Role**: `OPERATIONS_CLERK` or `SUPER_ADMIN`

---

## Endpoints

### 1. Get All Package Deliveries (with Filters & Pagination)

Retrieve all package delivery records with advanced filtering and pagination.

**Endpoint:** `GET /package-delivery`

**Authorization:** `OPERATIONS_CLERK` or `SUPER_ADMIN` role required

#### Query Parameters

All parameters are optional and can be combined for advanced filtering.

| Parameter       | Type   | Required | Description                                 |
| --------------- | ------ | -------- | ------------------------------------------- |
| `page`          | number | No       | Page number (default: 1)                    |
| `limit`         | number | No       | Items per page (default: 20, max: 100)      |
| `sortBy`        | string | No       | Field to sort by (default: releaseDate)     |
| `sortOrder`     | string | No       | Sort order: `asc` or `desc` (default: desc) |
| `customerId`    | string | No       | Filter by customer ID (UUID)                |
| `invoiceId`     | string | No       | Filter by invoice ID (UUID)                 |
| `packageId`     | string | No       | Filter by package ID (UUID)                 |
| `trackingCode`  | string | No       | Filter by tracking code (partial match)     |
| `warehouseId`   | string | No       | Filter by warehouse ID (UUID)               |
| `packingListId` | string | No       | Filter by packing list ID (UUID)            |
| `deliveryId`    | string | No       | Filter by delivery ID (partial match)       |
| `receiverName`  | string | No       | Filter by receiver name (partial match)     |
| `dateFrom`      | string | No       | Filter from date (ISO format: YYYY-MM-DD)   |
| `dateTo`        | string | No       | Filter to date (ISO format: YYYY-MM-DD)     |

#### Example Requests

```bash
# Get all deliveries with pagination
GET /api/package-delivery?page=1&limit=20

# Filter by customer
GET /api/package-delivery?customerId=uuid-customer-123

# Filter by warehouse
GET /api/package-delivery?warehouseId=uuid-warehouse-456

# Filter by date range
GET /api/package-delivery?dateFrom=2025-12-01&dateTo=2025-12-31

# Filter by tracking code (partial match)
GET /api/package-delivery?trackingCode=TR-2025

# Multiple filters combined
GET /api/package-delivery?customerId=uuid-customer-123&dateFrom=2025-12-01&warehouseId=uuid-warehouse-456

# Filter by packing list
GET /api/package-delivery?packingListId=uuid-packing-list-789
```

#### Success Response (200)

```json
{
  "data": [
    {
      "id": "uuid-delivery-123",
      "deliveryId": "DEL001-2025001",
      "customerId": "uuid-customer-123",
      "invoiceId": "uuid-invoice-456",
      "packageId": "uuid-package-789",
      "quantity": 5,
      "receiverName": "John Doe",
      "releaseDate": "2025-12-04T10:30:00.000Z",
      "notes": "Picked up at front gate",
      "photos": ["https://s3.amazonaws.com/bucket/photo1.jpg"],
      "customer": {
        "id": "uuid-customer-123",
        "customerCode": "JOH12567",
        "firstName": "John",
        "lastName": "Doe",
        "phoneNumber": "+233501234567",
        "email": "john.doe@example.com"
      },
      "invoice": {
        "id": "uuid-invoice-456",
        "invoiceNumber": "INV-2025-001",
        "packingList": {
          "id": "uuid-packing-list-789",
          "name": "2025-12-01",
          "container": {
            "id": "uuid-container-321",
            "containerNumber": "CONT-2025-001",
            "destinationCity": {
              "id": "uuid-city-111",
              "name": "Accra"
            }
          }
        }
      },
      "package": {
        "id": "uuid-package-789",
        "trackingCode": "TR-2025-001",
        "warehouse": {
          "id": "uuid-warehouse-456",
          "warehouseId": "WH001",
          "name": "China Main Warehouse",
          "location": "Guangzhou, China"
        }
      },
      "createdBy": {
        "id": "uuid-user-999",
        "firstName": "Jane",
        "lastName": "Clerk",
        "email": "jane.clerk@company.com"
      },
      "createdAt": "2025-12-04T10:30:00.000Z"
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

---

### 2. Create Package Pickup Records (Multiple Invoices)

Creates pickup records when packages are picked up by a customer. Supports multiple invoices and packages in a single pickup transaction.

**Endpoint:** `POST /package-delivery`

**Authorization:** `OPERATIONS_CLERK` or `SUPER_ADMIN` role required

#### Request Body

**Example 1: Pick up specific packages**

```json
{
  "invoiceIds": ["60f1b2b5c1d9e2f4e6b4f1a2", "60f1b2b5c1d9e2f4e6b4f1a3"],
  "trackingCodes": ["TR-2025-001", "TR-2025-002", "TR-2025-003"],
  "receiverName": "John Doe",
  "notes": "Picked up at front gate",
  "photos": ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
}
```

**Example 2: Pick up all packages from invoices**

```json
{
  "invoiceIds": ["60f1b2b5c1d9e2f4e6b4f1a2", "60f1b2b5c1d9e2f4e6b4f1a3"],
  "receiverName": "John Doe",
  "notes": "Picked up at front gate"
}
```

#### Request Fields

| Field           | Type     | Required | Description                                                                                   |
| --------------- | -------- | -------- | --------------------------------------------------------------------------------------------- |
| `invoiceIds`    | string[] | Yes      | Array of invoice UUIDs (all must belong to same customer)                                     |
| `trackingCodes` | string[] | No       | Array of package tracking codes. If omitted, all packages from the invoices will be picked up |
| `receiverName`  | string   | No       | Name of the person who picked up the packages                                                 |
| `quantity`      | number   | **Yes**  | Quantity being picked up (must be at least 1)                                                 |
| `notes`         | string   | No       | Optional pickup notes                                                                         |
| `photos`        | string[] | No       | Array of photo URLs (must be uploaded first via `/api/v1/uploads/packages` endpoint)          |

**Important**: Photos must be uploaded separately using the uploads endpoint **before** creating the pickup record. See the "Photo Upload Process" section below.

#### Business Logic

1. **Validates Invoices**: Checks if all invoices exist
2. **Validates Customer**: Ensures all invoices belong to the same customer
3. **Finds Packages**: Locates all packages using the tracking codes
4. **Validates Associations**: Ensures all packages belong to the specified invoices
5. **Prevents Duplicates**: Checks if delivery records already exist for any packages
6. **Generates Delivery IDs**: Creates unique delivery IDs for each package (format: `DEL001-2025001`)
7. **Creates Records**: Creates all delivery records in a single database transaction
8. **Updates Package Statuses**: Updates all package statuses to `RELEASED`
9. **Logs Actions**: Creates audit log entries for each delivery
10. **Sends Notifications**: Sends pickup notification to the customer for each package

#### Success Response (201)

```json
{
  "success": true,
  "count": 3,
  "deliveries": [
    {
      "id": "uuid-delivery-123",
      "deliveryId": "DEL001-2025001",
      "invoiceId": "60f1b2b5c1d9e2f4e6b4f1a2",
      "packageId": "uuid-package-101",
      "trackingCode": "TR-2025-001",
      "quantity": 5,
      "releaseDate": "2025-12-04T10:30:00.000Z"
    },
    {
      "id": "uuid-delivery-124",
      "deliveryId": "DEL001-2025002",
      "invoiceId": "60f1b2b5c1d9e2f4e6b4f1a2",
      "packageId": "uuid-package-102",
      "trackingCode": "TR-2025-002",
      "quantity": 3,
      "releaseDate": "2025-12-04T10:30:00.000Z"
    },
    {
      "id": "uuid-delivery-125",
      "deliveryId": "DEL001-2025003",
      "invoiceId": "60f1b2b5c1d9e2f4e6b4f1a3",
      "packageId": "uuid-package-103",
      "trackingCode": "TR-2025-003",
      "quantity": 2,
      "releaseDate": "2025-12-04T10:30:00.000Z"
    }
  ]
}
```

#### Error Responses

**400 Bad Request**

```json
{
  "statusCode": 400,
  "message": "Validation error or delivery not allowed",
  "error": "Bad Request"
}
```

Common 400 error scenarios:

- Invoices belong to different customers (all invoices must be for same customer)
- One or more packages do not belong to the specified invoices
- Delivery record already exists for one or more packages
- One or more invoices do not have associated packages
- Validation errors in request body (missing required fields, empty arrays, etc.)

**401 Unauthorized**

```json
{
  "statusCode": 401,
  "message": "Unauthorized access",
  "error": "Unauthorized"
}
```

**403 Forbidden**

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions (requires OPERATIONS_CLERK or SUPER_ADMIN role)",
  "error": "Forbidden"
}
```

**404 Not Found**

```json
{
  "statusCode": 404,
  "message": "No invoices found with the provided IDs",
  "error": "Not Found"
}
```

Or:

```json
{
  "statusCode": 404,
  "message": "Invoices not found: {missingInvoiceIds}",
  "error": "Not Found"
}
```

Or:

```json
{
  "statusCode": 404,
  "message": "Packages not found in provided invoices: {missingTrackingCodes}",
  "error": "Not Found"
}
```

---

### 3. Get Deliveries by Invoice

Retrieves all package deliveries associated with a specific invoice.

**Endpoint:** `GET /package-delivery/by-invoice/:invoiceId`

**Authorization:** `OPERATIONS_CLERK` or `SUPER_ADMIN` role required

#### URL Parameters

| Parameter   | Type   | Required | Description  |
| ----------- | ------ | -------- | ------------ |
| `invoiceId` | string | Yes      | Invoice UUID |

#### Example Request

```
GET /package-delivery/by-invoice/uuid-invoice-123
Authorization: Bearer {token}
```

#### Success Response (200)

```json
[
  {
    "id": "uuid-delivery-123",
    "deliveryId": "DEL001-2025001",
    "releaseDate": "2025-12-04T10:30:00.000Z",
    "quantity": 5,
    "receiverName": "John Doe",
    "photos": ["https://example.com/photo1.jpg"],
    "package": {
      "id": "uuid-package-101",
      "trackingCode": "TR-2025-001",
      "description": "Electronics",
      "warehouse": {
        "id": "uuid-warehouse-555",
        "name": "Main Warehouse"
      }
    }
  }
]
```

#### Error Responses

**404 Not Found**

```json
{
  "statusCode": 404,
  "message": "Invoice not found",
  "error": "Not Found"
}
```

---

### 4. Get Deliveries by Customer

Retrieves all package deliveries for a specific customer across all invoices.

**Endpoint:** `GET /package-delivery/by-customer/:customerId`

**Authorization:** `OPERATIONS_CLERK` or `SUPER_ADMIN` role required

#### URL Parameters

| Parameter    | Type   | Required | Description   |
| ------------ | ------ | -------- | ------------- |
| `customerId` | string | Yes      | Customer UUID |

#### Example Request

```
GET /package-delivery/by-customer/uuid-customer-456
Authorization: Bearer {token}
```

#### Success Response (200)

```json
[
  {
    "id": "uuid-delivery-123",
    "deliveryId": "DEL001-2025001",
    "releaseDate": "2025-12-04T10:30:00.000Z",
    "quantity": 5,
    "receiverName": "John Doe",
    "invoice": {
      "id": "uuid-invoice-123",
      "invoiceNumber": "INV-2025-001",
      "packingList": {
        "container": {
          "containerNumber": "CONT-2025-001",
          "destinationCity": "New York"
        }
      }
    }
  }
]
```

#### Error Responses

**404 Not Found**

```json
{
  "statusCode": 404,
  "message": "Customer not found",
  "error": "Not Found"
}
```

---

### 5. Get Delivery Details by ID

Retrieves detailed information for a specific delivery record.

**Endpoint:** `GET /package-delivery/by-id/:deliveryId`

**Authorization:** `OPERATIONS_CLERK` or `SUPER_ADMIN` role required

#### URL Parameters

| Parameter    | Type   | Required | Description                                     |
| ------------ | ------ | -------- | ----------------------------------------------- |
| `deliveryId` | string | Yes      | Delivery ID (not UUID) - e.g., `DEL001-2025001` |

#### Example Request

```
GET /package-delivery/by-id/DEL001-2025001
Authorization: Bearer {token}
```

#### Success Response (200)

```json
{
  "id": "uuid-delivery-123",
  "deliveryId": "DEL001-2025001",
  "releaseDate": "2025-12-04T10:30:00.000Z",
  "quantity": 5,
  "receiverName": "John Doe",
  "photos": [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg"
  ],
  "customer": {
    "id": "uuid-customer-456",
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "invoice": {
    "id": "uuid-invoice-123",
    "invoiceNumber": "INV-2025-001",
    "packingList": {
      "container": {
        "containerNumber": "CONT-2025-001",
        "destinationCity": "New York"
      }
    }
  },
  "package": {
    "id": "uuid-package-101",
    "trackingCode": "TR-2025-001",
    "description": "Electronics",
    "warehouse": {
      "id": "uuid-warehouse-555",
      "name": "Main Warehouse"
    }
  }
}
```

#### Error Responses

**404 Not Found**

```json
{
  "statusCode": 404,
  "message": "Delivery not found",
  "error": "Not Found"
}
```

---

## Photo Upload Process

Delivery photos must be uploaded **separately** before creating the delivery record. Follow this two-step process:

### Step 1: Upload Photos

Use the general uploads endpoint to upload delivery photos:

**Endpoint:** `POST /api/v1/uploads/packages`

**Request:**

- Content-Type: `multipart/form-data`
- Method: Upload up to 3 files at once

**Form Data:**

```
files: [File1, File2, File3]  // Multiple files (max 3)
folder: "pictures"             // Required: 'pictures' or 'videos'
packageId: "uuid-package-101"  // Required: Package UUID
fileName: "delivery-photo.jpg" // Optional: Original filename
```

**Example using cURL:**

```bash
curl -X POST https://api.aostp.com/api/v1/uploads/packages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@photo1.jpg" \
  -F "files=@photo2.jpg" \
  -F "folder=pictures" \
  -F "packageId=uuid-package-101"
```

**Success Response (201):**

```json
[
  {
    "url": "https://s3.amazonaws.com/aostp-packages/pictures/uuid-package-101/photo1-timestamp.jpg",
    "key": "pictures/uuid-package-101/photo1-timestamp.jpg",
    "bucket": "aostp-packages"
  },
  {
    "url": "https://s3.amazonaws.com/aostp-packages/pictures/uuid-package-101/photo2-timestamp.jpg",
    "key": "pictures/uuid-package-101/photo2-timestamp.jpg",
    "bucket": "aostp-packages"
  }
]
```

### Step 2: Create Pickup with Photo URLs

Use the returned URLs in the pickup creation request:

```json
{
  "invoiceIds": ["60f1b2b5c1d9e2f4e6b4f1a2", "60f1b2b5c1d9e2f4e6b4f1a3"],
  "trackingCodes": ["TR-2025-001", "TR-2025-002"],
  "receiverName": "John Doe",
  "quantity": 5,
  "notes": "Picked up at front gate",
  "photos": [
    "https://s3.amazonaws.com/aostp-packages/pictures/uuid-package-101/photo1-timestamp.jpg",
    "https://s3.amazonaws.com/aostp-packages/pictures/uuid-package-101/photo2-timestamp.jpg"
  ]
}
```

**⚠️ Common Error:**

If you include `bucketType`, `file`, or any upload-related fields in the delivery creation request, you will receive:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["property bucketType should not exist"],
  "timestamp": "2025-12-05T20:25:24.663Z"
}
```

**Solution:** Only send the fields listed in the "Request Fields" table. Photos must be pre-uploaded URLs, not file uploads.

---

## Data Models

### PackageDelivery

| Field          | Type           | Description                                       |
| -------------- | -------------- | ------------------------------------------------- |
| `id`           | string (UUID)  | Unique identifier                                 |
| `deliveryId`   | string         | Human-readable delivery ID (e.g., DEL001-2025001) |
| `customerId`   | string (UUID)  | Customer who received the package                 |
| `invoiceId`    | string (UUID)  | Associated invoice                                |
| `packageId`    | string (UUID)  | Package that was delivered                        |
| `receiverName` | string \| null | Name of receiver (optional)                       |
| `quantity`     | number         | Quantity delivered                                |
| `releaseDate`  | Date           | Timestamp when delivery was recorded              |
| `notes`        | string \| null | Delivery notes                                    |
| `photos`       | string[]       | Array of photo URLs                               |
| `warehouseId`  | string (UUID)  | Warehouse from which package was released         |
| `createdById`  | string (UUID)  | User who created the delivery record              |

---

## Workflow

### Delivery Creation Flow

```
1. Operations Clerk initiates delivery
   ↓
2. System validates invoice existence
   ↓
3. System finds package by tracking code
   ↓
4. System validates package-invoice association
   ↓
5. System checks for existing delivery record
   ↓
6. System generates unique delivery ID
   ↓
7. Database transaction begins
   ├─ Create delivery record
   ├─ Update package status to RELEASED
   └─ Create audit log entry
   ↓
8. Transaction commits
   ↓
9. Send notification to customer
   ↓
10. Return delivery record
```

---

## Status Updates

### Package Status Changes

When a delivery is created:

- **Package**: Status updated to `RELEASED` immediately upon delivery record creation

---

## Notifications

Upon successful delivery creation, the system sends a notification to the customer via the `NotificationsService` confirming the package has been delivered. The notification includes:

- Package tracking code
- Delivery ID
- Delivery date and time
- Receiver name (if provided)
- Delivered quantity

**Notification Messages:**

- **Email Subject**: "Package Delivered - AOSTP Logistics"
- **Email Content**: Confirms successful delivery with full details including receiver name and delivery date
- **SMS/WhatsApp**: Short confirmation message with receiver name (if available): "Hi [Customer], your package ([Tracking Code]) has been delivered. Received by: [Receiver Name]. Delivery ID: [ID]"

---

## Audit Logging

Every delivery creation is logged with:

- **Action**: `CREATE`
- **Entity**: `PackageDelivery`
- **User**: Operations clerk who created the delivery
- **Data**: Delivery details including customer code, tracking code, quantity

---

## Common Use Cases

### 1. Record a Multi-Invoice Pickup (All Packages)

When a customer picks up ALL packages from multiple invoices:

1. Collect all invoice IDs for the customer
2. (Optional) Record receiver name
3. (Optional) Take pickup photos
4. Create the pickup records WITHOUT specifying trackingCodes
5. System automatically picks up all packages from the invoices
6. System updates all package statuses and notifies customer for each package

### 2. Record a Selective Multi-Invoice Pickup

When a customer picks up SPECIFIC packages from multiple invoices:

1. Scan the specific package tracking codes
2. Collect all invoice IDs for the customer
3. (Optional) Record receiver name
4. (Optional) Take pickup photos
5. Create the pickup records WITH trackingCodes specified
6. System updates selected package statuses and notifies customer

### 3. Record a Single Invoice Pickup

When a customer picks up packages from one invoice:

1. Confirm the invoice ID
2. Either specify tracking codes OR omit them to pick up all packages
3. (Optional) Record receiver name
4. (Optional) Take pickup photos
5. Create the pickup record(s)
6. System updates package status and notifies customer

### 3. View Customer Pickup History

To see all deliveries for a customer:

1. Use the customer ID
2. Retrieve all delivery records
3. View across all invoices and containers

### 4. Audit Invoice Pickups

To check which packages from an invoice have been picked up:

1. Use the invoice ID
2. Retrieve all pickup records
3. Cross-reference with invoice packages

---

## Error Handling

The API uses standard HTTP status codes:

- **200 OK**: Successful GET request
- **201 Created**: Delivery record created successfully
- **400 Bad Request**: Validation error or business rule violation
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found (invoice, customer, package item)
- **500 Internal Server Error**: Server-side error

All error responses follow the NestJS standard format with `statusCode`, `message`, and `error` fields.

---

## Security

- All endpoints require JWT authentication
- Only users with `OPERATIONS_CLERK` or `SUPER_ADMIN` roles can access these endpoints
- All actions are logged in the audit trail
- User identity is captured from JWT token for audit purposes

---

## Notes

- Pickup IDs are auto-generated and follow the format: `DEL{warehouseCode}-{sequentialNumber}`
- A package can only have one pickup record (enforced at database level with unique constraint)
- **Photos must be uploaded separately** using `/api/v1/uploads/packages` endpoint before creating pickup
- Photos are stored in S3 and only the URLs are saved in the pickup record
- **Quantity is required** and must be at least 1
- Package status is automatically updated to `RELEASED` when pickup is created
- Pickup is package-level, not item-level (one pickup per package)
- Maximum 3 photos can be uploaded per batch using the uploads endpoint
- **Multiple invoices are supported** as long as they all belong to the same customer
- All pickups for multiple invoices are created in a single database transaction for data consistency
- If any package fails validation, the entire transaction is rolled back (all-or-nothing)
- Each package gets its own unique pickup ID and notification
- **Tracking codes are optional** - if omitted, all packages from the specified invoices will be picked up

---

## Pickup Report Endpoint

### Get Pickup Report (Paginated)

Retrieve a paginated pickup report with delivery records including customer, invoice, and package details.

**Endpoint:** `GET /reports/pickups`

**Authorization:** `SUPER_ADMIN`, `FINANCE_MANAGER`, or `OPERATIONS_CLERK` role required

#### Query Parameters

All parameters are optional and can be combined for advanced filtering.

| Parameter       | Type   | Required | Description                                       |
| --------------- | ------ | -------- | ------------------------------------------------- |
| `page`          | number | No       | Page number (default: 1)                          |
| `limit`         | number | No       | Items per page (default: 20, max: 100)            |
| `sortBy`        | string | No       | Field to sort by (default: releaseDate)           |
| `sortOrder`     | string | No       | Sort order: `asc` or `desc` (default: desc)       |
| `fromDate`      | string | No       | Filter by start date (ISO 8601 format)            |
| `toDate`        | string | No       | Filter by end date (ISO 8601 format)              |
| `customerId`    | string | No       | Filter by customer ID (UUID)                      |
| `warehouseId`   | string | No       | Filter by warehouse ID (UUID)                     |
| `invoiceId`     | string | No       | Filter by invoice ID (UUID)                       |
| `packingListId` | string | No       | Filter by packing list ID (UUID)                  |
| `trackingCode`  | string | No       | Filter by tracking code (partial match)           |
| `deliveryId`    | string | No       | Filter by delivery ID (partial match)             |
| `receiverName`  | string | No       | Filter by receiver name (partial match)           |

#### Example Requests

```bash
# Get first page of pickups
GET /api/reports/pickups?page=1&limit=20

# Filter by customer
GET /api/reports/pickups?customerId=uuid-customer-123

# Filter by date range
GET /api/reports/pickups?fromDate=2025-01-01T00:00:00Z&toDate=2025-12-31T23:59:59Z

# Filter by warehouse
GET /api/reports/pickups?warehouseId=uuid-warehouse-456

# Filter by tracking code (partial match)
GET /api/reports/pickups?trackingCode=TR-2025

# Multiple filters combined
GET /api/reports/pickups?customerId=uuid-customer-123&fromDate=2025-12-01T00:00:00Z&warehouseId=uuid-warehouse-456&page=1&limit=50
```

#### Success Response (200)

```json
{
  "pickups": [
    {
      "customerCode": "JOH12567",
      "customerName": "John Doe",
      "invoiceNumber": "INV-2025-001",
      "pickupCode": "PKP-2025-001",
      "pickupDate": "2025-12-04T10:30:00.000Z",
      "quantity": 5,
      "warehouse": "China Main Warehouse",
      "status": "RELEASED",
      "trackingCode": "TR-2025-001",
      "description": "Electronics",
      "deliveryId": "DEL001-2025001",
      "receiverName": "Jane Doe",
      "notes": "Picked up at front gate"
    }
  ],
  "totalCount": 156,
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
