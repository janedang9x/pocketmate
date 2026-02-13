# PocketMate - Development TODO

**Last Updated:** February 2026  
**Current Phase:** Phase 1 - Setup & Infrastructure

---

## ✅ Completed Tasks

### Sprint 1.1 (Project Setup & Configuration)

- Next.js 14+ app with TypeScript and App Router
- Folder structure: `/app`, `/components`, `/lib`, `/types`, `/supabase`
- ESLint and Prettier configured; `tsconfig.json` and path alias `@/*`
- `.env.local.example` and `.gitignore` in place; Git initialized
- Tailwind CSS 3.x + shadcn/ui (Button component); global styles and theme tokens

### Sprint 1.2 (Database Setup)

- Supabase client installed; `lib/supabase.ts` and env vars documented
- `supabase/schema.sql` (tables, indexes, triggers, RLS) and `supabase/seed.sql` (default categories) ready to run in Supabase
- `types/database.types.ts` created from schema

---

## 🔄 Phase 1: Setup & Infrastructure (Week 1)

### Sprint 1.1: Project Setup & Configuration

- [x] **Initialize Next.js Project**
  - [x] Create Next.js 14+ app with TypeScript
  - [x] Configure `next.config.js` for optimal settings
  - [x] Set up folder structure (`/app`, `/components`, `/lib`, `/types`)
  - [x] Install core dependencies: `npm install`
- [x] **Configure Development Tools**
  - [x] Set up ESLint and Prettier
  - [x] Configure TypeScript (`tsconfig.json`)
  - [x] Add `.env.local` for environment variables
  - [x] Create `.gitignore` and initialize Git
- [x] **Install UI Framework**
  - [x] Install Tailwind CSS
  - [x] Install shadcn/ui CLI
  - [x] Initialize shadcn/ui components
  - [x] Set up global styles and theme

### Sprint 1.2: Database Setup

- [x] **Supabase Configuration**
  - [x] Create Supabase project
  - [x] Get Supabase URL and anon key
  - [x] Add to `.env.local` file (template: `.env.local.example`)
  - [x] Install Supabase client: `npm install @supabase/supabase-js`
- [x] **Run Database Schema** (See `docs/database-schema.md`)
  - [x] Execute main schema SQL (tables, indexes, triggers) — scripts in `supabase/schema.sql`
  - [x] Execute RLS policies SQL — included in `supabase/schema.sql`
  - [x] Execute default categories seed data — script in `supabase/seed.sql`
  - [ ] Verify all tables created successfully (run scripts in Supabase SQL editor or CLI)
  - [ ] Test RLS policies are working

- [x] **Create Database Types**
  - [x] Generate TypeScript types from Supabase schema
  - [x] Create `/types/database.types.ts`
  - [x] Create helper types for common queries

### Sprint 1.3: Authentication Implementation

**Reference:** `docs/requirements.md` sections FR-AUTH-001, FR-AUTH-002, FR-AUTH-003

- [x] **Set up Supabase Auth**
  - [x] Configure Supabase Auth settings
  - [x] Create auth utility functions in `/lib/auth.ts`
  - [x] Create auth context provider
- [x] **Build Registration Flow** (FR-AUTH-001)
  - [x] Create `/app/auth/register/page.tsx`
  - [x] Build registration form with React Hook Form + Zod
  - [x] Implement username validation
  - [x] Implement password validation (min 8 chars)
  - [x] Create API route: `POST /api/auth/register`
  - [x] Handle successful registration → auto login
  - [x] Add error handling (duplicate username, etc.)
- [x] **Build Login Flow** (FR-AUTH-002)
  - [x] Create `/app/auth/login/page.tsx`
  - [x] Build login form with React Hook Form + Zod
  - [x] Create API route: `POST /api/auth/login`
  - [x] Implement session token creation
  - [x] Redirect to dashboard on success
  - [x] Handle invalid credentials errors
- [x] **Build Logout Flow** (FR-AUTH-003)
  - [x] Create logout function in auth utils
  - [x] Create API route: `POST /api/auth/logout`
  - [x] Add logout button to navbar/header
  - [x] Clear session and redirect to login

