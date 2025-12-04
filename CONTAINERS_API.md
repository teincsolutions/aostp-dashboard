# Containers API Documentation

Complete API documentation for container/shipment management endpoints.

---

## Base URL

```
/api/containers
```

All endpoints require authentication via JWT Bearer token.

---

## Overview

Containers represent shipping containers (sea freight) or bags (air freight) used to transport packages from one location to another. Each container:

- Has a unique container number
- Moves from a departure city to a destination city
- Contains multiple packing lists (which contain packages)
- Goes through a defined status lifecycle
- Has tracking information (loading date, ETA, actual arrival)

---

## Endpoints

### 1. Create Container

Create a new container/shipment.

**Endpoint:** `POST /containers`

**Required Roles:** `SUPER_ADMIN`, `OPERATIONS_CLERK`

**Request Body:**

```json
{
  "containerNumber": "CONT-2025-001",
  "containerType": "CONTAINER",
  "loadingDate": "2025-01-15T00:00:00Z",
  "departureCityId": "uuid-departure-city",
  "destinationCityId": "uuid-destination-city",
  "eta": "2025-02-25T00:00:00Z",
  "status": "PLANNED",
  "notes": "Handle with care - fragile items"
}
```

**Request Body Fields:**

| Field               | Type              | Required | Description                                            |
| ------------------- | ----------------- | -------- | ------------------------------------------------------ |
| `containerNumber`   | string            | Yes      | Unique container identifier (e.g., CONT-2025-001)      |
| `containerType`     | enum              | Yes      | Type: `CONTAINER` (sea freight) or `BAG` (air freight) |
| `loadingDate`       | string (ISO date) | Yes      | Date when container is loaded                          |
| `departureCityId`   | string (UUID)     | Yes      | ID of departure city from cities table                 |
| `destinationCityId` | string (UUID)     | Yes      | ID of destination city from cities table               |
| `eta`               | string (ISO date) | Yes      | Estimated time of arrival                              |
| `status`            | enum              | No       | Initial status (default: `PLANNED`)                    |
| `notes`             | string            | No       | Additional notes or instructions                       |

**Response:**

```json
{
  "id": "uuid",
  "containerNumber": "CONT-2025-001",
  "containerType": "CONTAINER",
  "loadingDate": "2025-01-15T00:00:00.000Z",
  "departureCityId": "uuid-departure-city",
  "destinationCityId": "uuid-destination-city",
  "eta": "2025-02-25T00:00:00.000Z",
  "actualArrival": null,
  "status": "PLANNED",
  "notes": "Handle with care - fragile items",
  "createdAt": "2025-12-04T10:00:00.000Z",
  "updatedAt": "2025-12-04T10:00:00.000Z"
}
```

**Error Response (400):**

```json
{
  "statusCode": 400,
  "message": "Container with number CONT-2025-001 already exists"
}
```

---

### 2. Get All Containers (with Filtering & Pagination)

Retrieve all containers with advanced filtering and pagination.

**Endpoint:** `GET /containers`

**Required Roles:** `SUPER_ADMIN`, `OPERATIONS_CLERK`, `FINANCE_MANAGER`

**Query Parameters:**

| Parameter         | Type   | Required | Description                                                           |
| ----------------- | ------ | -------- | --------------------------------------------------------------------- |
| `page`            | number | No       | Page number (default: 1)                                              |
| `limit`           | number | No       | Items per page (default: 20)                                          |
| `sortBy`          | string | No       | Field to sort by (default: createdAt)                                 |
| `sortOrder`       | string | No       | Sort order: `asc` or `desc` (default: desc)                           |
| `status`          | enum   | No       | Filter by status: `PLANNED`, `LOADED`, `SHIPPED`, `ARRIVED`, `CLOSED` |
| `departureCity`   | string | No       | Filter by departure city name                                         |
| `destinationCity` | string | No       | Filter by destination city name                                       |
| `search`          | string | No       | Search by container number (partial match, case-insensitive)          |

**Example Request:**

