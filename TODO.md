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

- [x] **Create Counterparty Components**
  - [x] Define Counterparty interface in `/types/counterparty.types.ts`
  - [x] Create Zod schema in `/lib/schemas/counterparty.schema.ts`
  - [x] Create `CounterpartySelector` component

- [x] **Build Counterparty API Routes** (See `docs/api-design.md`)
  - [x] Create `GET /api/counterparties` - List counterparties (FR-CPT-002)
  - [x] Create `POST /api/counterparties` - Create counterparty (FR-CPT-001)
  - [x] Create `PUT /api/counterparties/[id]` - Update counterparty (FR-CPT-003)
  - [x] Create `DELETE /api/counterparties/[id]` - Delete counterparty (FR-CPT-004)

- [x] **Build Counterparty Management UI**
  - [x] Create `/app/settings/counterparties/page.tsx`
  - [x] Display counterparty list with transaction counts
  - [x] Add create/edit/delete functionality
  - [x] Prevent deletion if counterparty has transactions

### Sprint 3.3: Transaction Data Layer

- [x] **Create Transaction Types & Schemas**
  - [x] Define Transaction interfaces in `/types/transaction.types.ts`
  - [x] Create base Zod schemas in `/lib/schemas/transaction.schema.ts`
  - [x] Create type-specific schemas (Expense, Income, Transfer, Borrow)
  - [x] Add transaction type constants

- [x] **Build Transaction API Routes** (See `docs/api-design.md`)
  - [x] Create `GET /api/transactions` - List with filtering & pagination (FR-TXN-005)
  - [x] Create `POST /api/transactions` - Create transaction (FR-TXN-001 to FR-TXN-004)
  - [x] Create `GET /api/transactions/[id]` - Get transaction details (FR-TXN-005)
  - [x] Create `PUT /api/transactions/[id]` - Update transaction (FR-TXN-006)
  - [x] Create `DELETE /api/transactions/[id]` - Delete transaction (FR-TXN-007)
  - [x] Implement balance recalculation on create/update/delete
  - [x] Handle transfer transactions (linked records)

### Sprint 3.4: Transaction UI - Create Flows

- [x] **Create Transaction Form Base**
  - [x] Create `/components/transactions/TransactionForm.tsx`
  - [x] Add transaction type tabs (Expense, Income, Transfer, Borrow/Lend)
  - [x] Create dynamic form that changes based on type
  - [x] Add date/time picker
  - [x] Add notes/details field

- [x] **Expense Transaction Flow** (FR-TXN-001)
  - [x] Create `/app/transactions/new/page.tsx`
  - [x] Implement expense form fields:
    - [x] From account selector
    - [x] Amount input
    - [x] Expense category selector (hierarchical)
    - [x] Counterparty selector (optional)
  - [x] Implement form submission
  - [x] Update account balance
  - [x] Show success message

- [x] **Income Transaction Flow** (FR-TXN-002)
  - [x] Implement income form fields:
    - [x] To account selector
    - [x] Amount input
    - [x] Income category selector
    - [x] Counterparty selector (optional)
  - [x] Implement form submission
  - [x] Update account balance

- [x] **Transfer Transaction Flow** (FR-TXN-003)
  - [x] Implement transfer form fields:
    - [x] From account selector
    - [x] To account selector
    - [x] Amount input
    - [x] Auto-fill second amount from cached rate when currencies differ
    - [x] Show exchange-rate note in `1 FROM = X TO` format
    - [x] Keep user-edited amount pair without mutating cached rates
  - [x] Implement form submission
  - [x] Update both account balances
  - [x] Create linked transaction records

- [x] **Borrow Transaction Flow** (FR-TXN-004)
  - [x] Implement borrow form fields:
    - [x] Toggle: Borrowing (receiving) vs Lending (giving)
    - [x] Account selector
    - [x] Amount input
    - [x] Counterparty selector (required)
  - [x] Implement form submission
  - [x] Update account balance