- [x] **Protected Routes Middleware**
  - [x] Create `/middleware.ts` for route protection
  - [x] Protect all routes except `/auth/*` and `/api/auth/*`
  - [x] Redirect unauthenticated users to login
  - [x] Create auth state management

### Sprint 1.4: Core Layout & Navigation

- [x] **Create Main Layout**
  - [x] Design and build main app layout
  - [x] Create sidebar/navbar navigation
  - [x] Add user info display in header
  - [x] Make responsive for mobile
- [x] **Create Dashboard Skeleton**
  - [x] Create `/app/dashboard/page.tsx`
  - [x] Add placeholder cards for summary stats
  - [x] Add "Quick Actions" section
  - [x] Add "Recent Transactions" placeholder

---

## 📋 Phase 2: Account Management (Week 2)

**Reference:** `docs/specification.md` sections FR-ACC-001 through FR-ACC-004
**API Reference:** `docs/api-design.md` Financial Account Endpoints

### Sprint 2.1: Account Data Layer & API

- [x] **Install TanStack Query**
  - [x] Run `npm install @tanstack/react-query`
  - [x] Set up QueryClient provider in root layout
  - [x] Create `/lib/queryClient.ts`

- [x] **Create Account Types & Schemas**
  - [x] Define Account interface in `/types/account.types.ts`
  - [x] Create Zod schemas in `/lib/schemas/account.schema.ts`
  - [x] Add account type constants (Bank Account, Credit Card, E-wallet, Cash)

- [x] **Build Account API Routes** (See `docs/api-design.md`)
  - [x] Create `GET /api/accounts` - List all accounts (FR-ACC-002)
  - [x] Create `POST /api/accounts` - Create account (FR-ACC-001)
  - [x] Create `GET /api/accounts/[id]` - Get account details (FR-ACC-002)
  - [x] Create `PUT /api/accounts/[id]` - Update account (FR-ACC-003)
  - [x] Create `DELETE /api/accounts/[id]` - Delete account (FR-ACC-004)
  - [x] Add validation for all endpoints
  - [x] Implement error handling
  - [ ] Test with Postman/Thunder Client

### Sprint 2.2: Account UI Components

- [x] **Create Shared Components**
  - [x] Install shadcn components: `npx shadcn-ui@latest add card button input select dialog alert`
  - [x] Create `AccountCard` component in `/components/accounts/AccountCard.tsx`
  - [x] Create `AccountTypeIcon` component for visual indicators
  - [x] Create `CurrencyDisplay` component for formatting

- [x] **Build Account List Page** (FR-ACC-002)
  - [x] Create `/app/accounts/page.tsx`
  - [x] Fetch accounts with TanStack Query
  - [x] Display accounts in grid/list view
  - [x] Add filter by account type
  - [x] Add search by account name
  - [x] Show loading and error states
  - [x] Make responsive for mobile

- [x] **Build Account Form Components**
  - [x] Create `AccountForm` component in `/components/accounts/AccountForm.tsx`
  - [x] Use React Hook Form + Zod validation
  - [x] Add account type selector
  - [x] Add currency selector (VND, USD, mace)
  - [x] Add opening balance input
  - [x] Handle form submission

### Sprint 2.3: Account CRUD Operations

- [x] **Create Account Flow** (FR-ACC-001)
  - [x] Create `/app/accounts/new/page.tsx`
  - [x] Implement create account form
  - [x] Handle opening balance transaction creation
  - [x] Show success message and redirect
  - [x] Handle validation errors

- [x] **View Account Details** (FR-ACC-002)
  - [x] Create `/app/accounts/[id]/page.tsx`
  - [x] Display account information
  - [x] Show current balance calculation
  - [x] Show transaction count
  - [x] Add "Edit" and "Delete" buttons

- [x] **Edit Account Flow** (FR-ACC-003)
  - [x] Create `/app/accounts/[id]/edit/page.tsx`
  - [x] Pre-fill form with existing data
  - [x] Implement update mutation
  - [x] Prevent currency change if transactions exist
  - [x] Prevent opening balance change if transactions exist
  - [x] Show validation errors

