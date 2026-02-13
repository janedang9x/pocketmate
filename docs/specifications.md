# PocketMate - Software Requirements Specification

**Version:** 1.0.0 (MVP)  
**Date:** February 2026  
**Platform:** Web Application  
**Tech Stack:** Next.js, TypeScript, Tailwind CSS, Supabase

---

## Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. Product Overview](#2-product-overview)
- [3. Technical Architecture](#3-technical-architecture)
- [4. Functional Requirements](#4-functional-requirements)
- [5. Non-Functional Requirements](#5-non-functional-requirements)
- [6. MVP Scope](#6-mvp-scope)
- [7. Future Enhancements](#7-future-enhancements)

---

## 1. Executive Summary

PocketMate is a modern web-based financial management application designed to help individuals and families track their income, expenses, and financial accounts efficiently. The MVP version focuses on delivering core functionality with a clean, intuitive interface.

### Key Highlights

- Simple user authentication (username/password)
- Support for multiple financial account types (Bank Account, Credit Card, E-wallet, Cash, Others)
- Multi-currency support with exchange rate tracking
- Comprehensive transaction tracking (Expense, Income, Borrow, Transfer)
- Hierarchical category system with customization
- Installment payment tracking
- Rich reporting with overtime analysis and category breakdowns
- Counterparty management for tracking financial relationships

---

## 2. Product Overview

### 2.1 Product Vision

PocketMate democratizes personal financial management by providing a powerful yet simple-to-use tool that helps users understand and control their finances without requiring accounting knowledge.

### 2.2 Target Users

- **Individuals:** People tracking personal expenses and income
- **Families:** Households managing shared finances and budgets
- **Young Professionals:** Those starting their financial independence journey
- **Small Business Owners:** Entrepreneurs tracking business and personal finances separately

### 2.3 Core Features (MVP)

- User registration and authentication
- Financial account management with opening balances
- Transaction recording (expenses, income, transfers, borrowing)
- Category management with parent-child relationships
- Counterparty tracking
- Expense reports with category breakdowns
- Income reports with source analysis
- Expense vs Income comparison reports
- Financial statement generation
- Transaction history with filtering

---

## 3. Technical Architecture

### 3.1 Technology Stack

| Layer              | Technology      | Purpose                                              |
| ------------------ | --------------- | ---------------------------------------------------- |
| Frontend Framework | Next.js 14+     | React framework with App Router, SSR, and API routes |
| Language           | TypeScript      | Type-safe development                                |
| Styling            | Tailwind CSS    | Utility-first CSS framework                          |
| UI Components      | shadcn/ui       | Accessible, customizable components                  |
| Backend/Database   | Supabase        | PostgreSQL database with real-time capabilities      |
| Authentication     | Supabase Auth   | Built-in authentication system                       |
| Form Handling      | React Hook Form | Performant form management                           |
| Validation         | Zod             | Schema validation                                    |
| State Management   | TanStack Query  | Server state management and caching                  |
| Charts             | Recharts        | Composable charting library                          |
| Date Utilities     | date-fns        | Date manipulation and formatting                     |

### 3.2 System Architecture

**Three-tier architecture:**

1. **Presentation Layer (Frontend):** Next.js application with server and client components
2. **Application Layer (API Routes):** Next.js API routes handling business logic and validation
3. **Data Layer (Supabase):** PostgreSQL database with Row Level Security (RLS) policies

### 3.3 Database Design Principles

- Single user model (no multi-user sharing in MVP)
- Soft deletes where appropriate using is_active flags
- Foreign key constraints with CASCADE on delete for dependent records
- UUID primary keys for better security and scalability
- Proper indexing on foreign keys and frequently queried fields
- Row Level Security (RLS) policies to ensure users only access their own data

---

## 4. Functional Requirements

### 4.1 User Authentication

#### FR-AUTH-001: User Registration

**Priority:** High

The system shall allow new users to create an account by providing a username and password. Email verification is not required for the MVP version.

**Acceptance Criteria:**

- User can enter a unique username
- User can create a password (minimum 8 characters)
- System validates username uniqueness
- User is automatically logged in after successful registration
- System creates a user profile record

#### FR-AUTH-002: User Login

**Priority:** High

The system shall allow registered users to log in using their username and password.

**Acceptance Criteria:**

- User can enter username and password
- System validates credentials
- System creates a session token upon successful login
- System displays appropriate error messages for invalid credentials
- User is redirected to dashboard after successful login

#### FR-AUTH-003: User Logout

**Priority:** High

The system shall allow users to securely log out of their account.

**Acceptance Criteria:**

- User can click logout button
- System invalidates session token
- User is redirected to login page
- All session data is cleared

---

### 4.2 Financial Account Management

#### FR-ACC-001: Create Financial Account

**Priority:** High

Users shall be able to create financial accounts to track their money across different sources.

**Acceptance Criteria:**

- User can select account type (Bank Account, Credit Card, E-wallet, Cash, Others)
- User can enter account name
- User can select currency (VND, USD, mace)
- User can set opening balance
- System validates required fields
- System saves the account and displays it in the account list
- Opening balance is recorded as the first transaction

#### FR-ACC-002: View Financial Accounts

**Priority:** High

Users shall be able to view a list of all their financial accounts.

**Acceptance Criteria:**

- System displays all accounts in a list or card view
- Each account shows: name, type, currency, current balance
- Current balance is calculated from opening balance + sum of all transactions
- User can filter accounts by type
- User can search accounts by name

#### FR-ACC-003: Edit Financial Account

**Priority:** Medium

Users shall be able to edit account details.

**Acceptance Criteria:**

- User can update account name
- User can update account type
- User cannot change currency if transactions exist (data integrity)
- User cannot change opening balance if transactions exist
- System validates changes
- System updates the account record

#### FR-ACC-004: Delete Financial Account

**Priority:** Medium

Users shall be able to delete financial accounts. When an account with transactions is deleted, all associated transactions are automatically deleted (cascade delete).

**Acceptance Criteria:**

- User receives confirmation prompt before deletion
- If account has transactions, system displays warning that all transactions will be deleted
- System deletes all transactions associated with the account (from_account_id or to_account_id)
- System removes the account from database
- System displays success message indicating account and transaction deletion count

---

### 4.3 Transaction Management

#### FR-TXN-001: Create Expense Transaction

**Priority:** High

Users shall be able to record expense transactions.

**Acceptance Criteria:**

- User selects transaction type: Expense
- User selects financial account (source of payment)
- User enters amount
- User selects expense category (required)
- User can optionally select counterparty
- User enters date and time
- User can add notes/description
- User can select payment method (Cash, Credit Card, Installment)
- If Installment selected, user enters number of installments
- System validates all required fields
- System deducts amount from account balance
- System saves transaction

#### FR-TXN-002: Create Income Transaction

**Priority:** High

Users shall be able to record income transactions.

**Acceptance Criteria:**

- User selects transaction type: Income
- User selects financial account (destination)
- User enters amount
- User selects income category (required)
- User can optionally select counterparty (income source)
- User enters date and time
- User can add notes/description
- System validates all required fields
- System adds amount to account balance
- System saves transaction

#### FR-TXN-003: Create Transfer Transaction

**Priority:** High

Users shall be able to transfer money between their accounts.

**Acceptance Criteria:**

- User selects transaction type: Transfer
- User selects source account (from)
- User selects destination account (to)
- User enters amount in source account currency
- If accounts have different currencies, user enters exchange rate
- System calculates destination amount using exchange rate
- User enters date and time
- User can add notes/description
- System deducts from source account
- System adds to destination account
- System creates linked transaction records

#### FR-TXN-004: Create Borrow Transaction

**Priority:** Medium

Users shall be able to record borrowing or lending transactions.

**Acceptance Criteria:**

- User selects transaction type: Borrow
- User specifies if borrowing (receiving) or lending (giving)
- User selects financial account
- User enters amount
- User selects or creates counterparty (required)
- User enters date and time
- User can add notes/description
- System adjusts account balance accordingly
- System saves transaction

#### FR-TXN-005: View Transactions

**Priority:** High

Users shall be able to view their transaction history.

**Acceptance Criteria:**

- System displays transactions in reverse chronological order
- Each transaction shows: date, type, category, amount, account, balance after
- User can filter by date range
- User can filter by transaction type
- User can filter by account
- User can filter by category
- User can search by description/notes
- System supports pagination for large datasets

#### FR-TXN-006: Edit Transaction

**Priority:** Medium

Users shall be able to edit existing transactions.

**Acceptance Criteria:**

- User can modify all transaction fields except type
- System recalculates account balances
- System updates timestamp
- System validates changes
- For transfer transactions, system updates both linked records

#### FR-TXN-007: Delete Transaction

**Priority:** Medium

Users shall be able to delete transactions.

**Acceptance Criteria:**

- User receives confirmation prompt
- System reverses the transaction impact on account balance
- For transfer transactions, system deletes both linked records
- System removes transaction from database
- System displays success message

---

### 4.4 Category Management

#### FR-CAT-001: View Default Categories

**Priority:** High

The system shall provide default expense and income categories organized in a two-level hierarchy.

**Default Expense Categories (Parent → Children):**

- Bills & Utilities → Electricity, Water, Gas, Internet, Phone
- Coffee & Drinks → Coffee, Tea, Juice, Soft drinks
- Dining → Restaurants, Fast food, Café, Bar
- Education → Tuition, Books & Supplies, Courses & Training
- Entertainment & Leisure → Movies, Concerts, Games, Hobbies & Interests, Travel, Parking & Toll
- Fitness & Sports → Gym membership, Equipment
- Gifts & Donations → Gifts, Charity
- Groceries → Supermarket, Fresh produce, Meat & Seafood
- Healthcare → Medications, Doctor visits, Insurance
- Home & Garden → Furniture & Appliances, Repairs, Decor, Garden supplies
- Kids → Toys, Childcare, School supplies
- Lifestyle → Clothing, Beauty & Self-care, Entertainment & Leisure
- Personal Care → Haircuts & Grooming, Skincare, Wellness
- Pets → Pet food, Veterinary, Pet supplies
- Shopping → Clothing, Electronics, Books, Holidays & Festivals, Events gatherings
- Transportation → Fuel, Public transit, Taxi/Ride-share, Vehicle maintenance

**Default Income Categories:**

- Salary
- Freelance
- Investment
- House rent
- Other

#### FR-CAT-002: Create Custom Category

**Priority:** Medium

Users shall be able to create custom categories.

**Acceptance Criteria:**

- User can create a new parent category
- User can create a child category under existing parent
- User enters category name
- User selects if category is for expense or income
- System validates name uniqueness within the same level
- System saves category
- Category appears in category lists for transaction creation

#### FR-CAT-003: Edit Category

**Priority:** Medium

Users shall be able to edit both default and custom categories.

**Acceptance Criteria:**

- User can rename category
- User can move child category to different parent
- User cannot change category type (expense/income) if transactions exist
- System updates all transactions using this category
- System validates changes

#### FR-CAT-004: Delete Category

**Priority:** Medium

Users shall be able to delete custom categories.

**Acceptance Criteria:**

- System prevents deletion if transactions are using this category
- User must reassign transactions to another category before deletion
- System displays list of transactions using the category
- When deleting parent category, all child categories are handled appropriately
- User receives confirmation prompt
- System removes category from database

---

### 4.5 Counterparty Management

#### FR-CPT-001: Create Counterparty

**Priority:** Medium

Users shall be able to create counterparty records to track people or organizations they transact with.

**Acceptance Criteria:**

- User enters counterparty name
- System validates name uniqueness
- System saves counterparty record
- Counterparty appears in selection lists for transactions

#### FR-CPT-002: View Counterparties

**Priority:** Low

Users shall be able to view all counterparties.

#### FR-CPT-003: Edit Counterparty

**Priority:** Low

Users shall be able to edit counterparty names.

#### FR-CPT-004: Delete Counterparty

**Priority:** Low

Users shall be able to delete counterparties if no transactions reference them.

---

### 4.6 Reporting & Analytics

#### FR-RPT-001: Expense Report

**Priority:** High

Users shall be able to view comprehensive expense analysis.

**Acceptance Criteria:**

- User can select time period (month, year, custom date range)
- System displays total expense amount for selected period
- System shows proportion of each expense category as pie chart
- System shows expense overtime as line/bar chart
- User can filter by specific expense categories (multi-select)
- User can view list of transactions under each category
- System groups expenses by parent category by default
- User can drill down to child categories

#### FR-RPT-002: Income Report

**Priority:** High

Users shall be able to view comprehensive income analysis.

**Acceptance Criteria:**

- User can select time period (month, year, custom date range)
- System displays total income amount for selected period
- System shows proportion of each income category as pie chart
- System shows income overtime as line/bar chart
- User can filter by specific income categories (multi-select)
- User can view list of transactions under each category

#### FR-RPT-003: Expense vs Income Report

**Priority:** High

Users shall be able to compare income against expenses.

**Acceptance Criteria:**

- User can select time period (month, year, custom date range)
- System displays total income vs total expense
- System calculates net savings/deficit
- System shows overtime comparison as dual-axis chart
- System displays percentage breakdown
- System shows trend indicators (increasing/decreasing)

#### FR-RPT-004: Financial Statement

**Priority:** High

Users shall be able to view their current financial position.

**Acceptance Criteria:**

- System displays all financial accounts with current balances (Assets)
- System shows amounts lent to others by counterparty
- System shows amounts owed to others by counterparty (Liabilities)
- System calculates net worth (Assets - Liabilities)
- User can view transaction list for each account
- User can view transaction list for each counterparty

#### FR-RPT-005: Transaction History

**Priority:** High

Users shall be able to view complete transaction history with filtering.

**Acceptance Criteria:**

- System displays all transactions in chronological order
- User can sort by date, amount, category
- User can filter by date range, type, account, category
- System supports search by description
- User can export filtered results (future enhancement)

---

## 5. Non-Functional Requirements

### 5.1 Performance

- **Page Load Time:** All pages load within 2 seconds on standard broadband
- **API Response Time:** 95% of requests respond within 500ms
- **Database Query Performance:** Complex queries complete within 1 second
- **Concurrent Users:** Support 100 concurrent users without degradation

### 5.2 Security

- Password hashing using bcrypt or Argon2
- Secure session management using JWT tokens
- HTTPS encryption for all data transmission
- SQL injection prevention through parameterized queries
- XSS protection through input sanitization
- CSRF protection on all state-changing operations
- Row Level Security (RLS) policies in Supabase
- Regular security audits and dependency updates

### 5.3 Usability

- Intuitive interface requiring minimal training
- Clear error messages with actionable guidance
- Confirmation dialogs for destructive actions
- Form validation with inline error messages
- Keyboard navigation support
- Screen reader compatibility
- Consistent UI patterns throughout application

### 5.4 Compatibility

- **Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers:** iOS Safari 14+, Chrome Mobile 90+
- **Screen Resolutions:** Responsive design supporting 320px to 2560px width
- **Operating Systems:** Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+), iOS 14+, Android 10+

### 5.5 Reliability

- **Uptime:** 99.5% availability during business hours
- **Data Backup:** Daily automated backups of database
- **Error Handling:** Graceful degradation with user-friendly error messages
- **Data Integrity:** Transaction atomicity ensuring consistent account balances

### 5.6 Maintainability

- Comprehensive code documentation
- Consistent coding standards (ESLint, Prettier)
- Component-based architecture for reusability
- Automated testing (unit tests, integration tests)
- Git-based version control with branching strategy
- CI/CD pipeline for automated deployments

---

## 6. MVP Scope

### 6.1 Included in MVP

- User authentication (register, login, logout)
- Financial account management (CRUD operations)
- Transaction management (create, view, edit, delete)
- Category management (view defaults, create custom, edit, delete)
- Counterparty management (basic CRUD)
- Expense report with charts and filtering
- Income report with charts and filtering
- Expense vs Income comparison report
- Financial statement showing assets and liabilities
- Transaction history with search and filtering
- Responsive design (desktop and mobile)

### 6.2 Out of Scope for MVP

- Email verification
- Multi-user/family accounts
- Real bank account integration
- Recurring transactions
- Split transactions
- Receipt/attachment uploads
- Budget setting and tracking
- Data export (PDF, CSV, Excel)
- Mobile native applications
- Offline mode
- Multi-language support
- Custom report builder
- API for third-party integrations

### 6.3 Development Timeline (7 weeks)

| Phase                     | Duration | Deliverables                                   |
| ------------------------- | -------- | ---------------------------------------------- |
| 1. Setup & Infrastructure | 1 week   | Project setup, database schema, authentication |
| 2. Account Management     | 1 week   | CRUD for financial accounts                    |
| 3. Transaction Management | 2 weeks  | CRUD for transactions, category management     |
| 4. Reporting & Analytics  | 2 weeks  | All report types with charts                   |
| 5. Testing & Refinement   | 1 week   | Bug fixes, performance optimization, UI polish |

---

## 7. Future Enhancements

### Phase 2 Features

- **Budget Management:** Set monthly/annual budgets per category with alerts
- **Recurring Transactions:** Automate regular income/expenses
- **Split Transactions:** Divide single transaction across multiple categories
- **Receipt Upload:** Attach images/PDFs to transactions
- **Data Export:** Export reports to PDF, CSV, Excel
- **Email Notifications:** Alerts for low balances, budget overruns

### Phase 3 Features

- **Family Accounts:** Multi-user access with roles and permissions
- **Bank Integration:** Automatic transaction import via API
- **Mobile Applications:** Native iOS and Android apps
- **Advanced Analytics:** Trend analysis, spending predictions
- **Investment Tracking:** Track stocks, mutual funds, crypto
- **Bill Reminders:** Notifications for upcoming bills
- **Tax Reports:** Generate tax-ready reports

### Long-term Vision

- AI-powered financial advice and insights
- Automated categorization of transactions
- Goal-based savings tracking
- Debt management and payoff planning
- Credit score monitoring
- Insurance tracking
- Retirement planning tools
- Integration with accounting software
- Multi-currency portfolio management
- Community features (anonymous spending comparisons)

---

## Document Information

**Last Updated:** February 2026  
**Document Owner:** Development Team  
**Status:** Draft - Ready for Implementation