```bash
GET /api/containers?page=1&limit=20&status=SHIPPED&search=CONT-2025
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "containerNumber": "CONT-2025-001",
      "containerType": "CONTAINER",
      "loadingDate": "2025-01-15T00:00:00.000Z",
      "departureCityId": "uuid-departure",
      "departureCity": {
        "id": "uuid-departure",
        "name": "Guangzhou",
        "country": "China"
      },
      "destinationCityId": "uuid-destination",
      "destinationCity": {
        "id": "uuid-destination",
        "name": "Accra",
        "country": "Ghana"
      },
      "eta": "2025-02-25T00:00:00.000Z",
      "actualArrival": null,
      "status": "SHIPPED",
      "notes": "Handle with care",
      "createdAt": "2025-12-04T10:00:00.000Z",
      "updatedAt": "2025-12-04T10:00:00.000Z",
      "_count": {
        "packingLists": 5
      }
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**Filter Examples:**

1. **Filter by status:**

   ```
   GET /api/containers?status=SHIPPED
   ```

2. **Filter by route:**

   ```
   GET /api/containers?departureCity=Guangzhou&destinationCity=Accra
   ```

3. **Search by container number:**

   ```
   GET /api/containers?search=CONT-2025
   ```

4. **Combined filters:**
   ```
   GET /api/containers?status=SHIPPED&departureCity=Guangzhou&page=1&limit=50
   ```

---

### 3. Get Active Containers

Retrieve all containers that are not yet closed (in transit or planned).

**Endpoint:** `GET /containers/active`

**Required Roles:** `SUPER_ADMIN`, `OPERATIONS_CLERK`, `FINANCE_MANAGER`

**Example Request:**

```bash
GET /api/containers/active
```

**Response:**

```json
[
  {
    "id": "uuid",
    "containerNumber": "CONT-2025-001",
    "containerType": "CONTAINER",
    "status": "SHIPPED",
    "loadingDate": "2025-01-15T00:00:00.000Z",
    "eta": "2025-02-25T00:00:00.000Z",
    "departureCity": {
      "name": "Guangzhou",
      "country": "China"
    },
    "destinationCity": {
      "name": "Accra",
      "country": "Ghana"
    },
    "packingLists": [
      {
        "id": "uuid",
        "name": "PL-2025-001",
        "totalPackages": 25
      }
    ]
  }
]
```

**Notes:**

- Returns containers with status: `PLANNED`, `LOADED`, `SHIPPED`, or `ARRIVED`
- Excludes containers with status `CLOSED`
- Useful for tracking in-transit shipments

---

### 4. Get Containers by Date Range

Retrieve containers loaded within a specific date range.

**Endpoint:** `GET /containers/date-range`

**Required Roles:** `SUPER_ADMIN`, `OPERATIONS_CLERK`

**Query Parameters:**

| Parameter   | Type              | Required | Description                   |
| ----------- | ----------------- | -------- | ----------------------------- |
| `startDate` | string (ISO date) | Yes      | Start date (e.g., 2025-01-01) |
| `endDate`   | string (ISO date) | Yes      | End date (e.g., 2025-12-31)   |

**Example Request:**

```bash
GET /api/containers/date-range?startDate=2025-01-01&endDate=2025-12-31
```

**Response:**

```json
[
  {
    "id": "uuid",
    "containerNumber": "CONT-2025-001",
    "containerType": "CONTAINER",
    "loadingDate": "2025-01-15T00:00:00.000Z",
    "status": "SHIPPED",
    "departureCity": {
      "name": "Guangzhou"
    },
    "destinationCity": {
      "name": "Accra"
    }
  }
]
```

---

### 5. Get Container by Container Number

Retrieve a container by its unique container number.

**Endpoint:** `GET /containers/number/:containerNumber`

**Required Roles:** All authenticated users

**Path Parameters:**

- `containerNumber` (string, required) - Container number (e.g., CONT-2025-001)

**Example Request:**

```bash
GET /api/containers/number/CONT-2025-001
```

**Response:**

```json
{
  "id": "uuid",
  "containerNumber": "CONT-2025-001",
  "containerType": "CONTAINER",
  "loadingDate": "2025-01-15T00:00:00.000Z",
  "departureCityId": "uuid-departure",
  "departureCity": {
    "id": "uuid-departure",
    "name": "Guangzhou",
    "country": "China"
  },
  "destinationCityId": "uuid-destination",
  "destinationCity": {
    "id": "uuid-destination",
    "name": "Accra",
    "country": "Ghana"
  },
  "eta": "2025-02-25T00:00:00.000Z",
  "actualArrival": null,
  "status": "SHIPPED",
  "notes": "Handle with care",
  "createdAt": "2025-12-04T10:00:00.000Z",
  "updatedAt": "2025-12-04T10:00:00.000Z",
  "packingLists": [
    {
      "id": "uuid",
      "name": "PL-2025-001",
      "totalPackages": 25,
      "totalCBM": 15.5,
      "totalWeight": 500.0
    }
  ]
}
```

---

### 6. Get Container by ID

Retrieve detailed container information by ID.

**Endpoint:** `GET /containers/:id`

**Required Roles:** All authenticated users

**Path Parameters:**

- `id` (string, required) - Container UUID

**Example Request:**

```bash
GET /api/containers/uuid
```

**Response:** Same structure as "Get Container by Container Number"

---

### 7. Get Container Statistics

Get comprehensive statistics for a specific container.

**Endpoint:** `GET /containers/:id/statistics`

**Required Roles:** `SUPER_ADMIN`, `OPERATIONS_CLERK`, `FINANCE_MANAGER`

**Path Parameters:**

- `id` (string, required) - Container UUID

**Example Request:**

```bash
GET /api/containers/uuid/statistics
```

**Response:**

```json
{
  "container": {
    "id": "uuid",
    "containerNumber": "CONT-2025-001",
    "containerType": "CONTAINER",
    "status": "SHIPPED",
    "loadingDate": "2025-01-15T00:00:00.000Z",
    "eta": "2025-02-25T00:00:00.000Z"
  },
  "statistics": {
    "totalPackingLists": 3,
    "totalPackages": 150,
    "totalCustomers": 45,
    "totalCBM": 85.5,
    "totalWeight": 2500.75,
    "totalShippingCost": 12500.0,
    "currency": "USD",
    "packingListBreakdown": [
      {
        "packingListName": "PL-2025-001",
        "packages": 50,
        "customers": 15,
        "cbm": 28.5,
        "weight": 850.25
      },
      {
        "packingListName": "PL-2025-002",
        "packages": 60,
        "customers": 18,
        "cbm": 32.0,
        "weight": 950.5
      },
      {
        "packingListName": "PL-2025-003",
        "packages": 40,
        "customers": 12,
        "cbm": 25.0,
        "weight": 700.0
      }
    ]
  }
}
```

**Statistics Breakdown:**

| Stat                   | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `totalPackingLists`    | Number of packing lists in container              |
| `totalPackages`        | Total number of packages across all packing lists |
| `totalCustomers`       | Unique customers with packages in container       |
| `totalCBM`             | Total cubic meters (for sea freight)              |
| `totalWeight`          | Total weight in kg (for air freight)              |
| `totalShippingCost`    | Sum of all package shipping costs                 |
| `packingListBreakdown` | Per-packing-list statistics                       |

---

### 8. Update Container

Update container information.

**Endpoint:** `PATCH /containers/:id`

**Required Roles:** `SUPER_ADMIN`, `OPERATIONS_CLERK`

**Path Parameters:**

- `id` (string, required) - Container UUID

**Request Body:**

All fields are optional. Only include fields you want to update.

```json
{
  "containerNumber": "CONT-2025-001-UPDATED",
  "loadingDate": "2025-01-20T00:00:00Z",
  "eta": "2025-03-01T00:00:00Z",
  "notes": "Updated notes"
}
```

**Response:**

```json
{
  "id": "uuid",
  "containerNumber": "CONT-2025-001-UPDATED",
  "containerType": "CONTAINER",
  "loadingDate": "2025-01-20T00:00:00.000Z",
  "eta": "2025-03-01T00:00:00.000Z",
  "status": "PLANNED",
  "notes": "Updated notes",
  "updatedAt": "2025-12-04T15:00:00.000Z"
}
```

**Notes:**

- Cannot update `status` through this endpoint (use status update endpoint instead)
- Cannot change `departureCityId` or `destinationCityId` if packing lists exist
- Container number must remain unique

---

### 9. Update Container Status

Update the status of a container through its lifecycle.

**Endpoint:** `PATCH /containers/:id/status`

**Required Roles:** `SUPER_ADMIN`, `OPERATIONS_CLERK`

**Path Parameters:**

- `id` (string, required) - Container UUID

**Request Body:**

```json
{
  "status": "LOADED"
}
```

**Valid Status Values:**

| Status    | Description                             |
| --------- | --------------------------------------- |
| `PLANNED` | Container is planned but not yet loaded |
| `LOADED`  | Container has been loaded with cargo    |
| `SHIPPED` | Container is in transit                 |
| `ARRIVED` | Container has arrived at destination    |
| `CLOSED`  | Container processing is complete        |

**Status Transition Rules:**

The system enforces valid status transitions:

- `PLANNED` → `LOADED` ✅
- `LOADED` → `SHIPPED` ✅
- `SHIPPED` → `ARRIVED` ✅
- `ARRIVED` → `CLOSED` ✅
- All other transitions are **invalid** ❌

**Example Request:**

```bash
PATCH /api/containers/uuid/status
Content-Type: application/json