- [x] **Delete Account Flow** (FR-ACC-004)
  - [x] Create delete confirmation dialog
  - [x] Implement delete mutation
  - [x] Prevent deletion if transactions exist
  - [x] Show helpful error message with transaction count
  - [x] Redirect to accounts list after successful deletion

### Sprint 2.4: Account Dashboard Integration

- [x] **Update Dashboard**
  - [x] Fetch account balances on dashboard
  - [x] Display total balance across all accounts
  - [x] Show account summary cards
  - [x] Add "Add Account" quick action button
  - [x] Link to accounts page

- [x] **Create Account Utilities**
  - [x] Create `/lib/utils/account.utils.ts`
  - [x] Add `calculateBalance` function
  - [x] Add `formatCurrency` function
  - [x] Add `getAccountIcon` function
  - [x] Add balance aggregation helpers

---

## 📋 Phase 3: Transaction Management (Weeks 3-4)

**Reference:** `docs/specification.md` sections FR-TXN-001 through FR-TXN-007, FR-CAT-001 through FR-CAT-004  
**API Reference:** `docs/api-design.md` Transaction & Category Endpoints

### Sprint 3.1: Category Management

- [x] **Create Category Types & Components**
  - [x] Define Category interfaces in `/types/category.types.ts`
  - [x] Create Zod schemas in `/lib/schemas/category.schema.ts`
  - [x] Create `CategorySelector` component (hierarchical)
  - [x] Create `CategoryBadge` component for display

- [x] **Build Category API Routes**
  - [x] Create `GET /api/categories/expense` - List expense categories (FR-CAT-001)
  - [x] Create `POST /api/categories/expense` - Create custom expense category (FR-CAT-002)
  - [x] Create `PUT /api/categories/expense/[id]` - Update expense category (FR-CAT-003)
  - [x] Create `DELETE /api/categories/expense/[id]` - Delete expense category (FR-CAT-004)
  - [x] Create `GET /api/categories/income` - List income categories (FR-CAT-001)
  - [x] Create `POST /api/categories/income` - Create custom income category (FR-CAT-002)
  - [x] Create `PUT /api/categories/income/[id]` - Update income category (FR-CAT-003)
  - [x] Create `DELETE /api/categories/income/[id]` - Delete income category (FR-CAT-004)

- [x] **Build Category Management UI**
  - [x] Create `/app/settings/categories/page.tsx`
  - [x] Display default categories (read-only)
  - [x] Display custom categories (editable)
  - [x] Add "Create Custom Category" form
  - [x] Implement edit/delete for custom categories
  - [x] Prevent deletion if category has transactions

### Sprint 3.2: Counterparty Management

- [ ] **Create Counterparty Components**
  - [ ] Define Counterparty interface in `/types/counterparty.types.ts`
  - [ ] Create Zod schema in `/lib/schemas/counterparty.schema.ts`
  - [ ] Create `CounterpartySelector` component

- [ ] **Build Counterparty API Routes** (See `docs/api-design.md`)
  - [ ] Create `GET /api/counterparties` - List counterparties (FR-CPT-002)
  - [ ] Create `POST /api/counterparties` - Create counterparty (FR-CPT-001)
  - [ ] Create `PUT /api/counterparties/[id]` - Update counterparty (FR-CPT-003)
  - [ ] Create `DELETE /api/counterparties/[id]` - Delete counterparty (FR-CPT-004)

- [ ] **Build Counterparty Management UI**
  - [ ] Create `/app/settings/counterparties/page.tsx`
  - [ ] Display counterparty list with transaction counts
  - [ ] Add create/edit/delete functionality
  - [ ] Prevent deletion if counterparty has transactions

### Sprint 3.3: Transaction Data Layer

- [ ] **Create Transaction Types & Schemas**
  - [ ] Define Transaction interfaces in `/types/transaction.types.ts`
  - [ ] Create base Zod schemas in `/lib/schemas/transaction.schema.ts`
  - [ ] Create type-specific schemas (Expense, Income, Transfer, Borrow)
  - [ ] Add transaction type constants

