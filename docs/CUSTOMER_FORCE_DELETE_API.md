# Customer Force Delete API

## Overview

The force-delete endpoint permanently removes a customer and **all associated data** from the database in a single atomic transaction. It is an irreversible, destructive operation restricted exclusively to the `SUPER_ADMIN` role. A name-confirmation step is required to prevent accidental deletion.

---

## Endpoint

```
DELETE /customers/:id/force
```

### Authorization

| Requirement | Value |
|---|---|
| Authentication | Bearer JWT |
| Role | `SUPER_ADMIN` only |

---

## Request

### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | `string (UUID)` | Yes | Unique identifier of the customer to delete |

### Request Body

```json
{
  "confirmName": "John Doe"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `confirmName` | `string` | Yes | Full name of the customer exactly as stored (`firstName lastName`, or `firstName` if no last name). The request is rejected if this does not match. |

---

## Cascade Deletion Order

The operation runs inside a single Prisma transaction. Records are deleted in strict dependency order to satisfy all foreign-key constraints:

| Order | Model | Condition |
|---|---|---|
| 1 | `PackageDelivery` | `customerId = :id` |
| 2 | `Payment` | `customerId = :id` *(cascades implicit Payment↔Invoice join table)* |
| 3 | `Notification` | `customerId = :id` |
| 4 | `Invoice` | `customerId = :id` |
| 5 | `PackageItem` | `customerId = :id` *(cascades `PackageItemPhoto` rows)* |
| 6 | `Package` | `customerId = :id` *(cascades `PackagePhoto` rows)* |
| 7 | `Customer` | `id = :id` |

If any step fails the entire transaction is rolled back and the customer record remains intact.

---

## Responses

### 200 OK — Deletion successful

```json
{
  "deleted": true,
  "summary": {
    "packageDeliveries": 3,
    "payments": 5,
    "notifications": 12,
    "invoices": 4,
    "packageItems": 8,
    "packages": 4
  }
}
```

The `summary` object shows the number of rows deleted for each dependant model.

### 400 Bad Request — Confirmation name mismatch

```json
{
  "statusCode": 400,
  "message": "Confirmation name does not match. Expected: \"John Doe\"",
  "error": "Bad Request"
}
```

### 403 Forbidden — Insufficient role

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 404 Not Found — Customer does not exist

```json
{
  "statusCode": 404,
  "message": "Customer not found",
  "error": "Not Found"
}
```

---

## Audit Log

A `FORCE_DELETE` audit log entry is created after the transaction completes successfully:

```json
{
  "action": "FORCE_DELETE",
  "entity": "Customer",
  "entityId": "<customer id>",
  "before": { "<full customer snapshot>" },
  "metadata": {
    "customerCode": "JOHN-12345",
    "confirmedName": "John Doe",
    "deletedRecords": {
      "packageDeliveries": 3,
      "payments": 5,
      "notifications": 12,
      "invoices": 4,
      "packageItems": 8,
      "packages": 4
    }
  }
}
```

---

## Example cURL

```bash
curl -X DELETE "https://api.example.com/customers/550e8400-e29b-41d4-a716-446655440000/force" \
  -H "Authorization: Bearer <super_admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"confirmName": "John Doe"}'
```

---

## Important Notes

- **Irreversible** — there is no undo. All deleted data is permanently gone from the database.
- **Confirmation required** — the `confirmName` must match `firstName + " " + lastName` (or just `firstName` when the customer has no last name) exactly, including letter casing.
- The soft-delete (`DELETE /customers/:id`) should be preferred for customers with financial history, as it only deactivates the account while preserving records. Use force-delete only when a full data purge is genuinely required (e.g., GDPR data erasure requests).