{
  "status": "LOADED"
}
```

**Response (Success):**

```json
{
  "id": "uuid",
  "containerNumber": "CONT-2025-001",
  "status": "LOADED",
  "loadingDate": "2025-01-15T00:00:00.000Z",
  "eta": "2025-02-25T00:00:00.000Z",
  "actualArrival": null,
  "updatedAt": "2025-12-04T15:00:00.000Z"
}
```

**Response (Invalid Transition - 400):**

```json
{
  "statusCode": 400,
  "message": "Invalid status transition from SHIPPED to PLANNED"
}
```

**Special Behavior:**

- When status changes to `ARRIVED`, `actualArrival` is automatically set to current timestamp
- Status changes are logged in audit logs with old and new status

---

### 10. Delete Container

Delete a container (only if no packing lists exist).

**Endpoint:** `DELETE /containers/:id`

**Required Roles:** `SUPER_ADMIN` only

**Path Parameters:**

- `id` (string, required) - Container UUID

**Example Request:**

```bash
DELETE /api/containers/uuid
```

**Response (Success - 204 No Content):**

Empty response body

**Error Response (400):**

```json
{
  "statusCode": 400,
  "message": "Cannot delete container that has packing lists"
}
```

**Notes:**

- Container can only be deleted if no packing lists are associated
- This is a hard delete (permanent removal)
- Only SUPER_ADMIN role can delete containers

---

## Container Types

| Type        | Description           | Use Case                          |
| ----------- | --------------------- | --------------------------------- |
| `CONTAINER` | Sea freight container | Large shipments via ocean freight |
| `BAG`       | Air freight bag       | Smaller shipments via air freight |

---

## Container Status Lifecycle

```
PLANNED → LOADED → SHIPPED → ARRIVED → CLOSED
```

**Status Descriptions:**

1. **PLANNED**: Container is scheduled but cargo not yet loaded
2. **LOADED**: All cargo has been loaded into container
3. **SHIPPED**: Container is in transit (departed from origin)
4. **ARRIVED**: Container has reached destination port/airport
5. **CLOSED**: All processing complete, packages released to customers

---

## Important Notes

### Container Number Uniqueness

- Container numbers must be unique across the entire system
- Recommended format: `CONT-YYYY-NNN` (e.g., CONT-2025-001)
- Cannot be changed once packing lists are created

### City References

- `departureCityId` and `destinationCityId` must reference valid cities in the database
- Cities are used for shipping rate calculations
- Both departure and destination cities are required

### ETA (Estimated Time of Arrival)

- Typical sea freight: 40-45 days from loading
- Typical air freight: 3-7 days from loading
- ETA is used as default due date for invoices
- Can be updated if schedule changes

### Actual Arrival

- Automatically set when status changes to `ARRIVED`
- Read-only field (cannot be manually set)
- Used for performance tracking and reporting

### Packing Lists

- A container can have multiple packing lists
- Packing lists group packages for organizational purposes
- All packing lists in a container share the same route (departure → destination)

---

## Common Workflows

### 1. Create and Load Container

```bash
# Step 1: Create container
POST /api/containers
{
  "containerNumber": "CONT-2025-001",
  "containerType": "CONTAINER",
  "loadingDate": "2025-01-15T00:00:00Z",
  "departureCityId": "uuid-guangzhou",
  "destinationCityId": "uuid-accra",
  "eta": "2025-02-25T00:00:00Z"
}

