# Package Delivery API

## Overview

The Package Delivery API manages the recording and tracking of package item deliveries to customers. It handles the entire delivery process including creating delivery records, updating package statuses, and sending notifications.

## Base URL

```
/package-delivery
```

## Authentication

All endpoints require:

- **Bearer Token** authentication
- **Role**: `OPERATIONS_CLERK`

---

## Endpoints

### 1. Create Package Delivery Record

Creates a delivery record when a package item is delivered to a customer.

**Endpoint:** `POST /package-delivery`

**Authorization:** `OPERATIONS_CLERK` role required

#### Request Body

```json
{
  "invoiceId": "60f1b2b5c1d9e2f4e6b4f1a2",
  "packageItemIntakeTrackingCode": "PKG2025001001",
  "receiverName": "John Doe",
  "quantity": 5,
  "notes": "Delivered to front gate",
  "photos": ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
}
```

#### Request Fields

| Field                           | Type     | Required | Description                                                   |
| ------------------------------- | -------- | -------- | ------------------------------------------------------------- |
| `invoiceId`                     | string   | Yes      | UUID of the invoice where the delivery belongs                |
| `packageItemIntakeTrackingCode` | string   | Yes      | Package item intake tracking code (e.g., PKG2025001001)       |
| `receiverName`                  | string   | No       | Name of the person who received the package                   |
| `quantity`                      | number   | No       | Quantity released (defaults to full quantity if not provided) |
| `notes`                         | string   | No       | Optional delivery notes                                       |
| `photos`                        | string[] | No       | Array of delivery photo URLs                                  |

#### Business Logic

1. **Validates Invoice**: Checks if the invoice exists
2. **Finds Package Item**: Locates the package item using the intake tracking code
3. **Validates Association**: Ensures the package item belongs to the specified invoice
4. **Prevents Duplicates**: Checks if a delivery record already exists for this item
5. **Generates Delivery ID**: Creates a unique delivery ID (format: `DEL001-2025001`)
6. **Creates Record**: Creates the delivery record in a database transaction
7. **Updates Package Status**: If all items are released, updates the package status to `RELEASED`
8. **Logs Action**: Creates an audit log entry
9. **Sends Notification**: Sends a delivery notification to the customer

#### Success Response (201)

```json
{
  "id": "uuid-delivery-123",
  "deliveryId": "DEL001-2025001",
  "customerId": "uuid-customer-456",
  "invoiceId": "60f1b2b5c1d9e2f4e6b4f1a2",
  "packageItemId": "uuid-item-789",
  "receiverName": "John Doe",
  "quantity": 5,
  "releaseDate": "2025-12-04T10:30:00.000Z",
  "notes": "Delivered to front gate",
  "photos": [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg"
  ],
  "packageItem": {
    "id": "uuid-item-789",
    "intakeTrackingCode": "IT001-2025001",
    "package": {
      "id": "uuid-package-101",
      "trackingCode": "AOSTP-123456789-001"
    }
  }
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

- Package item does not belong to the specified invoice
- Delivery record already exists for this package item
- Package item is not associated with any package
- Validation errors in request body

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
  "message": "Insufficient permissions (requires OPERATIONS_CLERK role)",
  "error": "Forbidden"
}
```

**404 Not Found**

```json
{
  "statusCode": 404,
  "message": "Invoice with ID {invoiceId} not found",
  "error": "Not Found"
}
```

Or:

```json
{
  "statusCode": 404,
  "message": "Package item with intake tracking code {code} not found",
  "error": "Not Found"
}
```

---

### 2. Get Deliveries by Invoice

Retrieves all package item deliveries associated with a specific invoice.

**Endpoint:** `GET /package-delivery/by-invoice/:invoiceId`

