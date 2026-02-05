# ShopFlow API Documentation

## Base URL

All API endpoints are prefixed with `/api`

**Example:** `https://your-domain.com/api/users`

---

## Table of Contents

1. [Users](#users)
2. [Shops](#shops)
3. [Shop Staff](#shop-staff)
4. [Roles](#roles)
5. [Items](#items)
6. [Transactions](#transactions)
7. [Transfers](#transfers)
8. [Customers](#customers)
9. [Sales](#sales)
10. [Sale Items](#sale-items)
11. [Customer Payments](#customer-payments)
12. [Expenses](#expenses)
13. [Shifts](#shifts)
14. [Stock Levels](#stock-levels)
15. [Stock Transactions](#stock-transactions)
16. [Stock Takes](#stock-takes)
17. [Item Availability](#item-availability)
18. [Suppliers](#suppliers)
19. [Shift Cash Movements](#shift-cash-movements)
20. [Shift Reconciliation](#shift-reconciliation)
21. [Sync](#sync)
22. [Outbox](#outbox)
23. [Deferred](#deferred)

---

## Authentication

This API uses Clerk for authentication. Include the authentication token in the request headers.

---

## Users

Base path: `/api/users`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all users |
| GET | `/clerk/:clerkId` | Get user by Clerk ID |
| GET | `/:id` | Get user by ID |
| POST | `/` | Create new user |
| PUT | `/:id` | Update user |
| DELETE | `/:id` | Delete user |
| POST | `/sync` | Sync changes |

---

## Shops

Base path: `/api/shops`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create shop |
| GET | `/` | List all shops |
| GET | `/main` | Get main shop |
| GET | `/:shopId` | Get shop by ID |
| PATCH | `/:shopId` | Update shop |

---

## Shop Staff

Base path: `/api/shop-staff`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Assign staff to shop |
| GET | `/shop/:shopId` | Get staff by shop |
| GET | `/:staffId` | Get assignment by ID |
| GET | `/user/:userId` | Get assignment by user ID |
| PATCH | `/:staffId/role` | Update staff role |
| DELETE | `/:staffId` | Remove staff |

---

## Roles

Base path: `/api/roles`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create role |
| GET | `/` | List all roles |
| GET | `/:roleId` | Get role by ID |
| PATCH | `/:roleId` | Update role |
| POST | `/:roleId/permissions` | Assign permissions |

---

## Items

Base path: `/api/items`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create item |
| GET | `/` | List all items |
| GET | `/:itemId` | Get item by ID |
| PATCH | `/:itemId` | Update item |

---

## Transactions

Base path: `/api/transactions`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Record transaction |
| GET | `/:transactionId` | Get transaction by ID |
| GET | `/item/:itemId` | Get transactions by item |
| GET | `/shop/:shopId` | Get transactions by shop |

---

## Transfers

Base path: `/api/transfers`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create transfer |
| GET | `/:transferId` | Get transfer by ID |
| PATCH | `/:transferId/status` | Update transfer status |
| GET | `/shop/:shopId` | Get transfers by shop |

---

## Customers

Base path: `/api/customers`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create customer |
| GET | `/` | List all customers |
| GET | `/:id` | Get customer by ID |
| PATCH | `/:id` | Update customer |
| DELETE | `/:id` | Delete customer |

---

## Sales

Base path: `/api/sales`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create sale |
| GET | `/summary` | Get sales summary |
| GET | `/:id` | Get sale by ID |
| PATCH | `/:id` | Update sale |
| DELETE | `/:id` | Delete sale |
| GET | `/shop/:shopId` | Get sales by shop |
| GET | `/customer/:customerId` | Get sales by customer |

---

## Sale Items

Base path: `/api/sale-items`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Add sale item |
| GET | `/:id` | Get sale item by ID |
| PATCH | `/:id` | Update sale item |
| DELETE | `/:id` | Delete sale item |
| GET | `/sale/:saleId` | Get items by sale |

---

## Customer Payments

Base path: `/api/customer-payments`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Record payment |
| GET | `/:id` | Get payment by ID |
| PATCH | `/:id` | Update payment |
| DELETE | `/:id` | Delete payment |
| GET | `/sale/:saleId` | Get payments by sale |
| GET | `/customer/:customerId` | Get payments by customer |

---

## Expenses

Base path: `/api/expenses`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create expense |
| GET | `/summary` | Get expense summary |
| GET | `/:id` | Get expense by ID |
| PATCH | `/:id` | Update expense |
| DELETE | `/:id` | Delete expense |
| GET | `/shop/:shopId` | Get expenses by shop |
| GET | `/shift/:shiftId` | Get expenses by shift |

---

## Shifts

Base path: `/api/shifts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/current` | Get current shift |
| POST | `/` | Create shift |
| GET | `/:id` | Get shift by ID |
| PATCH | `/:id` | Update shift |
| POST | `/:id/close` | Close shift |
| DELETE | `/:id` | Delete shift |
| GET | `/shop/:shopId` | Get shifts by shop |
| GET | `/shop/:shopId/active` | Get active shifts by shop |

---

## Stock Levels

Base path: `/api/stock/levels`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Set stock level |
| GET | `/:itemId/shop/:shopId` | Get stock level |
| PATCH | `/:itemId/shop/:shopId` | Update stock level |
| GET | `/shop/:shopId` | Get stock levels by shop |
| GET | `/item/:itemId` | Get stock levels by item |

---

## Stock Transactions

Base path: `/api/stock/transactions`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create transaction |
| GET | `/:id` | Get transaction by ID |
| GET | `/item/:itemId` | Get transactions by item |
| GET | `/shop/:shopId` | Get transactions by shop |
| GET | `/shift/:shiftId` | Get transactions by shift |

---

## Stock Takes

Base path: `/api/stock/takes`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create stock take |
| GET | `/:id` | Get stock take by ID |
| POST | `/:id/adjust` | Mark as adjusted |
| GET | `/shop/:shopId` | Get stock takes by shop |
| GET | `/shift/:shiftId` | Get stock takes by shift |
| GET | `/unadjusted` | Get unadjusted stock takes |

---

## Item Availability

Base path: `/api/availability`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Set availability |
| GET | `/:itemId/shop/:shopId` | Get availability |
| PATCH | `/:itemId/shop/:shopId` | Update availability |
| GET | `/shop/:shopId/unavailable` | Get unavailable items |

---

## Suppliers

Base path: `/api/suppliers`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create supplier |
| GET | `/` | List all suppliers |
| GET | `/:id` | Get supplier by ID |
| PATCH | `/:id` | Update supplier |
| DELETE | `/:id` | Delete supplier |

---

## Shift Cash Movements

Base path: `/api/shift-cash-movements`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create cash movement |
| GET | `/:id` | Get cash movement by ID |
| PATCH | `/:id` | Update cash movement |
| DELETE | `/:id` | Delete cash movement |
| GET | `/shift/:shiftId` | Get cash movements by shift |
| GET | `/type/:type` | Get cash movements by type |
| GET | `/payment-method/:paymentMethod` | Get cash movements by payment method |
| GET | `/shift/:shiftId/total/:movementType` | Get cash movement total |

---

## Shift Reconciliation

Base path: `/api/shift-reconciliation`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create reconciliation |
| GET | `/:id` | Get reconciliation by ID |
| PATCH | `/:id` | Update reconciliation |
| DELETE | `/:id` | Delete reconciliation |
| GET | `/shift/:shiftId` | Get reconciliation by shift |
| GET | `/pending/all` | Get pending reconciliations |
| PATCH | `/:id/status` | Update reconciliation status |
| POST | `/:id/reconcile` | Reconcile shift |

---

## Sync

Base path: `/api/sync`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Sync changes (legacy) |
| POST | `/pull` | Pull changes from server |
| POST | `/pull/:entity` | Pull changes by entity |

---

## Outbox

Base path: `/api/sync/outbox`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Add to outbox |
| GET | `/pending` | Get pending entries |
| DELETE | `/:id` | Delete entry |
| DELETE | `/entity/:entityName/:entityId` | Delete by entity |

---

## Deferred

Base path: `/api/sync/deferred`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Add deferred entry |
| GET | `/` | Get deferred entries |
| DELETE | `/:id` | Delete entry |
| DELETE | `/entity/:entityName/:entityId` | Delete by entity |

---

## Response Format

All responses follow a standard format:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

---

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

---

## Notes

- All timestamps are in ISO 8601 format
- IDs are UUID v4 format
- The API supports offline-first synchronization through the sync endpoints
- All monetary values are stored in the smallest currency unit (e.g., cents)