# Step 2: Create packing lists (see Packing Lists API)
POST /api/packing-lists
{
  "containerId": "container-uuid",
  "packages": ["pkg-uuid-1", "pkg-uuid-2"]
}

# Step 3: Update status to LOADED when ready
PATCH /api/containers/{containerId}/status
{
  "status": "LOADED"
}
```

### 2. Track Container in Transit

```bash
# Step 1: Update status to SHIPPED
PATCH /api/containers/{containerId}/status
{
  "status": "SHIPPED"
}

# Step 2: Check active containers
GET /api/containers/active

# Step 3: When arrived, update status
PATCH /api/containers/{containerId}/status
{
  "status": "ARRIVED"
}
# actualArrival timestamp is automatically set
```

### 3. View Container Statistics

```bash
# Get comprehensive statistics
GET /api/containers/{containerId}/statistics

# Use for:
# - Capacity planning
# - Revenue reporting
# - Customer notifications
```

### 4. Search and Filter Containers

```bash
# Find all shipped containers from Guangzhou
GET /api/containers?status=SHIPPED&departureCity=Guangzhou

# Find specific container
GET /api/containers/number/CONT-2025-001

# Get containers for date range (for reports)
GET /api/containers/date-range?startDate=2025-01-01&endDate=2025-12-31
```

### 5. Close Container

```bash
# Step 1: Ensure all packages are released
# (Check via statistics endpoint)

