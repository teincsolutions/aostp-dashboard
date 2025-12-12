# Reports API Documentation

## Overview

The Reports module provides comprehensive analytics and reporting endpoints for the AOSTP system. All endpoints are optimized using Prisma aggregations and support flexible filtering by date range, warehouse, shipping mode, and customer.

## Authentication

All endpoints require:

- Bearer token authentication
- Appropriate role permissions (SUPER_ADMIN, FINANCE_MANAGER, or OPERATIONS_CLERK)

## Base URL

```
/reports
```

## Common Query Parameters

All report endpoints support these optional filters:

| Parameter      | Type              | Description                              | Example                                |
| -------------- | ----------------- | ---------------------------------------- | -------------------------------------- |
| `fromDate`     | string (ISO 8601) | Filter by start date                     | `2025-01-01T00:00:00Z`                 |
| `toDate`       | string (ISO 8601) | Filter by end date                       | `2025-12-31T23:59:59Z`                 |
| `warehouseId`  | UUID              | Filter by warehouse                      | `123e4567-e89b-12d3-a456-426614174000` |
| `shippingMode` | enum              | Filter by shipping mode (`SEA` or `AIR`) | `SEA`                                  |
| `customerId`   | UUID              | Filter by customer                       | `123e4567-e89b-12d3-a456-426614174000` |

---

## Endpoints

### 1. Payments Report

**Endpoint:** `GET /reports/payments`

**Description:** Returns a comprehensive list of all payments across warehouses with currency-based aggregations and conversion to local currency.

**Permissions:** SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK

**Filters Supported:**

- fromDate
- toDate
- warehouseId
- customerId

**Response Schema:**

```json
{
  "payments": [
    {
      "paymentCode": "PAY-2025-001",
      "customerCode": "CUST-001",
      "customerName": "John Doe",
      "amount": 1500.0,
      "localAmount": 15000.0,
      "currency": "USD",
      "paymentMethod": "MOBILE_MONEY",
      "processedAt": "2025-01-15T10:30:00Z",
      "warehouse": "China Main",
      "processedBy": "admin@willfind8.com"
    }
  ],
  "totals": {
    "usdTotal": 25000.0,
    "ghsTotal": 250000.0,
    "otherCurrencies": [
      {
        "currency": "EUR",
        "total": 5000.0
      }
    ]
  },
  "totalCount": 150
}
```

**Aggregation Logic:**

- Groups payments by currency using Prisma `groupBy`
- Sums `amount` and `localAmount` fields
- Converts amounts using `ExchangeRate` relation
- Orders by `processedAt` descending

**Performance Notes:**

- Uses indexed fields (`customerId`, `processedAt`)
- Selective field projection to minimize data transfer
- Efficient grouping with database-level aggregation

---

### 2. Packing List Report

**Endpoint:** `GET /reports/packing-lists`

**Description:** Provides detailed statistics about invoices within packing lists, including payment status breakdowns and shipping metrics.

**Permissions:** SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK

**Filters Supported:**

- fromDate (applied to loadingDate)
- toDate (applied to loadingDate)
- warehouseId

**Response Schema:**

```json
{
  "totalInvoices": 100,
  "paid": 60,
  "unpaid": 30,
  "partial": 10,
  "paidPercentage": 60.0,
  "unpaidPercentage": 30.0,
  "partialPercentage": 10.0,
  "totalShippingCost": 25000.0,
  "totalCBM": 250.5,
  "totalWeight": 7500.0,
  "packingLists": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "PL-2025-001",
      "containerNumber": "CONT-2025-001",
      "totalPackages": 50,
      "totalCustomers": 25,
      "totalWeight": 1500.5,
      "totalCBM": 45.25,
      "totalShippingCost": 5000.0,
      "invoiceStats": {
        "total": 50,
        "paid": 30,
        "unpaid": 15,
        "partial": 5,
        "paidPercentage": 60.0,
        "unpaidPercentage": 30.0,
        "partialPercentage": 10.0
      },
      "loadingDate": "2025-01-01T00:00:00Z",
      "eta": "2025-02-15T00:00:00Z"
    }
  ]
}
```

**Aggregation Logic:**

- Fetches packing lists with related invoices
- Computes invoice status counts (PAID, UNPAID, PARTIALLY_PAID)
- Calculates percentages for each status
- Aggregates shipping metrics (cost, CBM, weight)
- Orders by `loadingDate` descending

**Key Metrics:**