### Sprint 3.5: Transaction UI - List & Details

- [x] **Create Transaction List Page** (FR-TXN-005)
  - [x] Create `/app/transactions/page.tsx`
  - [x] Fetch transactions with pagination
  - [x] Display transaction table/list
  - [x] Show: date, type, category, amount, account, balance after (placeholder for balance)
  - [x] Add sorting (date, amount, category)
  - [x] Add filtering:
    - [x] Date range picker
    - [x] Transaction type filter
    - [x] Account filter
    - [x] Category filter
    - [x] Search by description
  - [x] Implement pagination controls
  - [x] Make responsive for mobile

- [x] **Create Transaction Details Page**
  - [x] Create `/app/transactions/[id]/page.tsx`
  - [x] Display full transaction information
  - [x] Show related account(s) with links
  - [x] Show category with hierarchy
  - [x] Add "Edit" and "Delete" buttons
 
- [x] **Edit Transaction Flow** (FR-TXN-006)
  - [x] Create `/app/transactions/[id]/edit/page.tsx`
  - [x] Pre-fill form with existing data
  - [x] Prevent changing transaction type
  - [x] Implement update mutation
  - [ ] Recalculate account balances
  - [ ] Handle transfer transaction updates (both records)
 
- [x] **Delete Transaction Flow** (FR-TXN-007)
  - [x] Create delete confirmation dialog
  - [x] Implement delete mutation
  - [ ] Reverse impact on account balance
  - [ ] Handle transfer transaction deletion (both records)
  - [x] Redirect to transaction list

---

## 📋 Phase 4: Reporting & Analytics (Weeks 5-6)

**Reference:** `docs/specification.md` sections FR-RPT-001 through FR-RPT-005  
**API Reference:** `docs/api-design.md` Report Endpoints

### Sprint 4.1: Report Infrastructure

- [x] **Install Chart Library**
  - [x] Run `npm install recharts`
  - [x] Create chart wrapper components in `/components/charts/`
  - [x] Create `PieChart` component
  - [x] Create `LineChart` component
  - [x] Create `BarChart` component
  - [x] Make all charts responsive

- [x] **Create Report Utilities**
  - [x] Create `/lib/utils/report.utils.ts`
  - [x] Add date grouping functions (day, week, month, year)
  - [x] Add percentage calculation helpers
  - [x] Add data aggregation functions
  - [x] Add trend calculation functions

- [x] **Create Report Components**
  - [x] Create `DateRangePicker` component
  - [x] Create `ReportSummaryCard` component
  - [x] Create `CategoryBreakdown` component
  - [x] Create `OvertimeChart` component
  - [x] Create `FilterPanel` component

### Sprint 4.2: Expense Report

- [x] **Build Expense Report API** (FR-RPT-001)
  - [x] Create `GET /api/reports/expense`
  - [x] Implement date range filtering
  - [x] Implement category filtering
  - [x] Calculate summary metrics:
    - [x] Total expense
    - [x] Transaction count
    - [x] Average expense
  - [x] Calculate by category breakdown:
    - [x] Amount per category
    - [x] Percentage of total
    - [x] Transaction count per category
  - [x] Calculate overtime data:
    - [x] Group by day/week/month/year
    - [x] Sum amounts per period
    - [x] Count transactions per period

- [x] **Build Expense Report UI** (FR-RPT-001)
  - [x] Create `/app/reports/expense/page.tsx`
  - [x] Add date range selector
  - [x] Add grouping selector (day, week, month, year)
  - [x] Add category multi-select filter
  - [x] Display summary cards (total, count, average)
  - [x] Display category breakdown pie chart
  - [x] Display expense overtime line/bar chart
  - [x] Add drill-down to view transactions per category
  - [x] Group by parent category by default
  - [x] Allow drill-down to child categories
  - [x] Make responsive for mobile

### Sprint 4.3: Income Report

