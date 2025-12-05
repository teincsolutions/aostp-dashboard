# Customers API Documentation

Complete API documentation for customer management endpoints.

---

## Base URL

```
/api/customers
```

All endpoints require authentication via JWT Bearer token.

---

## Endpoints

### 1. Create Customer

Create a new customer record with contact information and preferences.

**Endpoint:** `POST /customers`

**Required Roles:** `SUPER_ADMIN`, `OPERATIONS_CLERK`, `PAYMENT_CLERK`, `FINANCE_MANAGER`

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+233501234567",
  "alternatePhone": "+233241234567",
  "address": "123 Main Street, Accra",
  "warehouseId": "uuid-warehouse-id",
  "cityId": "uuid-city-id",
  "idType": "NATIONAL_ID",
  "idNumber": "GHA-123456789-0",
  "preferredChannel": "SMS"
}
```

**Request Body Fields:**

| Field              | Type          | Required | Description                                                                   |
| ------------------ | ------------- | -------- | ----------------------------------------------------------------------------- |
| `firstName`        | string        | Yes      | Customer first name (2-50 characters)                                         |
| `lastName`         | string        | Yes      | Customer last name (2-50 characters)                                          |
| `email`            | string        | No       | Email address (must be valid email format)                                    |
| `phoneNumber`      | string        | Yes      | Primary phone number (must be unique)                                         |
| `alternatePhone`   | string        | No       | Alternative phone number                                                      |
| `address`          | string        | Yes      | Physical address (max 200 characters)                                         |
| `warehouseId`      | string (UUID) | No       | Reference to warehouse from warehouses table                                  |
| `cityId`           | string (UUID) | No       | Reference to city from cities table (replaces legacy city/country fields)     |
| `idType`           | enum          | No       | Type of ID: `NATIONAL_ID`, `PASSPORT`, `DRIVERS_LICENSE`, `VOTER_ID`, `OTHER` |
| `idNumber`         | string        | No       | ID document number (max 50 characters, must be unique per idType)             |
| `preferredChannel` | enum          | Yes      | Preferred communication channel: `EMAIL`, `SMS`, `WHATSAPP` (default: SMS)    |

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customerCode": "JOH12567",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+233501234567",
  "alternatePhone": "+233241234567",
  "address": "123 Main Street, Accra",
  "warehouseId": "uuid-warehouse-id",
  "cityId": "uuid-city-id",
  "idType": "NATIONAL_ID",
  "idNumber": "GHA-123456789-0",
  "preferredChannel": "SMS",
  "isActive": true,
  "createdAt": "2025-12-04T10:00:00.000Z",
  "updatedAt": "2025-12-04T10:00:00.000Z"
}
```

**Notes:**

- Customer code is auto-generated from first 3 letters of name + last 5 digits of phone
- Phone numbers and email must be unique
- ID number must be unique per ID type combination

---

### 2. Get All Customers (with Filtering & Pagination)

Retrieve a paginated list of customers with optional filters.

**Endpoint:** `GET /customers`

**Required Roles:** `SUPER_ADMIN`, `OPERATIONS_CLERK`, `PAYMENT_CLERK`, `FINANCE_MANAGER`

**Query Parameters:**

| Parameter   | Type    | Required | Description                                                         |
| ----------- | ------- | -------- | ------------------------------------------------------------------- |
| `page`      | number  | No       | Page number (default: 1)                                            |
| `limit`     | number  | No       | Items per page (default: 20)                                        |
| `sortBy`    | string  | No       | Field to sort by (default: createdAt)                               |
| `sortOrder` | string  | No       | Sort order: `asc` or `desc` (default: desc)                         |
| `search`    | string  | No       | Search across firstName, lastName, email, phoneNumber, customerCode |
| `isActive`  | boolean | No       | Filter by active status: `true` or `false`                          |

**Example Request:**

```bash
GET /api/customers?page=1&limit=20&search=John&isActive=true
```