- [ ] **Build Transaction API Routes** (See `docs/api-design.md`)
  - [ ] Create `GET /api/transactions` - List with filtering & pagination (FR-TXN-005)
  - [ ] Create `POST /api/transactions` - Create transaction (FR-TXN-001 to FR-TXN-004)
  - [ ] Create `GET /api/transactions/[id]` - Get transaction details (FR-TXN-005)
  - [ ] Create `PUT /api/transactions/[id]` - Update transaction (FR-TXN-006)
  - [ ] Create `DELETE /api/transactions/[id]` - Delete transaction (FR-TXN-007)
  - [ ] Implement balance recalculation on create/update/delete
  - [ ] Handle transfer transactions (linked records)

### Sprint 3.4: Transaction UI - Create Flows

- [ ] **Create Transaction Form Base**
  - [ ] Create `/components/transactions/TransactionForm.tsx`
  - [ ] Add transaction type tabs (Expense, Income, Transfer, Borrow)
  - [ ] Create dynamic form that changes based on type
  - [ ] Add date/time picker
  - [ ] Add notes/details field

- [ ] **Expense Transaction Flow** (FR-TXN-001)
  - [ ] Create `/app/transactions/new/page.tsx`
  - [ ] Implement expense form fields:
    - [ ] From account selector
    - [ ] Amount input
    - [ ] Expense category selector (hierarchical)
    - [ ] Counterparty selector (optional)
    - [ ] Payment method selector (Cash, Credit Card, Installment)
    - [ ] Installment details (if selected)
  - [ ] Implement form submission
  - [ ] Update account balance
  - [ ] Show success message

- [ ] **Income Transaction Flow** (FR-TXN-002)
  - [ ] Implement income form fields:
    - [ ] To account selector
    - [ ] Amount input
    - [ ] Income category selector
    - [ ] Counterparty selector (optional)
  - [ ] Implement form submission
  - [ ] Update account balance

- [ ] **Transfer Transaction Flow** (FR-TXN-003)
  - [ ] Implement transfer form fields:
    - [ ] From account selector
    - [ ] To account selector
    - [ ] Amount input
    - [ ] Currency exchange field (if currencies differ)
    - [ ] Auto-calculate destination amount
  - [ ] Implement form submission
  - [ ] Update both account balances
  - [ ] Create linked transaction records

- [ ] **Borrow Transaction Flow** (FR-TXN-004)
  - [ ] Implement borrow form fields:
    - [ ] Toggle: Borrowing (receiving) vs Lending (giving)
    - [ ] Account selector
    - [ ] Amount input
    - [ ] Counterparty selector (required)
  - [ ] Implement form submission
  - [ ] Update account balance

### Sprint 3.5: Transaction UI - List & Details

- [ ] **Create Transaction List Page** (FR-TXN-005)
  - [ ] Create `/app/transactions/page.tsx`
  - [ ] Fetch transactions with pagination
  - [ ] Display transaction table/list
  - [ ] Show: date, type, category, amount, account, balance after
  - [ ] Add sorting (date, amount, category)
  - [ ] Add filtering:
    - [ ] Date range picker
    - [ ] Transaction type filter
    - [ ] Account filter
    - [ ] Category filter
    - [ ] Search by description
  - [ ] Implement pagination controls
  - [ ] Make responsive for mobile

- [ ] **Create Transaction Details Page**
  - [ ] Create `/app/transactions/[id]/page.tsx`
  - [ ] Display full transaction information
  - [ ] Show related account(s) with links
  - [ ] Show category with hierarchy
  - [ ] Add "Edit" and "Delete" buttons

- [ ] **Edit Transaction Flow** (FR-TXN-006)
  - [ ] Create `/app/transactions/[id]/edit/page.tsx`
  - [ ] Pre-fill form with existing data
  - [ ] Prevent changing transaction type
  - [ ] Implement update mutation
  - [ ] Recalculate account balances
  - [ ] Handle transfer transaction updates (both records)