- [x] **Build Income Report API** (FR-RPT-002)
  - [x] Create `GET /api/reports/income`
  - [x] Implement date range filtering
  - [x] Implement category filtering
  - [x] Calculate summary metrics (total, count, average)
  - [x] Calculate by category breakdown
  - [x] Calculate overtime data

- [x] **Build Income Report UI** (FR-RPT-002)
  - [x] Create `/app/reports/income/page.tsx`
  - [x] Add date range selector
  - [x] Add grouping selector
  - [x] Add category multi-select filter
  - [x] Display summary cards
  - [x] Display category breakdown pie chart
  - [x] Display income overtime line/bar chart
  - [x] Add drill-down to view transactions per category
  - [x] Make responsive for mobile

### Sprint 4.4: Comparison Report

- [x] **Build Comparison Report API** (FR-RPT-003)
  - [x] Create `GET /api/reports/comparison`
  - [x] Implement date range filtering
  - [x] Implement grouping (day, week, month, year)
  - [x] Calculate summary metrics:
    - [x] Total income
    - [x] Total expense
    - [x] Net savings
    - [x] Savings rate percentage
  - [x] Calculate overtime comparison:
    - [x] Income per period
    - [x] Expense per period
    - [x] Net per period

- [x] **Build Comparison Report UI** (FR-RPT-003)
  - [x] Create `/app/reports/comparison/page.tsx`
  - [x] Add date range selector
  - [x] Add grouping selector
  - [x] Display summary cards:
    - [x] Total income (green)
    - [x] Total expense (red)
    - [x] Net savings (blue)
    - [x] Savings rate (percentage)
  - [x] Display dual-axis chart (income vs expense overtime)
  - [x] Add trend indicators (↑ increasing / ↓ decreasing)
  - [x] Display percentage breakdown
  - [x] Make responsive for mobile

### Sprint 4.5: Financial Statement

- [x] **Build Financial Statement API** (FR-RPT-004)
  - [x] Create `GET /api/reports/statement`
  - [x] Calculate assets:
    - [x] Fetch all financial accounts
    - [x] Calculate current balance for each
    - [x] Sum total assets
  - [x] Calculate liabilities:
    - [x] Sum amounts borrowed from others (by counterparty)
    - [x] Sum amounts lent to others (by counterparty)
    - [x] Calculate total liabilities
  - [x] Calculate net worth (Assets - Liabilities)

- [x] **Build Financial Statement UI** (FR-RPT-004)
  - [x] Create `/app/reports/statement/page.tsx`
  - [x] Display Assets section:
    - [x] List all accounts with balances
    - [x] Group by account type
    - [x] Show total assets
  - [x] Display Liabilities section:
    - [x] List borrowed amounts by counterparty
    - [x] List lent amounts by counterparty
    - [x] Show total liabilities
  - [x] Display Net Worth prominently
  - [x] Add links to view transactions for each account/counterparty
  - [x] Make responsive for mobile
  - [x] Normalize report amounts to converted VND across expense, income, comparison, and statement views

### Sprint 4.6: Transaction History Report

- [ ] **Transaction History Enhancements** (FR-RPT-005)
  - [ ] Enhance `/app/transactions/page.tsx`
  - [ ] Add advanced sorting options
  - [ ] Add export placeholder (for future enhancement)
  - [ ] Add print-friendly view
  - [ ] Add transaction summary for filtered results

### Sprint 4.7: Dashboard Finalization

- [x] **Complete Dashboard Integration**
  - [x] Replace placeholder cards with real data
  - [x] Add quick stats widgets:
    - [x] Total balance
    - [x] Monthly income
    - [x] Monthly expense
    - [x] Net savings this month
  - [x] Add "Recent Transactions" list (last 10)
  - [x] Add mini charts (expense trend, top categories)
  - [x] Add quick links to all reports
  - [x] Improve cache-first loading UX across reports/accounts/transactions/settings using TanStack Query cached data
  - [x] Remove dashboard "Quick Actions" section
  - [x] Add global "Add Transaction" floating action button (FAB)
  - [x] Make fully responsive

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