**Response:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "customerCode": "JOH12567",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "+233501234567",
      "alternatePhone": "+233241234567",
      "address": "123 Main Street, Accra",
      "warehouseId": "uuid-warehouse-id",
      "warehouse": {
        "id": "uuid-warehouse-id",
        "name": "Accra Main Warehouse",
        "location": "Industrial Area, Accra"
      },
      "cityId": "uuid-city-id",
      "cityRef": {
        "id": "uuid-city-id",
        "name": "Accra",
        "country": "Ghana"
      },
      "idType": "NATIONAL_ID",
      "idNumber": "GHA-123456789-0",
      "preferredChannel": "SMS",
      "isActive": true,
      "createdAt": "2025-12-04T10:00:00.000Z",
      "updatedAt": "2025-12-04T10:00:00.000Z",
      "_count": {
        "packages": 15,
        "invoices": 12,
        "payments": 10
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Filter Examples:**

1. **Search by name or phone:**

   ```
   GET /api/customers?search=John
   ```

2. **Filter active customers:**

   ```
   GET /api/customers?isActive=true
   ```

3. **Sort by name:**

   ```
   GET /api/customers?sortBy=firstName&sortOrder=asc
   ```

4. **Combined filters with pagination:**
   ```
   GET /api/customers?page=2&limit=50&search=Doe&isActive=true
   ```

---

### 3. Get Customer by ID

Retrieve a single customer by their unique identifier with full details.

**Endpoint:** `GET /customers/:id`

**Required Roles:** `SUPER_ADMIN`, `OPERATIONS_CLERK`, `PAYMENT_CLERK`, `FINANCE_MANAGER`

**Path Parameters:**

- `id` (string, required) - Customer UUID

**Example Request:**

```bash
GET /api/customers/550e8400-e29b-41d4-a716-446655440000
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customerCode": "JOH12567",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+233501234567",
  "alternatePhone": "+233241234567",
  "address": "123 Main Street, Accra",
  "warehouseId": "uuid-warehouse-id",
  "warehouse": {
    "id": "uuid-warehouse-id",
    "name": "Accra Main Warehouse",
    "location": "Industrial Area, Accra"
  },
  "cityId": "uuid-city-id",
  "cityRef": {
    "id": "uuid-city-id",
    "name": "Accra",
    "country": "Ghana"
  },
  "idType": "NATIONAL_ID",
  "idNumber": "GHA-123456789-0",
  "preferredChannel": "SMS",
  "isActive": true,
  "createdAt": "2025-12-04T10:00:00.000Z",
  "updatedAt": "2025-12-04T10:00:00.000Z",
  "packages": [
    {
      "id": "package-uuid",
      "trackingCode": "AOSTP-20251204-ABC123",
      "description": "Electronics",
      "status": "RECEIVED",
      "createdAt": "2025-12-04T10:00:00.000Z"
    }
  ],
  "invoices": [
    {
      "id": "invoice-uuid",
      "invoiceNumber": "INV-2025-001234",
      "totalAmount": 150.5,
      "status": "UNPAID",
      "createdAt": "2025-12-04T10:00:00.000Z"
    }
  ],
  "payments": [
    {
      "id": "payment-uuid",
      "paymentCode": "PAY-2025-001",
      "amount": 50.0,
      "currency": "USD",
      "processedAt": "2025-12-04T12:00:00.000Z"
    }
  ],
  "_count": {
    "packages": 15,
    "invoices": 12,
    "payments": 10,
    "notifications": 25
  }
}
```

**Notes:**

- Returns last 10 packages, invoices, and payments ordered by creation date
- Includes total counts for all related records
- Includes warehouse and city details if linked

---

### 4. Get Customer by Customer Code

Retrieve a customer by their unique customer code.

**Endpoint:** `GET /customers/code/:customerCode`

**Required Roles:** `SUPER_ADMIN`, `OPERATIONS_CLERK`, `PAYMENT_CLERK`, `FINANCE_MANAGER`

**Path Parameters:**

- `customerCode` (string, required) - Customer code (e.g., JOH12567)

**Example Request:**

```bash
GET /api/customers/code/JOH12567
```

**Response:** Same structure as "Get Customer by ID"

---

### 5. Get Customer by Phone Number

Retrieve a customer by their phone number (searches both primary and alternate phone).

**Endpoint:** `GET /customers/phone/:phoneNumber`

**Required Roles:** `SUPER_ADMIN`, `OPERATIONS_CLERK`, `PAYMENT_CLERK`

**Path Parameters:**

- `phoneNumber` (string, required) - Phone number (e.g., +233501234567)

**Example Request:**

```bash
GET /api/customers/phone/+233501234567
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customerCode": "JOH12567",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+233501234567",
  "alternatePhone": "+233241234567",
  "isActive": true
}
```

**Notes:**

- Returns basic customer information
- Searches both `phoneNumber` and `alternatePhone` fields
- Returns 404 if no customer found with the phone number

---

### 6. Get Customer Statistics

Retrieve detailed statistics for a specific customer including package counts, revenue, and payment information.

**Endpoint:** `GET /customers/:id/stats`

**Required Roles:** `SUPER_ADMIN`, `FINANCE_MANAGER`

**Path Parameters:**

- `id` (string, required) - Customer UUID

**Example Request:**

```bash
GET /api/customers/550e8400-e29b-41d4-a716-446655440000/stats
```

**Response:**

```json
{
  "customer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "customerCode": "JOH12567",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phoneNumber": "+233501234567",
    "isActive": true,
    "packages": [],
    "invoices": [],
    "payments": [],
    "_count": {
      "packages": 25,
      "invoices": 20,
      "payments": 18,
      "notifications": 50
    }
  },
  "stats": {
    "totalPackages": 25,
    "pendingPackages": 5,
    "deliveredPackages": 20,
    "totalInvoices": 20,
    "unpaidInvoices": 3,
    "totalPayments": 18,
    "totalSpent": 3500.75
  }
}
```

**Statistics Breakdown:**

| Stat                | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `totalPackages`     | Total number of packages for this customer           |
| `pendingPackages`   | Packages with status: RECEIVED, ASSIGNED, or SHIPPED |
| `deliveredPackages` | Packages with status: RELEASED                       |
| `totalInvoices`     | Total number of invoices                             |
| `unpaidInvoices`    | Invoices with status: UNPAID                         |
| `totalPayments`     | Total number of payments made                        |
| `totalSpent`        | Sum of all payment amounts                           |

---

### 7. Update Customer

Update customer information.

**Endpoint:** `PATCH /customers/:id`

**Required Roles:** `SUPER_ADMIN`, `OPERATIONS_CLERK`

**Path Parameters:**

- `id` (string, required) - Customer UUID

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "phoneNumber": "+233509876543",
  "alternatePhone": "+233249876543",
  "address": "456 New Street, Kumasi",
  "warehouseId": "new-warehouse-uuid",
  "cityId": "new-city-uuid",
  "idType": "PASSPORT",
  "idNumber": "P1234567",
  "preferredChannel": "WHATSAPP",
  "isActive": true
}
```

**Response:** Same structure as "Get Customer by ID"

**Validation Rules:**

- If updating `phoneNumber`, it must be unique (excluding current customer)
- If updating `email`, it must be unique (excluding current customer)
- If updating `idType` and `idNumber`, the combination must be unique (excluding current customer)
- All other validation rules from Create Customer apply

**Error Response (409 Conflict):**

```json
{
  "statusCode": 409,
  "message": "Phone number already in use",
  "error": "Conflict"
}
```

---

### 8. Delete Customer

Delete or deactivate a customer record.

**Endpoint:** `DELETE /customers/:id`

**Required Roles:** `SUPER_ADMIN` only

**Path Parameters:**

- `id` (string, required) - Customer UUID

**Example Request:**

```bash
DELETE /api/customers/550e8400-e29b-41d4-a716-446655440000
```

**Response (Soft Delete):**

If customer has related records (packages, invoices, payments), the customer is deactivated:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customerCode": "JOH12567",
  "firstName": "John",
  "lastName": "Doe",
  "isActive": false,
  "updatedAt": "2025-12-04T15:00:00.000Z"
}
```

