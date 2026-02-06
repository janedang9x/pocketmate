
# API Design - PocketMate

## Overview

All API endpoints are built using Next.js API routes and follow RESTful conventions. They return JSON responses and require authentication (except for registration and login).

---

## Authentication

All authenticated endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `UNAUTHORIZED` - Missing or invalid authentication token
- `FORBIDDEN` - User doesn't have permission for this resource
- `NOT_FOUND` - Resource doesn't exist
- `VALIDATION_ERROR` - Input validation failed
- `DUPLICATE_ERROR` - Resource already exists (e.g., duplicate username)
- `FOREIGN_KEY_ERROR` - Cannot delete due to dependent records
- `SERVER_ERROR` - Internal server error

---

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "username": "string (required, 3-100 chars)",
  "password": "string (required, min 8 chars)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "createdAt": "timestamp"
    },
    "token": "jwt-token"
  },
  "message": "Account created successfully"
}
```

**Errors:**
- `400` - Validation error (weak password, invalid username)
- `409` - Username already exists

---

#### POST /api/auth/login

Authenticate user and return session token.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string"
    },
    "token": "jwt-token"
  },
  "message": "Login successful"
}
```

**Errors:**
- `401` - Invalid credentials

---

#### POST /api/auth/logout

End user session.

**Request:** No body required (uses token from header)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Financial Account Endpoints

#### GET /api/accounts

List all financial accounts for the authenticated user.

**Query Parameters:**
- `type` (optional): Filter by account type (Bank Account, Credit Card, E-wallet, Cash)
- `search` (optional): Search by account name

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "uuid",
        "name": "string",
        "type": "string",
        "currency": "string",
        "balance": "number",
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      }
    ]
  }
}
```

---

#### POST /api/accounts

Create a new financial account.

**Request Body:**
```json
{
  "name": "string (required, max 200 chars)",
  "type": "string (required: 'Bank Account' | 'Credit Card' | 'E-wallet' | 'Cash')",
  "currency": "string (required, e.g., 'VND', 'USD', 'EUR')",
  "openingBalance": "number (required)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "account": {
      "id": "uuid",
      "name": "string",
      "type": "string",
      "currency": "string",
      "balance": "number",
      "createdAt": "timestamp"
    }
  },
  "message": "Account created successfully"
}
```

**Errors:**
- `400` - Validation error

**Note:** Creates an initial transaction for the opening balance.

---

#### GET /api/accounts/[id]

Get details of a specific financial account.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "account": {
      "id": "uuid",
      "name": "string",
      "type": "string",
      "currency": "string",
      "balance": "number",
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "transactionCount": "number"
    }
  }
}
```

**Errors:**
- `404` - Account not found

---

#### PUT /api/accounts/[id]

Update an existing financial account.

**Request Body:**
```json
{
  "name": "string (optional, max 200 chars)",
  "type": "string (optional)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "account": { ... }
  },
  "message": "Account updated successfully"
}
```

**Errors:**
- `400` - Validation error or attempt to change currency/opening balance with existing transactions
- `404` - Account not found

---

#### DELETE /api/accounts/[id]

Delete a financial account.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Errors:**
- `400` - Cannot delete account with existing transactions
- `404` - Account not found

---

### Transaction Endpoints

#### GET /api/transactions

