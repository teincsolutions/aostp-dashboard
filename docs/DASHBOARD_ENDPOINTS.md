# Dashboard Endpoints Documentation

## Overview

The dashboard endpoints provide time-series data, rankings, and recent activity for building visual dashboards and admin panels. All endpoints support filtering by warehouse, shipping mode, and date ranges.

## Authentication

All endpoints require JWT authentication with appropriate roles:

- `SUPER_ADMIN` - Full access
- `FINANCE_MANAGER` - All endpoints
- `OPERATIONS_CLERK` - Most endpoints (except financial details)

## Common Query Parameters

### Dashboard Query Parameters (Graphs)

| Parameter      | Type   | Required | Description                                    |
| -------------- | ------ | -------- | ---------------------------------------------- |
| `year`         | number | No       | Year for the report (defaults to current year) |
| `warehouseId`  | string | No       | Filter by warehouse ID                         |
| `shippingMode` | enum   | No       | Filter by `AIR` or `SEA`                       |
| `fromDate`     | string | No       | Start date (ISO 8601)                          |
| `toDate`       | string | No       | End date (ISO 8601)                            |

### Recent Items Query Parameters

| Parameter     | Type   | Required | Description                               |
| ------------- | ------ | -------- | ----------------------------------------- |
| `limit`       | number | No       | Items per page (default: 20, max: 100)    |
| `cursor`      | string | No       | Cursor for pagination (from `nextCursor`) |
| `warehouseId` | string | No       | Filter by warehouse ID                    |

---

## Graph Endpoints

### 1. Invoices by Month

**GET** `/reports/dashboard/invoices-by-month`

Returns monthly invoice counts for bar/line charts.

**Query Parameters:**

- `year` - Year to report (defaults to current)
- `warehouseId` - Optional warehouse filter

**Response:**

```json
{
  "year": 2025,
  "series": [
    {
      "month": "JAN",
      "count": 245
    },
    {
      "month": "FEB",
      "count": 189
    },
    {
      "month": "MAR",
      "count": 0
    }
  ]
}
```

**Note:** Returns all 12 months (JAN-DEC) with counts, months with no data show `count: 0`.

**Use Case:** Display monthly invoice creation trends

---

### 2. Payments by Month (AIR vs SEA)

**GET** `/reports/dashboard/payments-by-month`

Returns monthly payment totals grouped by shipping mode for comparison charts.

**Query Parameters:**

- `year` - Year to report
- `warehouseId` - Optional warehouse filter

**Response:**

```json
{
  "year": 2025,
  "series": [
    {
      "month": "JAN",
      "air": 125000.5,
      "sea": 89000.0
    },
    {
      "month": "FEB",
      "air": 145000.0,
      "sea": 95000.75
    },
    {
      "month": "MAR",
      "air": 0,
      "sea": 0
    }
  ]
}
```

**Note:** Returns all 12 months with `air` and `sea` amounts. Amounts are rounded to 2 decimal places.

**Use Case:** Compare AIR vs SEA payment volumes over time

---

### 3. Intakes by Month

**GET** `/reports/dashboard/intakes-by-month`

Returns monthly package intake counts for operations dashboard.

**Query Parameters:**

- `year` - Year to report
- `warehouseId` - Optional warehouse filter

**Response:**

```json
{
  "year": 2025,
  "series": [
    {
      "month": "JAN",
      "count": 1250
    },
    {
      "month": "FEB",
      "count": 980
    },
    {
      "month": "MAR",
      "count": 0
    }
  ]
}
```

**Note:** Returns all 12 months with intake counts.

**Use Case:** Track warehouse intake operations monthly

---

### 4. Pickups by Month

**GET** `/reports/dashboard/pickups-by-month`

Returns monthly package pickup/delivery counts.

**Query Parameters:**

- `year` - Year to report

**Response:**

```json
{
  "year": 2025,
  "series": [
    {
      "month": "JAN",
      "count": 890
    },
    {
      "month": "FEB",
      "count": 720
    },
    {
      "month": "MAR",
      "count": 0
    }
  ]
}
```

**Note:** Returns all 12 months with pickup counts.

**Use Case:** Monitor delivery performance trends

---

### 5. Payment Methods Breakdown

**GET** `/reports/dashboard/payment-methods`

Returns payment totals grouped by payment method (CASH, MOMO, etc.).

**Query Parameters:**

- `year` - Year to report
- `warehouseId` - Optional warehouse filter

**Response:**