**Response (Hard Delete):**

If customer has no related records, the customer is permanently deleted:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customerCode": "JOH12567",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Notes:**

- System automatically determines whether to soft delete (deactivate) or hard delete (permanent removal)
- Customers with packages, invoices, or payments are only deactivated, not deleted
- Only SUPER_ADMIN can delete customers

---

## Customer Code Generation

Customer codes are automatically generated using the following format:

```
[First 3 letters of firstName + lastName] + [Last 5 digits of phone]
```

**Examples:**

- Name: John Doe, Phone: +233501234567 → `JOH12567`
- Name: Mary Smith, Phone: +233509876543 → `MAR76543`

If a collision occurs, a counter is appended: `JOH125671`, `JOH125672`, etc.

---

## ID Type Values

| Value             | Description                   |
| ----------------- | ----------------------------- |
| `NATIONAL_ID`     | National ID Card              |
| `PASSPORT`        | International Passport        |
| `DRIVERS_LICENSE` | Driver's License              |
| `VOTER_ID`        | Voter ID Card                 |
| `OTHER`           | Other identification document |

---

## Notification Channel Values

| Value      | Description         |
| ---------- | ------------------- |
| `EMAIL`    | Email notifications |
| `SMS`      | SMS text messages   |
| `WHATSAPP` | WhatsApp messages   |