# Step 2: Close container
PATCH /api/containers/{containerId}/status
{
  "status": "CLOSED"
}
```

---

## Best Practices

### 1. Use Meaningful Container Numbers

```bash
# Good - Descriptive and unique
CONT-2025-001, SEA-ACCRA-2025-JAN-001, AIR-BAG-2025-12-001

# Avoid - Generic or confusing
CONT1, Container, ABC123
```

### 2. Set Realistic ETAs

- Sea freight: Add 40-45 days to loading date
- Air freight: Add 3-7 days to loading date
- Consider holidays and customs clearance time

### 3. Update Status Promptly

Update container status as soon as each milestone is reached:

- `LOADED` - When last package is loaded
- `SHIPPED` - When container departs (bill of lading issued)
- `ARRIVED` - When container clears customs at destination
- `CLOSED` - When last package is released

### 4. Monitor Active Containers

```bash
# Daily check of in-transit containers
GET /api/containers/active

# Identify delays by comparing ETA vs. current date
```

### 5. Don't Delete Containers with History

- Containers with packing lists cannot be deleted
- This preserves historical shipping records
- Use status `CLOSED` to mark completed containers

### 6. Use Container Statistics for Planning

```bash
GET /api/containers/{containerId}/statistics

# Use data for:
# - Capacity utilization analysis
# - Customer distribution insights
# - Revenue forecasting
```

---

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Invalid status transition from SHIPPED to PLANNED",
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
  "message": "Container not found",
  "error": "Not Found"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Container with number CONT-2025-001 already exists",
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
# Create a new container
curl -X POST "http://localhost:3000/api/containers" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "containerNumber": "CONT-2025-001",
    "containerType": "CONTAINER",
    "loadingDate": "2025-01-15T00:00:00Z",
    "departureCityId": "uuid-guangzhou",
    "destinationCityId": "uuid-accra",
    "eta": "2025-02-25T00:00:00Z"
  }'

# Get all containers with filters
curl -X GET "http://localhost:3000/api/containers?status=SHIPPED&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get active containers
curl -X GET "http://localhost:3000/api/containers/active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get container by number
curl -X GET "http://localhost:3000/api/containers/number/CONT-2025-001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get container statistics
curl -X GET "http://localhost:3000/api/containers/{containerId}/statistics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update container status
curl -X PATCH "http://localhost:3000/api/containers/{containerId}/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "LOADED"}'

# Update container details
curl -X PATCH "http://localhost:3000/api/containers/{containerId}" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eta": "2025-03-01T00:00:00Z",
    "notes": "Updated ETA due to weather"
  }'

# Delete container
curl -X DELETE "http://localhost:3000/api/containers/{containerId}" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Technical Implementation Notes

### Request Validation

The Containers API uses DTOs for request validation:

**ContainerFilterDto** - Used for GET /containers:

- Extends `PaginationDto` (provides pagination fields)
- Adds filter-specific fields: `status`, `departureCity`, `destinationCity`, `search`
- All query parameters validated with class-validator decorators

**UpdateContainerStatusDto** - Used for PATCH /containers/:id/status:

- Contains single field: `status` (enum)
- Validates against ContainerStatus enum
- Request body required (not query parameter)

### Database Schema

**Container Model:**

```typescript
{
  id: UUID (Primary Key)
  containerNumber: String (Unique)
  containerType: ContainerType enum
  loadingDate: DateTime
  departureCityId: UUID (Foreign Key → City)
  destinationCityId: UUID (Foreign Key → City)
  eta: DateTime
  actualArrival: DateTime (nullable, auto-set on ARRIVED status)
  status: ContainerStatus enum
  notes: String (nullable)
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Relationships:**

- `departureCity` → Many-to-One with City
- `destinationCity` → Many-to-One with City
- `packingLists` → One-to-Many with PackingList

**Indexes:**

- `containerNumber` (unique index)
- `status` (index)
- `containerType` (index)

---

## Troubleshooting

### Common Issues

**1. "Container with number XXX already exists"**

**Problem:** Attempting to create container with duplicate number

**Solution:** Check existing containers first:

```bash
GET /api/containers/number/{containerNumber}
```

---

**2. "Invalid status transition from X to Y"**

**Problem:** Attempting invalid status change

**Solution:** Follow the status lifecycle:

```
PLANNED → LOADED → SHIPPED → ARRIVED → CLOSED
```

Cannot skip statuses or go backward.

---

**3. "Cannot delete container that has packing lists"**

**Problem:** Trying to delete container with associated packing lists

**Solution:**

- Containers with packing lists cannot be deleted (preserves history)
- Use `CLOSED` status instead to mark as complete
- Only empty containers can be deleted

---

**4. "City with ID xxx not found"**

**Problem:** Invalid departure or destination city ID

**Solution:** Verify city exists:

```bash
GET /api/cities/{cityId}
```

Create city if needed before creating container.

---

**5. Status Not Updating**

**Problem:** Status update fails or request body format incorrect

**Common cause:** Using query parameter instead of request body

**Correct format:**

```bash
PATCH /api/containers/{id}/status
Content-Type: application/json

{"status": "LOADED"}
```

**Incorrect format (will fail):**

```bash
PATCH /api/containers/{id}/status?status=LOADED
# ❌ Query parameter not supported
```

---

## Changelog

### Version 1.1.0 (December 2025)

- ✅ Fixed status update endpoint to use request body instead of query parameter
- ✅ Added `UpdateContainerStatusDto` for proper validation
- ✅ Enhanced error messages for invalid status transitions
- ✅ Added comprehensive API documentation
- ✅ Improved Swagger documentation with response examples

### Version 1.0.0 (November 2025)

- Initial container API implementation
- Container creation and management
- Status lifecycle tracking
- City-based routing
- Statistics and reporting endpoints
- Date range filtering
- Active containers tracking