- **Total Invoices:** Count of all invoices across packing lists
- **Paid/Unpaid/Partial:** Breakdown by invoice status
- **Percentages:** Ratio of each status to total
- **Shipping Metrics:** Sum of costs, volumes, and weights

---

### 3. Customer League Report

**Endpoint:** `GET /reports/customer-league`

**Description:** Ranks top customers across multiple dimensions: invoice totals, payment totals, CBM, and weight.

**Permissions:** SUPER_ADMIN, FINANCE_MANAGER

**Filters Supported:**

- fromDate
- toDate
- warehouseId
- customerId

**Response Schema:**

```json
{
  "topByInvoices": [
    {
      "customerCode": "CUST-001",
      "customerName": "John Doe",
      "value": 15000.0,
      "rank": 1
    }
  ],
  "topByPayments": [
    {
      "customerCode": "CUST-002",
      "customerName": "Jane Smith",
      "value": 14500.0,
      "rank": 1
    }
  ],
  "topByCbm": [
    {
      "customerCode": "CUST-003",
      "customerName": "Bob Johnson",
      "value": 125.5,
      "rank": 1
    }
  ],
  "topByWeight": [
    {
      "customerCode": "CUST-004",
      "customerName": "Alice Brown",
      "value": 3500.0,
      "rank": 1
    }
  ]
}
```

**Aggregation Logic:**

- **Top by Invoices:** Groups invoices by `customerId`, sums `totalAmount`, orders descending, takes top 10
- **Top by Payments:** Groups payments by `customerId`, sums `amount`, orders descending, takes top 10
- **Top by CBM:** Groups packages by `customerId`, sums `cbm`, orders descending, takes top 10
- **Top by Weight:** Groups packages by `customerId`, sums `weight`, orders descending, takes top 10

**Use Cases:**

- Identify high-value customers
- Reward programs
- VIP customer management
- Sales performance analysis

---

### 4. Shipping Method Report

**Endpoint:** `GET /reports/shipping-method`

**Description:** Analyzes revenue, customer distribution, and outstanding invoices by shipping method (AIR vs SEA).

**Permissions:** SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK

**Filters Supported:**

- fromDate
- toDate
- warehouseId

**Response Schema:**

```json
{
  "shippingMethods": [
    {
      "mode": "SEA",
      "revenue": 50000.0,
      "invoiceCount": 75,
      "outstandingCount": 20,
      "customerCount": 45,
      "topCustomers": [
        {
          "customerCode": "CUST-001",
          "customerName": "John Doe",
          "revenue": 12000.0,
          "invoiceCount": 15
        }
      ]
    },
    {
      "mode": "AIR",
      "revenue": 35000.0,
      "invoiceCount": 50,
      "outstandingCount": 15,
      "customerCount": 30,
      "topCustomers": [
        {
          "customerCode": "CUST-002",
          "customerName": "Jane Smith",
          "revenue": 8000.0,
          "invoiceCount": 10
        }
      ]
    }
  ]
}
```

**Aggregation Logic:**

- Iterates through shipping modes (SEA, AIR)
- For each mode:
  - Fetches packages with `shippingMode` filter
  - Sums invoice `totalAmount` for revenue
  - Counts invoices
  - Counts outstanding (UNPAID + PARTIALLY_PAID)
  - Counts unique customers using Set
  - Ranks customers by revenue, takes top 10

**Key Metrics:**

- **Revenue:** Total invoice amounts per shipping mode
- **Invoice Count:** Number of invoices per mode
- **Outstanding Count:** Unpaid/partially paid invoices
- **Customer Count:** Unique customers using each mode
- **Top Customers:** Highest revenue per mode

---

### 5. General Report

**Endpoint:** `GET /reports/general`

**Description:** Comprehensive customer analytics including pickup rates, shipping preferences, payment behavior, and transaction history.

**Permissions:** SUPER_ADMIN, FINANCE_MANAGER

**Filters Supported:**

- fromDate
- toDate
- warehouseId
- customerId

**Response Schema:**

```json
{
  "topCustomers": [
    {
      "customerCode": "CUST-001",
      "customerName": "John Doe",
      "totalInvoices": 25,
      "totalInvoiceAmount": 50000.0,
      "totalPayments": 30,
      "totalPaymentAmount": 48000.0,
      "pickupRate": 0.92,
      "shippingModesUsed": ["SEA", "AIR"],
      "firstDate": "2024-01-15T00:00:00Z",
      "lastDate": "2025-11-20T00:00:00Z"
    }
  ],
  "totalCustomers": 50
}
```