---

## Important Notes

### Warehouse and City References

- **warehouseId**: Optional reference to the customer's preferred or assigned warehouse
  - Links to the `Warehouse` table using foreign key constraint
  - When queried, returns nested warehouse object with: `id`, `name`, `location`
  - Useful for assigning customers to specific warehouses for package handling
- **cityId**: Optional reference to the customer's city from the cities table
  - Links to the `City` table using foreign key constraint
  - When queried, returns nested city object (`cityRef`) with: `id`, `name`, `country`
  - Distinct from the `city` string field (free text vs. structured reference)
  - Useful for shipping rate calculations and reporting
- Both fields are optional and can be null
- Foreign key constraints ensure referential integrity
- Cascade behavior: `ON DELETE SET NULL` (if warehouse/city deleted, customer reference becomes null)

### Query Parameter Validation

The API uses strict validation for all query parameters:

- **Valid parameters**: Only parameters defined in `CustomerFilterDto` are accepted
- **Validation errors**: Invalid or unexpected parameters return a 400 error with details
- **Type checking**: Numeric parameters (page, limit) must be valid numbers
- **Enum validation**: Fields like `sortOrder` only accept predefined values (`asc`, `desc`)

**Example validation error:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["property invalidParam should not exist"],
  "timestamp": "2025-12-04T21:49:03.504Z"
}
```

### Phone Number Uniqueness

- Primary phone numbers must be unique across all customers
- The system checks both `phoneNumber` and `alternatePhone` when searching by phone
- Phone number format is not enforced by the system (recommend using E.164 format)

### Email Uniqueness

- Email addresses must be unique if provided
- Email is optional but recommended for notifications

### ID Validation

- The combination of `idType` and `idNumber` must be unique
- Custom validation decorator `@IsValidIdNumber()` validates format
- Ghana National IDs follow format: GHA-XXXXXXXXX-X

### Soft Delete Behavior

- Customers with related records (packages, invoices, payments) are soft-deleted (deactivated)
- Soft-deleted customers have `isActive: false`
- Hard delete only occurs when customer has no related records

---

## Best Practices

### 1. Always Use Pagination

For production applications, always specify reasonable pagination parameters:

```bash
# Good
GET /api/customers?page=1&limit=50

# Avoid - May return too many records
GET /api/customers
```

### 2. Leverage Search Instead of Multiple Filters

The `search` parameter is optimized for full-text search across multiple fields:

```bash
# Efficient - Single search parameter
GET /api/customers?search=John

# Less efficient - Multiple individual filters
GET /api/customers?firstName=John&lastName=Doe&email=john
```

### 3. Link Customers to Warehouses and Cities

For better reporting and shipping rate calculations:

```bash
POST /api/customers
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+233501234567",
  "address": "123 Main St",
  "warehouseId": "warehouse-uuid",  # Link to preferred warehouse
  "cityId": "city-uuid"              # Link to city for shipping rates
}
```

### 4. Check for Existing Customers Before Creating

Prevent duplicates by searching first:

```bash
# Step 1: Check if customer exists
GET /api/customers/phone/+233501234567

# Step 2a: If exists, use existing customer ID
# Step 2b: If not exists, create new customer
POST /api/customers {...}
```

### 5. Handle Soft Deletes Properly

Customers with transactions are soft-deleted (deactivated):

```bash
# To reactivate a soft-deleted customer
PATCH /api/customers/{customerId}
{
  "isActive": true
}

# Filter active customers only
GET /api/customers?isActive=true
```

### 6. Use Customer Code for User-Friendly References

Display customer codes to users instead of UUIDs:

```bash
# Good UX - Show customer code
"Customer: JOH12567"

# Poor UX - Show UUID
"Customer: 550e8400-e29b-41d4-a716-446655440000"
```

---

## Common Workflows

### 1. Create New Customer

```bash
# Step 1: Create customer
POST /api/customers
{
  "firstName": "Alice",
  "lastName": "Johnson",
  "phoneNumber": "+233501111111",
  "address": "123 Street, Accra",
  "preferredChannel": "SMS",
  "warehouseId": "warehouse-uuid",
  "cityId": "city-uuid"
}

