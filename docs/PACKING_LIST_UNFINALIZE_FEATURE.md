# Packing List Unfinalize Feature

## Overview

Added ability to unfinalize packing lists (SUPER_ADMIN only) and modified finalization to support selective invoice generation for packages without existing invoices.

## Use Case

When a packing list has been finalized but additional packages need to be added:

1. SUPER_ADMIN can unfinalize the packing list
2. Operations clerk adds new packages
3. Re-finalize the packing list
4. **Only packages without existing invoices get new invoices generated**
5. **Only new invoices trigger notifications**

## API Endpoints

### POST /packing-lists/:id/unfinalize

**Authorization:** SUPER_ADMIN only

**Description:** Sets packing list status back to DRAFT without modifying or deleting existing invoices.

**Request:**

```
POST /packing-lists/123e4567-e89b-12d3-a456-426614174000/unfinalize
```

**Response:**

```json
{
  "packingList": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "PL-2024-001",
    "status": "DRAFT",
    "container": { ... },
    "packages": [ ... ],
    "invoices": [ ... ]  // Existing invoices remain unchanged
  },
  "message": "Packing list unfinalized successfully. Can now add more packages."
}
```

**Validation:**

- Packing list must exist
- Status must be FINALIZED
- Returns 400 if not finalized

**What it does:**

- Changes status from FINALIZED → DRAFT
- Does NOT delete invoices
- Does NOT send notifications
- Creates audit log entry
- Allows adding more packages

---

### POST /packing-lists/:id/finalize (Modified)

**Authorization:** OPERATIONS_CLERK, SUPER_ADMIN

**Description:** Finalizes packing list and generates invoices ONLY for packages without existing invoices.

**Response:**

```json
{
  "packingList": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "PL-2024-001",
    "status": "FINALIZED",
    ...
  },
  "invoices": [ ... ],  // Only newly generated invoices
  "message": "Packing list finalized successfully. 3 new invoice(s) generated.",
  "stats": {
    "newInvoiceCount": 3,
    "totalPackageCount": 10,
    "packagesWithoutInvoices": 3,
    "existingInvoiceCount": 7
  }
}
```

**Behavior Changes:**

- **Before:** Always generated invoices for all packages, threw error if invoices already exist
- **After:**
  - Checks for existing invoices by packageId
  - Filters out packages that already have invoices
  - Only generates invoices for packages without invoices
  - Only sends notifications for newly generated invoices
  - Returns stats showing what was done

**Validation:**

- Still validates all packages have valid shipping rates
- Only validates packages that don't have invoices yet

---

## Implementation Details

### Database Queries

The finalize method now:

1. Queries existing invoices for the packing list:

```typescript
const existingInvoices = await this.prisma.invoice.findMany({
  where: { packingListId: id },
  select: { packageId: true },
});
```

2. Filters packages without invoices:

```typescript
const packageIdsWithInvoices = new Set(
  existingInvoices.map((inv) => inv.packageId),
);

const packagesWithoutInvoices = packingList.packages.filter(
  (pkg) => !packageIdsWithInvoices.has(pkg.id),
);
```

3. Only generates invoices if there are packages without invoices

### Audit Logging

Both operations create detailed audit log entries:

**Unfinalize:**

```json
{
  "action": "UPDATE",
  "entity": "PackingList",
  "metadata": {
    "action": "UNFINALIZED",
    "existingInvoiceCount": 7
  }
}
```

**Finalize:**

```json
{
  "action": "FINALIZE",
  "entity": "PackingList",
  "metadata": {
    "newInvoiceCount": 3,
    "totalInvoiceCount": 3,
    "packageCount": 10,
    "packagesWithoutInvoices": 3,
    "existingInvoiceCount": 7
  }
}
```

---

## Workflow Example

### Scenario: Adding packages to a finalized packing list

**Initial State:**

- Packing list PL-2024-001 is FINALIZED
- Has 7 packages with 7 invoices
- Need to add 3 more packages

**Step 1: Unfinalize** (SUPER_ADMIN)

```bash
curl -X POST /packing-lists/abc123/unfinalize \
  -H "Authorization: Bearer <super_admin_token>"
```

Result:

- Status: DRAFT
- Existing 7 invoices remain intact
- Can now add packages

**Step 2: Add Packages** (OPERATIONS_CLERK)

```bash
curl -X POST /packing-lists/abc123/packages \
  -H "Authorization: Bearer <token>" \
  -d '{"packageIds": "pkg1,pkg2,pkg3"}'
```

Result:

- 3 new packages added
- Total packages: 10
- Total invoices: 7 (unchanged)

**Step 3: Re-finalize** (OPERATIONS_CLERK)

```bash
curl -X POST /packing-lists/abc123/finalize \
  -H "Authorization: Bearer <token>"
```

Result:

- Status: FINALIZED
- 3 NEW invoices generated (only for new packages)
- Notifications sent ONLY for 3 new invoices
- Total invoices: 10

---

## Files Modified

### Controller

`src/modules/packing-lists/packing-lists.controller.ts`

- Added `POST :id/unfinalize` endpoint with SUPER_ADMIN role

### Service

`src/modules/packing-lists/packing-lists.service.ts`

- Added `unfinalize(id, userId)` method
- Modified `finalize(id, userId)` to:
  - Query existing invoices
  - Filter packages without invoices
  - Only generate invoices for filtered packages
  - Return enhanced stats

---

## Security Considerations

### Role-Based Access Control

- **Unfinalize:** SUPER_ADMIN only (highest privilege)
- **Finalize:** OPERATIONS_CLERK or SUPER_ADMIN
- **Add Packages:** OPERATIONS_CLERK or SUPER_ADMIN

### Data Integrity

- Existing invoices are NEVER modified or deleted
- Customers who already received invoices won't get duplicate notifications
- Audit trail maintained for all operations

---

## Testing Checklist

- [ ] Unfinalize a FINALIZED packing list (SUPER_ADMIN)
- [ ] Try to unfinalize with OPERATIONS_CLERK role (should fail)
- [ ] Try to unfinalize a DRAFT packing list (should fail with 400)
- [ ] Add packages to unfinalized packing list
- [ ] Re-finalize and verify only new packages get invoices
- [ ] Verify notifications only sent for new invoices
- [ ] Check audit logs for both operations
- [ ] Verify existing invoice PDFs remain accessible
- [ ] Test with packing list that has no packages without invoices
- [ ] Verify stats in response are accurate

---

## Notes

- This feature is designed for administrative corrections, not regular workflow
- SUPER_ADMIN restriction on unfinalize prevents abuse
- No data loss - all existing invoices are preserved
- Customers receive invoices only once per package
- Audit trail provides full history of finalization/unfinalization