- [ ] **Delete Transaction Flow** (FR-TXN-007)
  - [ ] Create delete confirmation dialog
  - [ ] Implement delete mutation
  - [ ] Reverse impact on account balance
  - [ ] Handle transfer transaction deletion (both records)
  - [ ] Redirect to transaction list

---

## 📋 Phase 4: Reporting & Analytics (Weeks 5-6)

**Reference:** `docs/specification.md` sections FR-RPT-001 through FR-RPT-005  
**API Reference:** `docs/api-design.md` Report Endpoints

### Sprint 4.1: Report Infrastructure

- [ ] **Install Chart Library**
  - [ ] Run `npm install recharts`
  - [ ] Create chart wrapper components in `/components/charts/`
  - [ ] Create `PieChart` component
  - [ ] Create `LineChart` component
  - [ ] Create `BarChart` component
  - [ ] Make all charts responsive

- [ ] **Create Report Utilities**
  - [ ] Create `/lib/utils/report.utils.ts`
  - [ ] Add date grouping functions (day, week, month, year)
  - [ ] Add percentage calculation helpers
  - [ ] Add data aggregation functions
  - [ ] Add trend calculation functions

- [ ] **Create Report Components**
  - [ ] Create `DateRangePicker` component
  - [ ] Create `ReportSummaryCard` component
  - [ ] Create `CategoryBreakdown` component
  - [ ] Create `OvertimeChart` component
  - [ ] Create `FilterPanel` component

### Sprint 4.2: Expense Report

- [ ] **Build Expense Report API** (FR-RPT-001)
  - [ ] Create `GET /api/reports/expense`
  - [ ] Implement date range filtering
  - [ ] Implement category filtering
  - [ ] Calculate summary metrics:
    - [ ] Total expense
    - [ ] Transaction count
    - [ ] Average expense
  - [ ] Calculate by category breakdown:
    - [ ] Amount per category
    - [ ] Percentage of total
    - [ ] Transaction count per category
  - [ ] Calculate overtime data:
    - [ ] Group by day/week/month/year
    - [ ] Sum amounts per period
    - [ ] Count transactions per period

- [ ] **Build Expense Report UI** (FR-RPT-001)
  - [ ] Create `/app/reports/expense/page.tsx`
  - [ ] Add date range selector
  - [ ] Add grouping selector (day, week, month, year)
  - [ ] Add category multi-select filter
  - [ ] Display summary cards (total, count, average)
  - [ ] Display category breakdown pie chart
  - [ ] Display expense overtime line/bar chart
  - [ ] Add drill-down to view transactions per category
  - [ ] Group by parent category by default
  - [ ] Allow drill-down to child categories
  - [ ] Make responsive for mobile

### Sprint 4.3: Income Report

- [ ] **Build Income Report API** (FR-RPT-002)
  - [ ] Create `GET /api/reports/income`
  - [ ] Implement date range filtering
  - [ ] Implement category filtering
  - [ ] Calculate summary metrics (total, count, average)
  - [ ] Calculate by category breakdown
  - [ ] Calculate overtime data

- [ ] **Build Income Report UI** (FR-RPT-002)
  - [ ] Create `/app/reports/income/page.tsx`
  - [ ] Add date range selector
  - [ ] Add grouping selector
  - [ ] Add category multi-select filter
  - [ ] Display summary cards
  - [ ] Display category breakdown pie chart
  - [ ] Display income overtime line/bar chart
  - [ ] Add drill-down to view transactions per category
  - [ ] Make responsive for mobile

### Sprint 4.4: Comparison Report

- [ ] **Build Comparison Report API** (FR-RPT-003)
  - [ ] Create `GET /api/reports/comparison`
  - [ ] Implement date range filtering
  - [ ] Implement grouping (day, week, month, year)
  - [ ] Calculate summary metrics:
    - [ ] Total income
    - [ ] Total expense
    - [ ] Net savings
    - [ ] Savings rate percentage
  - [ ] Calculate overtime comparison:
    - [ ] Income per period
    - [ ] Expense per period
    - [ ] Net per period