# Response includes auto-generated customerCode
```

### 2. Search for Existing Customer

```bash
# Option 1: Search by phone
GET /api/customers/phone/+233501111111

# Option 2: Search by name
GET /api/customers?search=Alice

# Option 3: Search by customer code
GET /api/customers/code/ALI11111
```

### 3. View Customer Details and History

```bash
# Get full customer details with last 10 transactions
GET /api/customers/{customerId}

# Get detailed statistics
GET /api/customers/{customerId}/stats
```

### 4. Update Customer Information

```bash
# Update specific fields
PATCH /api/customers/{customerId}
{
  "address": "New address",
  "alternatePhone": "+233241111111",
  "warehouseId": "new-warehouse-uuid"
}
```

### 5. Deactivate Customer

```bash
# Soft delete (deactivate)
PATCH /api/customers/{customerId}
{
  "isActive": false
}

# Or use delete endpoint (automatically soft deletes if has records)
DELETE /api/customers/{customerId}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": [
    "firstName must be longer than or equal to 2 characters",
    "phoneNumber should not be empty"
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
  "message": "Customer not found",
  "error": "Not Found"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Customer with this phone number already exists",
  "error": "Conflict"
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
# Create a new customer
curl -X POST "http://localhost:3000/api/customers" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+233501234567",
    "address": "123 Main St, Accra",
    "preferredChannel": "SMS"
  }'

# Get all customers with filters
curl -X GET "http://localhost:3000/api/customers?search=John&isActive=true&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get customer by ID
curl -X GET "http://localhost:3000/api/customers/{customerId}" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get customer by phone
curl -X GET "http://localhost:3000/api/customers/phone/+233501234567" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get customer statistics
curl -X GET "http://localhost:3000/api/customers/{customerId}/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update customer
curl -X PATCH "http://localhost:3000/api/customers/{customerId}" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "New address, Kumasi",
    "cityId": "uuid-kumasi-city"
  }'

# Delete customer
curl -X DELETE "http://localhost:3000/api/customers/{customerId}" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Migration Guide (v1.0 to v1.1)

If you're upgrading from version 1.0.0 to 1.1.0, here are the changes:

### New Optional Fields

**Request Body (Create/Update):**

```json
{
  // ... existing fields
  "warehouseId": "uuid-warehouse-id", // NEW: Optional
  "cityId": "uuid-city-id" // NEW: Optional
}
```

**Response Body:**

```json
{
  // ... existing fields
  "warehouseId": "uuid-warehouse-id", // NEW: May be null
  "warehouse": {
    // NEW: Nested object when warehouseId exists
    "id": "uuid",
    "name": "Accra Main Warehouse",
    "location": "Industrial Area"
  },
  "cityId": "uuid-city-id", // NEW: May be null
  "cityRef": {
    // NEW: Nested object when cityId exists
    "id": "uuid",
    "name": "Accra",
    "country": "Ghana"
  }
}
```

### Breaking Changes

**None** - All changes are backward compatible:

- New fields are optional in requests
- New fields may appear as `null` in responses
- Existing API calls will continue to work without modification

### Recommended Updates

1. **Update TypeScript interfaces** to include new fields:

```typescript
interface Customer {
  // ... existing fields
  warehouseId?: string | null;
  warehouse?: {
    id: string;
    name: string;
    location: string;
  } | null;
  cityId?: string | null;
  cityRef?: {
    id: string;
    name: string;
    country: string;
  } | null;
}
```

2. **Handle new fields in UI** - Display warehouse and city info when available

3. **Update forms** - Add optional warehouse and city selection dropdowns

---

## Technical Implementation Notes

### Request Validation

The Customers API uses Data Transfer Objects (DTOs) for request validation:

**CustomerFilterDto** - Used for GET /customers endpoint:

- Extends `PaginationDto` (provides `page`, `limit`, `sortBy`, `sortOrder`)
- Adds filter-specific fields: `search`, `isActive`, `city`, `country`
- All query parameters are validated using class-validator decorators
- Invalid query parameters are rejected with a 400 Bad Request error

**Benefits:**

- ✅ Strong type safety and validation
- ✅ Automatic Swagger documentation generation
- ✅ Prevents injection attacks through validated inputs
- ✅ Clear error messages for invalid requests

### Database Schema