```json
{
  "total": 950000.5,
  "methods": [
    {
      "method": "MOMO",
      "amount": 450000.0
    },
    {
      "method": "CASH",
      "amount": 320000.5
    },
    {
      "method": "BANK_TRANSFER",
      "amount": 180000.0
    }
  ]
}
```

**Note:** `total` is the sum of all payment method amounts. Amounts are rounded to 2 decimal places.

**Use Case:** Display payment method distribution pie chart

---

### 6. Shipping Modes Summary

**GET** `/reports/dashboard/shipping-modes`

Returns count of packages by shipping mode (AIR vs SEA).

**Query Parameters:**

- `year` - Year to report
- `warehouseId` - Optional warehouse filter

**Response:**

```json
{
  "air": 1520,
  "sea": 2340
}
```

**Note:** Simple object with `air` and `sea` counts. If a shipping mode has no packages, it returns `0`.

**Use Case:** Show shipping mode distribution

---

### 7. Top Customers by Amount

**GET** `/reports/dashboard/top-customers-by-amount`

Returns top 10 customers ranked by total invoice amount with payment status.

**Query Parameters:**

- `year` - Year to report
- `warehouseId` - Optional warehouse filter

**Response:**

```json
{
  "year": 2025,
  "top": [
    {
      "customerCode": "CUST-001",
      "customerName": "John Doe",
      "totalAmount": 145000.5,
      "totalPaid": 120000.0,
      "balance": 25000.5,
      "invoiceCount": 15
    },
    {
      "customerCode": "CUST-002",
      "customerName": "Jane Smith",
      "totalAmount": 98000.0,
      "totalPaid": 98000.0,
      "balance": 0.0,
      "invoiceCount": 8
    }
  ]
}
```

**Note:** Returns top 10 customers in `top` array. All amounts are rounded to 2 decimal places.

**Use Case:** Identify top revenue customers

---

### 8. Top Customers by Shipping Metrics

**GET** `/reports/dashboard/top-customers-shipping`

Returns top 10 customers ranked by CBM and weight separately.

**Query Parameters:**

- `year` - Year to report
- `warehouseId` - Optional warehouse filter

**Response:**

```json
{
  "year": 2025,
  "topByCbm": [
    {
      "customerCode": "CUST-001",
      "customerName": "John Doe",
      "cbm": 125.5,
      "weight": 2500.0,
      "rank": 1
    },
    {
      "customerCode": "CUST-002",
      "customerName": "Alice Brown",
      "cbm": 98.3,
      "weight": 1800.0,
      "rank": 2
    }
  ],
  "topByWeight": [
    {
      "customerCode": "CUST-003",
      "customerName": "Jane Smith",
      "cbm": 85.0,
      "weight": 3200.0,
      "rank": 1
    },
    {
      "customerCode": "CUST-001",
      "customerName": "John Doe",
      "cbm": 125.5,
      "weight": 2500.0,
      "rank": 2
    }
  ]
}
```

**Note:** Two separate arrays: `topByCbm` (sorted by CBM) and `topByWeight` (sorted by weight). Each has up to 10 customers with their rank. CBM and weight are rounded to 2 decimal places.

**Use Case:** Identify customers with highest shipping volumes

---

## Recent Activity Endpoints

All recent activity endpoints support cursor-based pagination with:

- Default `limit`: 20 items
- Maximum `limit`: 100 items
- `nextCursor`: Included in response when more data available

### 9. Recent Intakes

**GET** `/reports/dashboard/recent-intakes`

Returns last 20 package intakes with pagination support.

**Query Parameters:**

- `limit` - Items per page (default: 20)
- `cursor` - Pagination cursor
- `warehouseId` - Optional filter

**Response:**

```json
{
  "items": [
    {
      "id": "uuid-here",
      "intakeTrackingCode": "ITK-2025-001",
      "customerCode": "CUST-001",
      "customerName": "John Doe",
      "description": "Electronics",
      "quantity": 5,
      "weight": 50.0,
      "cbm": 2.5,
      "intakeDate": "2025-03-15T10:30:00.000Z",
      "warehouse": "Main Warehouse"
    }
  ],
  "total": 20,
  "nextCursor": "uuid-of-last-item",
  "hasMore": true
}
```

**Note:** `total` is the count of items in current page. `nextCursor` is the ID of the last item for pagination.

**Use Case:** Recent warehouse intake activity table

---

### 10. Recent Invoices & Payments

**GET** `/reports/dashboard/recent-invoices-payments`

Returns last 20 invoices with payment counts and balance information.

**Query Parameters:**

- `limit` - Items per page
- `cursor` - Pagination cursor
- `warehouseId` - Optional filter