List transactions with filtering and pagination.

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Items per page
- `type` (optional): Filter by type (Expense, Income, Transfer, Borrow)
- `accountId` (optional): Filter by account
- `categoryId` (optional): Filter by category
- `startDate` (optional): Filter transactions from this date
- `endDate` (optional): Filter transactions to this date
- `search` (optional): Search in transaction details

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "type": "string",
        "amount": "number",
        "currency": "string",
        "dateTime": "timestamp",
        "details": "string",
        "fromAccount": { "id": "uuid", "name": "string" },
        "toAccount": { "id": "uuid", "name": "string" },
        "category": { "id": "uuid", "name": "string" },
        "counterparty": { "id": "uuid", "name": "string" },
        "paymentMethod": "string"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2
    }
  }
}
```

---

#### POST /api/transactions

Create a new transaction.

**Request Body (Expense):**
```json
{
  "type": "Expense",
  "fromAccountId": "uuid (required)",
  "amount": "number (required, positive)",
  "currency": "string (required)",
  "expenseCategoryId": "uuid (required)",
  "counterpartyId": "uuid (optional)",
  "paymentMethod": "string (optional: 'Cash' | 'Credit card' | 'Installment')",
  "dateTime": "timestamp (required)",
  "details": "string (optional)"
}
```

**Request Body (Income):**
```json
{
  "type": "Income",
  "toAccountId": "uuid (required)",
  "amount": "number (required, positive)",
  "currency": "string (required)",
  "incomeCategoryId": "uuid (required)",
  "counterpartyId": "uuid (optional)",
  "dateTime": "timestamp (required)",
  "details": "string (optional)"
}
```

**Request Body (Transfer):**
```json
{
  "type": "Transfer",
  "fromAccountId": "uuid (required)",
  "toAccountId": "uuid (required)",
  "amount": "number (required, positive)",
  "currency": "string (required)",
  "vndExchange": "number (optional, for different currency transfers)",
  "dateTime": "timestamp (required)",
  "details": "string (optional)"
}
```

**Request Body (Borrow):**
```json
{
  "type": "Borrow",
  "fromAccountId": "uuid (optional, if lending)",
  "toAccountId": "uuid (optional, if borrowing)",
  "amount": "number (required, positive)",
  "currency": "string (required)",
  "counterpartyId": "uuid (required)",
  "dateTime": "timestamp (required)",
  "details": "string (optional)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "transaction": { ... }
  },
  "message": "Transaction created successfully"
}
```

**Errors:**
- `400` - Validation error
- `404` - Account or category not found

---

#### GET /api/transactions/[id]

Get details of a specific transaction.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "transaction": { ... }
  }
}
```

**Errors:**
- `404` - Transaction not found

---

#### PUT /api/transactions/[id]

Update an existing transaction.

**Request Body:**
Same as POST but all fields optional except what you want to update.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "transaction": { ... }
  },
  "message": "Transaction updated successfully"
}
```

**Errors:**
- `400` - Validation error or cannot change transaction type
- `404` - Transaction not found

**Note:** Account balances are automatically recalculated.

---

#### DELETE /api/transactions/[id]

Delete a transaction.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

**Errors:**
- `404` - Transaction not found

**Note:** Account balances are automatically adjusted.

---

### Category Endpoints

#### GET /api/categories/expense

List all expense categories (default + user custom).

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "string",
        "parentCategoryId": "uuid | null",
        "isDefault": "boolean",
        "children": [
          {
            "id": "uuid",
            "name": "string",
            "isDefault": "boolean"
          }
        ]
      }
    ]
  }
}
```

---

#### POST /api/categories/expense

Create a custom expense category.

**Request Body:**
```json
{
  "name": "string (required, max 200 chars)",
  "parentCategoryId": "uuid (optional)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "category": { ... }
  },
  "message": "Category created successfully"
}
```

**Errors:**
- `400` - Validation error or duplicate name
- `404` - Parent category not found

---

#### PUT /api/categories/expense/[id]

Update an expense category.

**Request Body:**
```json
{
  "name": "string (optional)",
  "parentCategoryId": "uuid (optional)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "category": { ... }
  },
  "message": "Category updated successfully"
}
```

**Errors:**
- `400` - Validation error
- `403` - Cannot edit default categories
- `404` - Category not found

---

#### DELETE /api/categories/expense/[id]

Delete a custom expense category.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Errors:**
- `400` - Category has transactions or child categories
- `403` - Cannot delete default categories
- `404` - Category not found

---

#### GET /api/categories/income

List all income categories (default + user custom).

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "string",
        "isDefault": "boolean"
      }
    ]
  }
}
```

---

#### POST /api/categories/income

Create a custom income category.

**Request Body:**
```json
{
  "name": "string (required, max 200 chars)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "category": { ... }
  },
  "message": "Category created successfully"
}
```

---

#### PUT /api/categories/income/[id]

Update an income category.

**Request Body:**
```json
{
  "name": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "category": { ... }
  },
  "message": "Category updated successfully"
}
```

---

#### DELETE /api/categories/income/[id]

Delete a custom income category.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Errors:**
- `400` - Category has transactions
- `403` - Cannot delete default categories
- `404` - Category not found

---

### Counterparty Endpoints

#### GET /api/counterparties

List all counterparties.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "counterparties": [
      {
        "id": "uuid",
        "name": "string",
        "transactionCount": "number",
        "createdAt": "timestamp"
      }
    ]
  }
}
```