**Customer Model Fields:**

```typescript
{
  id: UUID (Primary Key)
  customerCode: String (Unique, Auto-generated)
  warehouseId: UUID (Foreign Key → Warehouse, Optional)
  cityId: UUID (Foreign Key → City, Optional)
  // ... other fields
}
```

**Relationships:**

- `warehouse` → Many-to-One with Warehouse (named relation: "CustomerWarehouse")
- `cityRef` → Many-to-One with City (named relation: "CustomerCity")
- `packages` → One-to-Many with Package
- `invoices` → One-to-Many with Invoice
- `payments` → One-to-Many with Payment

**Indexes:**

- `customerCode` (unique index)
- `email` (index)
- `phoneNumber` (index)
- `idNumber` (index)
- `warehouseId` (index)
- `cityId` (index)

---

## Troubleshooting

### Common Issues

**1. Validation Error: "property search should not exist"**

**Problem:** Query parameter rejected by validation

**Solution:** Ensure you're using the correct parameter names defined in `CustomerFilterDto`:

- ✅ Correct: `?search=John`
- ❌ Incorrect: `?searchTerm=John` or `?query=John`

**Valid query parameters:**

- `page`, `limit`, `sortBy`, `sortOrder` (pagination)
- `search`, `isActive`, `city`, `country` (filters)

---

**2. Foreign Key Constraint Error when Setting warehouseId/cityId**

**Problem:**

```json
{
  "statusCode": 400,
  "message": "Foreign key constraint failed"
}
```

**Solution:** Ensure the warehouse/city ID exists in the database before assigning:

```bash
# Verify warehouse exists
GET /api/warehouses/{warehouseId}

# Verify city exists
GET /api/cities/{cityId}
```

---

**3. Customer Code Already Exists**

**Problem:** Duplicate customer code generated

**Cause:** Two customers with same name pattern and phone number ending

**Solution:** The system automatically appends a counter (e.g., `JOH125671`, `JOH125672`)

This is handled automatically by the backend. If you encounter this error, it's a race condition. Retry the request.

---

**4. Phone Number/Email Already Exists**

**Problem:**

```json
{
  "statusCode": 409,
  "message": "Customer with this phone number already exists"
}
```

**Solutions:**

- Use the existing customer record
- Search for the customer: `GET /api/customers/phone/{phoneNumber}`
- Update the existing customer instead of creating a new one

---

**5. Nested Objects Not Appearing (warehouse/cityRef)**

**Problem:** `warehouse` and `cityRef` fields are missing in response

**Possible causes:**

1. `warehouseId` or `cityId` are `null` (not set)
2. Referenced warehouse/city was deleted
3. Using an old API endpoint that doesn't include relations

**Solution:**

- Check if IDs are set: `customer.warehouseId`, `customer.cityId`
- Verify referenced records exist in database
- Use the correct endpoints (all GET endpoints include relations)

---

## Changelog

### Version 1.2.0 (December 2025)

- ✅ **BREAKING CHANGE:** Removed `city` and `country` string fields from Customer model
- ✅ Use `cityId` and `cityRef` relation for city/country data instead
- ✅ Removed `city` and `country` from query filters (use `cityId` instead)
- ✅ Database migration: `20251204223222_drop_city_country_from_customer`
- ✅ Updated DTOs to remove legacy city/country fields
- ✅ Updated service layer to remove city/country filters

**Migration Notes:**

- If you were using `city` or `country` fields, switch to using `cityRef.name` and `cityRef.country`
- If you were filtering by `city` or `country`, create city records and use `cityId` filter instead
- All existing customer records will have `city` and `country` data removed

### Version 1.1.0 (December 2025)

- ✅ Added `warehouseId` field to link customers to warehouses
- ✅ Added `cityId` field to link customers to cities table
- ✅ Enhanced responses to include warehouse and city details
- ✅ Added indexes for warehouse and city foreign keys
- ✅ Database migration: `20251204214406_add_warehouse_and_city_to_customer`
- ✅ Updated DTOs to include new optional fields
- ✅ Improved service layer to fetch related warehouse and city data

### Version 1.0.0 (November 2025)

- Initial customer API implementation
- Auto-generated customer codes
- Phone and email uniqueness validation
- ID document validation
- Soft delete functionality
- Customer statistics endpoint
- Multiple search methods (ID, code, phone)
- Proper DTO validation with CustomerFilterDto