**Response:**

```json
{
  "items": [
    {
      "id": "uuid-here",
      "invoiceNumber": "INV-2025-001",
      "customerCode": "CUST-001",
      "customerName": "John Doe",
      "totalAmount": 5000.0,
      "paidAmount": 3000.0,
      "balance": 2000.0,
      "status": "PARTIALLY_PAID",
      "paymentCount": 2,
      "createdAt": "2025-03-15T14:00:00.000Z",
      "dueDate": "2025-04-15T00:00:00.000Z"
    }
  ],
  "total": 20,
  "nextCursor": "uuid-of-last-item",
  "hasMore": true
}
```

**Note:** Includes `paymentCount` (number of payments made), `dueDate`, and full invoice details.

**Use Case:** Recent financial activity dashboard

---

### 11. Recent Aged Packages

**GET** `/reports/dashboard/recent-aged-packages`

Returns packages not yet released, ordered by days in warehouse.

**Query Parameters:**

- `limit` - Items per page
- `cursor` - Pagination cursor
- `warehouseId` - Optional filter

**Response:**

```json
{
  "items": [
    {
      "id": "uuid-here",
      "trackingCode": "PKG-2024-500",
      "customerCode": "CUST-005",
      "customerName": "Bob Johnson",
      "description": "Furniture",
      "status": "RECEIVED",
      "daysInWarehouse": 104,
      "receivedDate": "2024-12-01T10:00:00.000Z",
      "warehouse": "Main Warehouse"
    }
  ],
  "total": 15,
  "nextCursor": "uuid-of-last-item",
  "hasMore": true
}
```

**Note:** Only returns packages NOT yet released, sorted by `daysInWarehouse` in descending order (oldest first).

**Use Case:** Alert for packages requiring attention

---

### 12. Recent Packing Lists

**GET** `/reports/dashboard/recent-packing-lists`

Returns last 20 packing lists with container information.

**Query Parameters:**

- `limit` - Items per page
- `cursor` - Pagination cursor
- `warehouseId` - Optional filter

**Response:**

```json
{
  "items": [
    {
      "id": "uuid-here",
      "name": "PL-2025-001",
      "containerNumber": "CONT-2025-001",
      "status": "IN_TRANSIT",
      "totalPackages": 45,
      "totalCustomers": 12,
      "totalCBM": 125.5,
      "totalWeight": 2500.0,
      "loadingDate": "2025-03-15T08:00:00.000Z",
      "eta": "2025-04-10T00:00:00.000Z",
      "warehouse": "Main Warehouse"
    }
  ],
  "total": 20,
  "nextCursor": "uuid-of-last-item",
  "hasMore": true
}
```

**Note:** Includes `totalCBM` and `totalWeight` for the entire packing list. Sorted by `loadingDate` in descending order.

**Use Case:** Track container shipments

---

### 13. Recent Pickups

**GET** `/reports/dashboard/recent-pickups`

Returns last 20 package deliveries/pickups.

**Query Parameters:**

- `limit` - Items per page
- `cursor` - Pagination cursor

**Response:**

```json
{
  "items": [
    {
      "deliveryId": "uuid-here",
      "customerCode": "CUST-010",
      "customerName": "Alice Brown",
      "invoiceNumber": "INV-2025-150",
      "trackingCode": "PKG-2025-150",
      "pickupCode": "PUC-2025-150",
      "quantity": 3,
      "receiverName": "John Pickup",
      "releaseDate": "2025-03-15T16:30:00.000Z",
      "warehouse": "Main Warehouse"
    }
  ],
  "total": 20,
  "nextCursor": "uuid-of-last-delivery",
  "hasMore": true
}
```

**Note:** Uses `deliveryId` as the cursor (not package ID). Includes `quantity` of packages delivered and `pickupCode` for verification.

**Use Case:** Recent delivery activity log

---

## Aggregation Logic

### Monthly Aggregations

All monthly endpoints group data by:

1. Extract month and year from relevant date fields
2. Filter by year (defaults to current year)
3. Group results by month number (1-12)
4. Convert month number to abbreviation (JAN, FEB, etc.)
5. Fill missing months with zero values for complete chart data

**Date Fields Used:**

- Invoices: `createdAt`
- Payments: `createdAt`
- Intakes: `intakeDate`
- Pickups: `releaseDate`

### Top Customer Rankings

Rankings use:

- **By Amount**: Total invoice amounts (descending)
- **By CBM**: Total cubic meters shipped (descending)
- **By Weight**: Total weight in kg (descending)

Limit: Top 10 only

