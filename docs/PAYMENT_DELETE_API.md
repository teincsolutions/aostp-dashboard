# Payment Deletion API

## Overview

This document describes the payment deletion endpoint that allows Super Admin users to permanently delete payment records from the system.

## Endpoint

### Delete Payment

**URL:** `DELETE /payments/:id`

**Method:** `DELETE`

**Authentication:** Required (JWT Bearer Token)

**Authorization:** Super Admin only (`UserRole.SUPER_ADMIN`)

---

## Request

### Path Parameters

| Parameter | Type   | Required | Description                            |
| --------- | ------ | -------- | -------------------------------------- |
| `id`      | string | Yes      | The unique ID of the payment to delete |

### Headers

| Header          | Value            | Required | Description              |
| --------------- | ---------------- | -------- | ------------------------ |
| `Authorization` | `Bearer <token>` | Yes      | JWT authentication token |

### Example Request

```bash
curl -X DELETE https://api.example.com/payments/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Response

### Success Response (204 No Content)

Returns no content on successful deletion. The HTTP status code 204 indicates that the payment was successfully deleted.

**Status Code:** `204 No Content`

**Body:** Empty (no response body)

### Error Responses

#### 404 Not Found

Payment with the specified ID does not exist.

```json
{
  "statusCode": 404,
  "message": "Payment with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

#### 403 Forbidden

User does not have Super Admin role.

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

#### 401 Unauthorized

Missing or invalid authentication token.

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

---

## Behavior

### Permanent Deletion

- This endpoint performs a **hard delete** (permanent removal) of the payment record
- The payment record is completely removed from the database
- This action **cannot be undone**

### Audit Logging

- Before deletion, an audit log entry is created with:
  - `action`: "DELETE"
  - `entity`: "Payment"
  - `entityId`: The payment ID
  - `before`: Complete payment object before deletion
  - `after`: Empty object (as record is deleted)
  - `userId`: ID of the Super Admin who performed the deletion

### Related Records

- The deletion is handled within a database transaction
- Invoice relationships are removed (but invoices themselves are not deleted)
- Audit logs are preserved for accountability

---

## Security Considerations

1. **Super Admin Only**: Only users with `SUPER_ADMIN` role can access this endpoint
2. **Audit Trail**: All deletions are logged in the audit log for compliance
3. **JWT Authentication**: Valid authentication token required
4. **Transaction Safety**: Deletion is wrapped in a database transaction to ensure data consistency

---

## Use Cases

- **Correcting Errors**: Remove duplicate or erroneous payment entries
- **Data Cleanup**: Remove test or invalid payment records
- **Compliance**: Delete payment data as part of data retention policies (with proper authorization)

---

## Important Notes

⚠️ **WARNING**: This operation is irreversible. Once a payment is deleted, it cannot be recovered through the API.

✅ **Best Practice**: Always verify the payment details before deletion and ensure proper authorization

📝 **Audit**: All deletion actions are logged in the audit log table with full details of the deleted payment

---

## Related Endpoints

- `GET /payments/:id` - Retrieve payment details before deletion
- `GET /payments` - List all payments
- `PATCH /payments/:id` - Update payment details (alternative to deletion)
- `GET /payments/stats` - View payment statistics

---

## Example Integration

### TypeScript/JavaScript (Axios)

```typescript
import axios from 'axios';

async function deletePayment(paymentId: string, authToken: string) {
  try {
    const response = await axios.delete(
      `https://api.example.com/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    console.log('Payment deleted successfully (204 No Content)');
    return true;
  } catch (error) {
    if (error.response) {
      console.error('Delete failed:', error.response.data);
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}

// Usage
deletePayment('550e8400-e29b-41d4-a716-446655440000', 'your-jwt-token-here')
  .then(() => console.log('Deleted successfully'))
  .catch((error) => console.error('Error:', error.message));
```

### Python (Requests)

```python
import requests

def delete_payment(payment_id: str, auth_token: str):
    url = f"https://api.example.com/payments/{payment_id}"
    headers = {
        "Authorization": f"Bearer {auth_token}",
    }

    try:
        response = requests.delete(url, headers=headers)
        response.raise_for_status()

        print("Payment deleted successfully (204 No Content)")
        return True
    except requests.exceptions.HTTPError as error:
        print(f"Delete failed: {error.response.json()}")
        raise
    except Exception as error:
        print(f"Error: {str(error)}")
        raise

# Usage
try:
    delete_payment(
        "550e8400-e29b-41d4-a716-446655440000",
        "your-jwt-token-here"
    )
    print("Deleted successfully")
except Exception as e:
    print(f"Error: {str(e)}")
```

---

## Changelog

### Version 1.0.0 (2024-12-21)

- Initial implementation of payment deletion endpoint
- Added Super Admin role restriction
- Implemented audit logging for deletions
- Added transaction safety for data consistency