**Authorization:** `OPERATIONS_CLERK` role required

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
    "packageItem": {
      "id": "uuid-item-789",
      "intakeTrackingCode": "IT001-2025001",
      "description": "Electronics",
      "package": {
        "id": "uuid-package-101",
        "trackingCode": "AOSTP-123456789-001"
      },
      "warehouse": {
        "id": "uuid-warehouse-555",
        "name": "Main Warehouse",
        "location": "Building A"
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

### 3. Get Deliveries by Customer

Retrieves all package item deliveries for a specific customer across all invoices.

**Endpoint:** `GET /package-delivery/by-customer/:customerId`

**Authorization:** `OPERATIONS_CLERK` role required

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

### 4. Get Delivery Details by ID

Retrieves detailed information for a specific delivery record.

**Endpoint:** `GET /package-delivery/by-id/:deliveryId`

**Authorization:** `OPERATIONS_CLERK` role required

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
  "packageItem": {
    "id": "uuid-item-789",
    "intakeTrackingCode": "IT001-2025001",
    "description": "Electronics",
    "package": {
      "id": "uuid-package-101",
      "trackingCode": "AOSTP-123456789-001"
    },
    "warehouse": {
      "id": "uuid-warehouse-555",
      "name": "Main Warehouse",
      "location": "Building A"
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

## Data Models

### PackageDelivery

| Field           | Type           | Description                                       |
| --------------- | -------------- | ------------------------------------------------- |
| `id`            | string (UUID)  | Unique identifier                                 |
| `deliveryId`    | string         | Human-readable delivery ID (e.g., DEL001-2025001) |
| `customerId`    | string (UUID)  | Customer who received the package                 |
| `invoiceId`     | string (UUID)  | Associated invoice                                |
| `packageItemId` | string (UUID)  | Package item that was delivered                   |
| `receiverName`  | string \| null | Name of receiver (optional)                       |
| `quantity`      | number         | Quantity delivered                                |
| `releaseDate`   | Date           | Timestamp when delivery was recorded              |
| `notes`         | string \| null | Delivery notes                                    |
| `photos`        | string[]       | Array of photo URLs                               |
| `warehouseId`   | string (UUID)  | Warehouse from which item was released            |
| `createdById`   | string (UUID)  | User who created the delivery record              |
| `createdAt`     | Date           | Creation timestamp                                |
| `updatedAt`     | Date           | Last update timestamp                             |

---

## Workflow

### Delivery Creation Flow

```
1. Operations Clerk initiates delivery
   ↓
2. System validates invoice existence
   ↓
3. System finds package item by tracking code
   ↓
4. System validates package-invoice association
   ↓
5. System checks for existing delivery record
   ↓
6. System generates unique delivery ID
   ↓
7. Database transaction begins
   ├─ Create delivery record
   ├─ Check if all package items delivered
   ├─ Update package status if complete
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

- **Package Item**: Implicitly marked as delivered (via delivery relationship)
- **Package**: Status updated to `RELEASED` if ALL items have been delivered

---

## Notifications

Upon successful delivery creation, the system sends a notification to the customer via the `NotificationsService`. The notification includes:

- Package tracking code
- Delivery ID
- Release date
- Receiver name (if provided)

---

## Audit Logging

Every delivery creation is logged with:

- **Action**: `CREATE`
- **Entity**: `PackageDelivery`
- **User**: Operations clerk who created the delivery
- **Data**: Delivery details including customer code, tracking code, quantity

---

## Common Use Cases

### 1. Record a Delivery

When a customer picks up their package:

1. Scan the package item intake tracking code
2. Confirm the invoice
3. (Optional) Record receiver name
4. (Optional) Take delivery photos
5. Create the delivery record
6. System updates package status and notifies customer

### 2. View Customer Delivery History

To see all deliveries for a customer:

1. Use the customer ID
2. Retrieve all delivery records
3. View across all invoices and containers

### 3. Audit Invoice Deliveries

To check which items from an invoice have been delivered:

1. Use the invoice ID
2. Retrieve all delivery records
3. Cross-reference with invoice package items

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
- Only users with `OPERATIONS_CLERK` role can access these endpoints
- All actions are logged in the audit trail
- User identity is captured from JWT token for audit purposes

---

## Notes

- Delivery IDs are auto-generated and follow the format: `DEL{warehouseCode}-{sequentialNumber}`
- A package item can only have one delivery record (enforced at database level)
- Photos are stored as URLs (presumed to be uploaded to S3 or similar)
- The `quantity` field allows partial deliveries (though business logic may restrict this)
- Package status is automatically updated when all items are delivered