- [ ] **Build Comparison Report UI** (FR-RPT-003)
  - [ ] Create `/app/reports/comparison/page.tsx`
  - [ ] Add date range selector
  - [ ] Add grouping selector
  - [ ] Display summary cards:
    - [ ] Total income (green)
    - [ ] Total expense (red)
    - [ ] Net savings (blue)
    - [ ] Savings rate (percentage)
  - [ ] Display dual-axis chart (income vs expense overtime)
  - [ ] Add trend indicators (↑ increasing / ↓ decreasing)
  - [ ] Display percentage breakdown
  - [ ] Make responsive for mobile

### Sprint 4.5: Financial Statement

- [ ] **Build Financial Statement API** (FR-RPT-004)
  - [ ] Create `GET /api/reports/statement`
  - [ ] Calculate assets:
    - [ ] Fetch all financial accounts
    - [ ] Calculate current balance for each
    - [ ] Sum total assets
  - [ ] Calculate liabilities:
    - [ ] Sum amounts borrowed from others (by counterparty)
    - [ ] Sum amounts lent to others (by counterparty)
    - [ ] Calculate total liabilities
  - [ ] Calculate net worth (Assets - Liabilities)

- [ ] **Build Financial Statement UI** (FR-RPT-004)
  - [ ] Create `/app/reports/statement/page.tsx`
  - [ ] Display Assets section:
    - [ ] List all accounts with balances
    - [ ] Group by account type
    - [ ] Show total assets
  - [ ] Display Liabilities section:
    - [ ] List borrowed amounts by counterparty
    - [ ] List lent amounts by counterparty
    - [ ] Show total liabilities
  - [ ] Display Net Worth prominently
  - [ ] Add links to view transactions for each account/counterparty
  - [ ] Make responsive for mobile

### Sprint 4.6: Transaction History Report

- [ ] **Transaction History Enhancements** (FR-RPT-005)
  - [ ] Enhance `/app/transactions/page.tsx`
  - [ ] Add advanced sorting options
  - [ ] Add export placeholder (for future enhancement)
  - [ ] Add print-friendly view
  - [ ] Add transaction summary for filtered results

### Sprint 4.7: Dashboard Finalization

- [ ] **Complete Dashboard Integration**
  - [ ] Replace placeholder cards with real data
  - [ ] Add quick stats widgets:
    - [ ] Total balance
    - [ ] Monthly income
    - [ ] Monthly expense
    - [ ] Net savings this month
  - [ ] Add "Recent Transactions" list (last 10)
  - [ ] Add mini charts (expense trend, top categories)
  - [ ] Add quick links to all reports
  - [ ] Make fully responsive

---

## 📋 Phase 5: Testing & Refinement (Week 7)

_Will be detailed when Phase 4 is complete_

---

## 📝 Notes & Decisions

### Tech Stack Confirmations

- ✅ Next.js 14+ with App Router
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ shadcn/ui for components
- ✅ Supabase for backend/database
- ✅ React Hook Form + Zod for forms
- ✅ TanStack Query for data fetching (will add in Phase 2)
- ✅ Recharts for visualizations (will add in Phase 4)

### Environment Variables Needed

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Folder Structure

```
pocketmate/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   ├── accounts/
│   ├── transactions/
│   ├── reports/
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── ui/ (shadcn components)
│   ├── forms/
│   ├── layouts/
│   └── shared/
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   └── utils.ts
├── types/
│   └── database.types.ts
├── docs/
│   ├── requirements.md
│   ├── database-schema.md
│   └── api-design.md
└── TODO.md
```

---

## 🐛 Known Issues

_None yet_

---

## 💡 Future Considerations

- Consider adding Sentry for error tracking
- Consider adding analytics (PostHog, Plausible)
- Consider adding tests (Vitest, Playwright)
- Consider adding Storybook for component development

---

## 📚 Reference Documents

- **Requirements:** `docs/requirements.md`
- **Database Schema:** `docs/database-schema.md`
- **API Design:** `docs/api-design.md`