**Aggregation Logic:**

- Fetches customers with nested invoices, payments, and packages
- For each customer:
  - Counts and sums invoice data
  - Counts and sums payment data
  - Computes pickup rate: `deliveredPackages / totalPackages`
  - Extracts unique shipping modes using Set
  - Finds first and last transaction dates across all entities
- Sorts by `totalInvoiceAmount` descending
- Takes top 50 customers

**Pickup Rate Formula:**

```
pickupRate = (packages with status RELEASED) / (total packages)
```

**Use Cases:**

- Customer profiling
- Delivery performance tracking
- Customer lifetime value analysis
- Retention strategies

---

### 6. Pickup Report

**Endpoint:** `GET /reports/pickups`

**Description:** Detailed records of package deliveries including customer info, invoice details, and delivery status.

**Permissions:** SUPER_ADMIN, FINANCE_MANAGER, OPERATIONS_CLERK

**Filters Supported:**

- fromDate (applied to releaseDate)
- toDate (applied to releaseDate)
- customerId

**Response Schema:**

```json
{
  "pickups": [
    {
      "customerCode": "CUST-001",
      "customerName": "John Doe",
      "invoiceNumber": "INV-2025-001",
      "pickupCode": "PKP-2025-001",
      "pickupDate": "2025-01-15T10:30:00Z",
      "quantity": 3,
      "warehouse": "Accra Branch",
      "status": "RELEASED",
      "trackingCode": "TRK-2025-001",
      "description": "Electronics",
      "deliveryId": "DEL-2025-001",
      "receiverName": "Jane Doe",
      "notes": "Delivered in good condition"
    }
  ],
  "totalCount": 75
}
```

**Aggregation Logic:**

- Fetches `PackageDelivery` records with joins:
  - Customer (for code and name)
  - Invoice (for invoice number)
  - Package (for tracking, pickup code, description, status)
  - Warehouse (through customer relation)
- Orders by `releaseDate` descending

**Key Fields:**

- **Pickup Code:** Unique identifier for delivery
- **Delivery ID:** Auto-generated delivery ID
- **Receiver Name:** Person who received package (optional)
- **Status:** Current package status
- **Notes:** Delivery notes

---

### 7. Warehouse Report

**Endpoint:** `GET /reports/warehouses`

**Description:** Aggregates statistics by warehouse including packages, customers, volume/weight metrics, and financial data.

**Permissions:** SUPER_ADMIN, FINANCE_MANAGER

**Filters Supported:**

- fromDate
- toDate
- warehouseId

**Response Schema:**

```json
{
  "warehouses": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "China Main",
      "totalPackages": 250,
      "totalCustomers": 75,
      "totalWeight": 5000.0,
      "totalCBM": 150.5,
      "outstandingInvoices": 30,
      "outstandingAmount": 25000.0,
      "packingLists": [
        {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "name": "PL-2025-001",
          "totalPackages": 50
        }
      ]
    }
  ],
  "totalPackages": 1000,
  "totalCustomers": 300,
  "totalWeight": 20000.0,
  "totalCBM": 600.5
}
```

**Aggregation Logic:**

- Fetches active warehouses
- For each warehouse:
  - Counts packages with date filters
  - Counts unique customers using Set
  - Sums weight and CBM from packages
  - Counts outstanding invoices (UNPAID + PARTIALLY_PAID)
  - Sums outstanding balance amounts
  - Lists associated packing lists with package counts
- Computes overall totals across all warehouses

**Key Metrics:**

- **Total Packages:** Count per warehouse
- **Total Customers:** Unique customer count
- **Total Weight/CBM:** Volume metrics
- **Outstanding Invoices:** Count and amount
- **Packing Lists:** Associated packing list summary

**Use Cases:**

- Warehouse capacity planning
- Performance comparison
- Financial tracking per location
- Operational efficiency analysis

---

## Error Responses

All endpoints may return these standard error responses:

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
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

## Performance Considerations

### Optimization Techniques

1. **Prisma Aggregations:**
   - All reports use `groupBy` and `aggregate` at database level
   - Minimizes data transfer and processing in application layer

2. **Selective Field Projection:**
   - Only required fields are selected using `select` clauses
   - Reduces payload size and query execution time

3. **Indexed Queries:**
   - Filters use indexed columns (`customerId`, `warehouseId`, `createdAt`, `status`)
   - Ensures fast query execution even with large datasets