### Recent Activity Pagination

Uses cursor-based pagination:

1. Order by primary date field (DESC)
2. Use ID (or deliveryId for pickups) as cursor for stable pagination
3. Return `nextCursor` when more data exists (null when no more data)
4. Default limit: 20, max: 100
5. `total` field shows count of items in current page response
6. `hasMore` boolean indicates if more pages exist

---

## Performance Considerations

### Indexing

Ensure indexes on:

- `Invoice.createdAt`
- `Payment.createdAt`
- `PackageItem.intakeDate`
- `PackageDelivery.releaseDate`
- `PackageItem.warehouseId`
- `Package.shippingMode`

### Query Optimization

- All queries use selective field projection
- Aggregations use Prisma `groupBy` and `aggregate`
- Recent items use indexed cursor fields
- Limit maximum `limit` parameter to 100

### Caching Recommendations

Consider caching:

- Monthly aggregations (TTL: 1 hour)
- Top customer rankings (TTL: 1 hour)
- Recent activity (TTL: 5 minutes)

---

## Error Responses

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
  "message": "Insufficient permissions"
}
```

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Invalid query parameters",
  "errors": ["limit must be between 1 and 100"]
}
```

---

## Usage Examples

### Frontend Chart Integration

```typescript
// Fetch monthly invoice data
const response = await fetch('/reports/dashboard/invoices-by-month?year=2025');
const { year, series } = await response.json();

// Convert to chart data
const chartData = {
  labels: series.map((item) => item.month), // ['JAN', 'FEB', 'MAR', ...]
  datasets: [
    {
      label: `Invoices ${year}`,
      data: series.map((item) => item.count),
    },
  ],
};
```

### Chart.js with AIR vs SEA Comparison

```typescript
// Fetch payment comparison data
const response = await fetch('/reports/dashboard/payments-by-month?year=2025');
const { year, series } = await response.json();

const chartData = {
  labels: series.map((item) => item.month),
  datasets: [
    {
      label: 'AIR Payments',
      data: series.map((item) => item.air),
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
    },
    {
      label: 'SEA Payments',
      data: series.map((item) => item.sea),
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
    },
  ],
};
```

### Pagination Example

```typescript
// Load all pages of recent intakes
let cursor = null;
const allItems = [];

do {
  const url = `/reports/dashboard/recent-intakes?limit=50${cursor ? `&cursor=${cursor}` : ''}`;
  const response = await fetch(url);
  const { items, total, nextCursor, hasMore } = await response.json();

  allItems.push(...items);
  console.log(`Loaded ${total} items, total so far: ${allItems.length}`);

  cursor = hasMore ? nextCursor : null;
} while (cursor);

console.log(`Total items loaded: ${allItems.length}`);
```

### Single Page Load

```typescript
// Just load first page
const response = await fetch('/reports/dashboard/recent-intakes?limit=20');
const { items, total, hasMore } = await response.json();

console.log(`Showing ${items.length} items`);
if (hasMore) {
  console.log('More items available');
}
```

### Filter by Warehouse

```typescript
// Get data for specific warehouse
const warehouseId = 'wh-001';
const response = await fetch(
  `/reports/dashboard/payments-by-month?year=2025&warehouseId=${warehouseId}`,
);
```

---

## Testing Checklist

- [ ] All 13 endpoints return valid responses
- [ ] Year defaults to current year when not provided
- [ ] Month abbreviations are correct (JAN-DEC)
- [ ] Pagination cursors work correctly
- [ ] Warehouse filtering applies to all endpoints
- [ ] Role-based access control enforced
- [ ] Empty data returns empty arrays (not errors)
- [ ] Date range filtering works correctly
- [ ] Currency amounts use correct precision
- [ ] Top 10 rankings return max 10 items

---

## Troubleshooting

### No Data Returned

1. Check year parameter matches data in database
2. Verify warehouse filter is correct
3. Ensure date ranges are valid

### Pagination Issues

1. Verify cursor is from `nextCursor` field
2. Check that limit is between 1-100
3. Ensure database connection is stable

### Performance Issues

1. Verify database indexes exist
2. Consider implementing caching
3. Reduce limit for pagination
4. Check for N+1 query issues

---

## Related Documentation

- [Core Reports Documentation](./REPORTS_DOCUMENTATION.md)
- [Implementation Progress](./REPORTS_IMPLEMENTATION_PROGRESS.md)
- [Quick Reference](./REPORTS_QUICK_REFERENCE.md)
- [BullMQ Installation](./BULLMQ_INSTALLATION.md)