---

#### POST /api/counterparties

Create a new counterparty.

**Request Body:**
```json
{
  "name": "string (required, max 200 chars)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "counterparty": { ... }
  },
  "message": "Counterparty created successfully"
}
```

---

#### PUT /api/counterparties/[id]

Update a counterparty.

**Request Body:**
```json
{
  "name": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "counterparty": { ... }
  },
  "message": "Counterparty updated successfully"
}
```

---

#### DELETE /api/counterparties/[id]

Delete a counterparty.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Counterparty deleted successfully"
}
```

**Errors:**
- `400` - Counterparty has transactions
- `404` - Counterparty not found

---

### Report Endpoints

#### GET /api/reports/expense

Get expense report with analytics.

**Query Parameters:**
- `startDate` (required): Start of date range
- `endDate` (required): End of date range
- `categoryIds` (optional): Comma-separated category IDs to filter
- `groupBy` (optional, default: 'month'): 'day' | 'week' | 'month' | 'year'

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalExpense": "number",
      "transactionCount": "number",
      "averageExpense": "number"
    },
    "byCategory": [
      {
        "categoryId": "uuid",
        "categoryName": "string",
        "amount": "number",
        "percentage": "number",
        "transactionCount": "number"
      }
    ],
    "overtime": [
      {
        "period": "string (e.g., '2024-01')",
        "amount": "number",
        "transactionCount": "number"
      }
    ]
  }
}
```

---

#### GET /api/reports/income

Get income report with analytics.

**Query Parameters:**
- `startDate` (required)
- `endDate` (required)
- `categoryIds` (optional)
- `groupBy` (optional, default: 'month')

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalIncome": "number",
      "transactionCount": "number",
      "averageIncome": "number"
    },
    "byCategory": [ ... ],
    "overtime": [ ... ]
  }
}
```

---

#### GET /api/reports/comparison

Get expense vs income comparison report.

**Query Parameters:**
- `startDate` (required)
- `endDate` (required)
- `groupBy` (optional, default: 'month')

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalIncome": "number",
      "totalExpense": "number",
      "netSavings": "number",
      "savingsRate": "number (percentage)"
    },
    "overtime": [
      {
        "period": "string",
        "income": "number",
        "expense": "number",
        "net": "number"
      }
    ]
  }
}
```

---

#### GET /api/reports/statement

Get financial statement (current position).

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "assets": {
      "accounts": [
        {
          "id": "uuid",
          "name": "string",
          "type": "string",
          "balance": "number",
          "currency": "string"
        }
      ],
      "totalAssets": "number"
    },
    "liabilities": {
      "borrowedFrom": [
        {
          "counterpartyId": "uuid",
          "counterpartyName": "string",
          "amount": "number"
        }
      ],
      "lentTo": [
        {
          "counterpartyId": "uuid",
          "counterpartyName": "string",
          "amount": "number"
        }
      ],
      "totalLiabilities": "number"
    },
    "netWorth": "number"
  }
}
```

---

## Implementation Notes

### Authentication Middleware

All protected routes should use authentication middleware:

```typescript
// middleware.ts or in route handlers
import { NextRequest } from 'next/server';

export async function authenticateRequest(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('UNAUTHORIZED');
  }
  
  // Verify token with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('UNAUTHORIZED');
  }
  
  return user;
}
```

### Error Handling

Standardized error handler:

```typescript
export function handleApiError(error: any) {
  console.error('API Error:', error);
  
  if (error.message === 'UNAUTHORIZED') {
    return NextResponse.json(
      { success: false, error: 'Authentication required', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }
  
  if (error.code === '23505') { // PostgreSQL unique violation
    return NextResponse.json(
      { success: false, error: 'Resource already exists', code: 'DUPLICATE_ERROR' },
      { status: 409 }
    );
  }
  
  // ... more error handling
  
  return NextResponse.json(
    { success: false, error: 'Internal server error', code: 'SERVER_ERROR' },
    { status: 500 }
  );
}
```

### Validation

Use Zod schemas for request validation:

```typescript
import { z } from 'zod';

const createAccountSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['Bank Account', 'Credit Card', 'E-wallet', 'Cash']),
  currency: z.string().length(3),
  openingBalance: z.number()
});

// In route handler
const body = await req.json();
const validatedData = createAccountSchema.parse(body);
```