4. **Efficient Joins:**
   - Related data fetched in single query using Prisma relations
   - Avoids N+1 query problems

### Caching Strategy (Optional)

For heavy reports with large datasets, consider implementing:

```typescript
// Example Redis caching
const cacheKey = `report:payments:${JSON.stringify(query)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await this.reportsService.getPaymentsReport(query);
await redis.setex(cacheKey, 3600, JSON.stringify(result)); // 1 hour cache
return result;
```

### BullMQ Queue Integration (Optional)

For extremely large reports, offload to background processing:

```typescript
// Enqueue report generation
const job = await this.reportsQueue.add('generate-report', {
  reportType: 'payments',
  filters: query,
  userId: user.id,
});

// Return job ID for status tracking
return { jobId: job.id, status: 'PROCESSING' };
```

---

## Usage Examples

### Example 1: Get payments for January 2025

```bash
curl -X GET "https://api.example.com/reports/payments?fromDate=2025-01-01T00:00:00Z&toDate=2025-01-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 2: Get customer league for specific warehouse

```bash
curl -X GET "https://api.example.com/reports/customer-league?warehouseId=123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 3: Get shipping method report for SEA mode

```bash
curl -X GET "https://api.example.com/reports/shipping-method?shippingMode=SEA&fromDate=2025-01-01T00:00:00Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 4: Get pickups for specific customer

```bash
curl -X GET "https://api.example.com/reports/pickups?customerId=123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### Issue: Slow query performance

**Cause:** Large dataset without proper filtering

**Solution:**

- Always use date range filters for better performance
- Filter by warehouse or customer when possible
- Consider implementing pagination for extremely large results

### Issue: Empty results

**Cause:**

- Incorrect filter values
- No data matching criteria
- Date format issues

**Solution:**

- Verify filter values are correct UUIDs
- Use ISO 8601 date format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Check if data exists in database for given filters

### Issue: Permission denied

**Cause:** Insufficient role permissions

**Solution:**

- Ensure user has appropriate role (SUPER_ADMIN, FINANCE_MANAGER, or OPERATIONS_CLERK)
- Check JWT token is valid and not expired
- Verify role-based access control configuration

---

## Data Model Reference

### Key Relationships

```
Customer
  ├─ Invoices
  ├─ Payments
  ├─ Packages
  └─ Warehouse

Package
  ├─ Invoice
  ├─ PackingList
  ├─ Customer
  ├─ Warehouse
  └─ PackageDelivery

Invoice
  ├─ Customer
  ├─ Package
  ├─ PackingList
  └─ Payments

Payment
  ├─ Customer
  ├─ ExchangeRate
  └─ Invoices

PackingList
  ├─ Container
  ├─ Warehouse
  ├─ Packages
  └─ Invoices

PackageDelivery
  ├─ Customer
  ├─ Invoice
  └─ Package
```

### Status Enums

**InvoiceStatus:**

- `PAID`
- `UNPAID`
- `PARTIALLY_PAID`

**PackageStatus:**

- `RECEIVED`
- `ASSIGNED`
- `SHIPPED`
- `ARRIVED`
- `RELEASED`

**ShippingMode:**

- `SEA`
- `AIR`

---

## Future Enhancements

### Planned Features

1. **Export Functionality:**
   - CSV/Excel export for all reports
   - PDF generation for printable reports

2. **Scheduled Reports:**
   - Daily/weekly/monthly automated reports
   - Email delivery to stakeholders

3. **Advanced Analytics:**
   - Trend analysis over time
   - Predictive analytics for revenue forecasting
   - Customer churn prediction

4. **Custom Report Builder:**
   - User-defined metrics
   - Custom aggregations
   - Saved report configurations

5. **Real-time Dashboards:**
   - Live data updates via WebSocket
   - Interactive charts and graphs
   - Drill-down capabilities

---

## Support

For issues or questions regarding the Reports API:

- **Technical Support:** dev@willfind8.com
- **Documentation Updates:** Submit PR to repository
- **Feature Requests:** Create issue in project tracker

---

## Changelog

### Version 1.0.0 (2025-12-11)

Initial release with 7 core reports:

- Payments Report
- Packing List Report
- Customer League Report
- Shipping Method Report
- General Report
- Pickup Report
- Warehouse Report

Features:

- Flexible filtering by date, warehouse, customer, shipping mode
- Optimized Prisma aggregations
- Role-based access control
- Comprehensive Swagger documentation
