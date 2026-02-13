# Database Schema - PocketMate

## Entity Relationship Overview

```
user_account (1) ──────< financial_account (N)
user_account (1) ──────< transaction (N)
user_account (1) ──────< expense_categories (N)
user_account (1) ──────< income_categories (N)
user_account (1) ──────< counterparty (N)

financial_account (1) ──────< transaction.from_account_id (N)
financial_account (1) ──────< transaction.to_account_id (N)

expense_categories (1) ──────< expense_categories.parent_category_id (N) [self-reference]
expense_categories (1) ──────< transaction (N)
income_categories (1) ──────< transaction (N)
counterparty (1) ──────< transaction (N)
```

---

## Table Definitions

### user_account

Stores user authentication and profile information.

| Column     | Type         | Constraints      | Description                |
| ---------- | ------------ | ---------------- | -------------------------- |
| id         | UUID         | PRIMARY KEY      | Unique identifier          |
| user_name  | VARCHAR(100) | UNIQUE, NOT NULL | Username for login         |
| password   | VARCHAR(255) | NOT NULL         | Hashed password            |
| is_active  | BOOLEAN      | DEFAULT TRUE     | Account status             |
| created_at | TIMESTAMP    | DEFAULT NOW()    | Account creation timestamp |
| updated_at | TIMESTAMP    | DEFAULT NOW()    | Last update timestamp      |

**Indexes:**

- PRIMARY KEY on `id`
- UNIQUE on `user_name`

---

### financial_account

Stores financial accounts (bank, credit card, cash, e-wallet).

| Column     | Type         | Constraints           | Description                               |
| ---------- | ------------ | --------------------- | ----------------------------------------- |
| id         | UUID         | PRIMARY KEY           | Unique identifier                         |
| user_id    | UUID         | FOREIGN KEY, NOT NULL | References user_account(id)               |
| type       | VARCHAR(50)  | NOT NULL, CHECK       | Bank Account, Credit Card, E-wallet, Cash, Others |
| name       | VARCHAR(200) | NOT NULL              | Account name                              |
| currency   | VARCHAR(10)  | NOT NULL              | Currency code (VND, USD, EUR, etc.)       |
| created_at | TIMESTAMP    | DEFAULT NOW()         | Creation timestamp                        |
| updated_at | TIMESTAMP    | DEFAULT NOW()         | Last update timestamp                     |

**Indexes:**

- PRIMARY KEY on `id`
- INDEX on `user_id`

**Constraints:**

- CHECK (type IN ('Bank Account', 'Credit Card', 'E-wallet', 'Cash', 'Others'))
- FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE

---

### expense_categories

Stores expense category hierarchy (parent-child structure).

| Column             | Type         | Constraints           | Description                          |
| ------------------ | ------------ | --------------------- | ------------------------------------ |
| id                 | UUID         | PRIMARY KEY           | Unique identifier                    |
| user_id            | UUID         | FOREIGN KEY, NULLABLE | NULL for default, user ID for custom |
| name               | VARCHAR(200) | NOT NULL              | Category name                        |
| parent_category_id | UUID         | FOREIGN KEY, NULLABLE | References expense_categories(id)    |
| created_at         | TIMESTAMP    | DEFAULT NOW()         | Creation timestamp                   |

**Indexes:**

- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `parent_category_id`

**Constraints:**

- FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE
- FOREIGN KEY (parent_category_id) REFERENCES expense_categories(id) ON DELETE CASCADE

**Business Rules:**

- `user_id` NULL = default category (available to all users)
- `user_id` NOT NULL = custom category (specific to user)
- Maximum 2-level hierarchy (parent → child only)

---

### income_categories

Stores income categories.

| Column     | Type         | Constraints           | Description                          |
| ---------- | ------------ | --------------------- | ------------------------------------ |
| id         | UUID         | PRIMARY KEY           | Unique identifier                    |
| user_id    | UUID         | FOREIGN KEY, NULLABLE | NULL for default, user ID for custom |
| name       | VARCHAR(200) | NOT NULL              | Category name                        |
| created_at | TIMESTAMP    | DEFAULT NOW()         | Creation timestamp                   |

**Indexes:**

- PRIMARY KEY on `id`
- INDEX on `user_id`

**Constraints:**

- FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE

**Business Rules:**

- `user_id` NULL = default category (available to all users)
- `user_id` NOT NULL = custom category (specific to user)

---

### counterparty

Stores people/organizations user transacts with.

| Column     | Type         | Constraints           | Description                 |
| ---------- | ------------ | --------------------- | --------------------------- |
| id         | UUID         | PRIMARY KEY           | Unique identifier           |
| user_id    | UUID         | FOREIGN KEY, NOT NULL | References user_account(id) |
| name       | VARCHAR(200) | NOT NULL              | Counterparty name           |
| created_at | TIMESTAMP    | DEFAULT NOW()         | Creation timestamp          |

**Indexes:**

- PRIMARY KEY on `id`
- INDEX on `user_id`

**Constraints:**

- FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE

---

### transaction

Stores all financial transactions.

| Column              | Type          | Constraints           | Description                                              |
| ------------------- | ------------- | --------------------- | -------------------------------------------------------- |
| id                  | UUID          | PRIMARY KEY           | Unique identifier                                        |
| user_id             | UUID          | FOREIGN KEY, NOT NULL | References user_account(id)                              |
| type                | VARCHAR(50)   | NOT NULL, CHECK       | Expense, Income, Borrow, Transfer                        |
| from_account_id     | UUID          | FOREIGN KEY, NULLABLE | References financial_account(id)                         |
| to_account_id       | UUID          | FOREIGN KEY, NULLABLE | References financial_account(id)                         |
| amount              | DECIMAL(15,2) | NOT NULL              | Transaction amount                                       |
| currency            | VARCHAR(10)   | NOT NULL              | Transaction currency                                     |
| vnd_exchange        | DECIMAL(15,4) | NULLABLE              | Exchange rate for transfers between different currencies |
| expense_category_id | UUID          | FOREIGN KEY, NULLABLE | References expense_categories(id)                        |
| income_category_id  | UUID          | FOREIGN KEY, NULLABLE | References income_categories(id)                         |
| counterparty_id     | UUID          | FOREIGN KEY, NULLABLE | References counterparty(id)                              |
| payment_method      | VARCHAR(50)   | NULLABLE              | Cash, Credit card, Installment                           |
| date_time           | TIMESTAMP     | NOT NULL              | Transaction date and time                                |
| details             | TEXT          | NULLABLE              | Notes or description                                     |
| created_at          | TIMESTAMP     | DEFAULT NOW()         | Record creation timestamp                                |
| updated_at          | TIMESTAMP     | DEFAULT NOW()         | Last update timestamp                                    |

**Indexes:**

- PRIMARY KEY on `id`
- INDEX on `user_id`
- INDEX on `date_time`
- INDEX on `type`
- INDEX on `from_account_id`
- INDEX on `to_account_id`
- INDEX on `expense_category_id`
- INDEX on `income_category_id`

**Constraints:**

- CHECK (type IN ('Expense', 'Income', 'Transfer', 'Borrow'))
- FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE
- FOREIGN KEY (from_account_id) REFERENCES financial_account(id) ON DELETE SET NULL
- FOREIGN KEY (to_account_id) REFERENCES financial_account(id) ON DELETE SET NULL
- FOREIGN KEY (expense_category_id) REFERENCES expense_categories(id) ON DELETE SET NULL
- FOREIGN KEY (income_category_id) REFERENCES income_categories(id) ON DELETE SET NULL
- FOREIGN KEY (counterparty_id) REFERENCES counterparty(id) ON DELETE SET NULL

**Business Rules:**

- **Expense:** `from_account_id` required, `expense_category_id` required
- **Income:** `to_account_id` required, `income_category_id` required
- **Transfer:** Both `from_account_id` and `to_account_id` required
- **Borrow:** Either `from_account_id` or `to_account_id` required, `counterparty_id` required
- `vnd_exchange` only used when `from_account` and `to_account` have different currencies

---

## Complete SQL Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Account Table
CREATE TABLE user_account (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial Account Table
CREATE TABLE financial_account (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Bank Account', 'Credit Card', 'E-wallet', 'Cash', 'Others')),
    name VARCHAR(200) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense Categories Table (Parent-Child Structure)
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_account(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    parent_category_id UUID REFERENCES expense_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Income Categories Table
CREATE TABLE income_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_account(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Counterparty Table
CREATE TABLE counterparty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transaction Table
CREATE TABLE transaction (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Expense', 'Income', 'Transfer', 'Borrow')),
    from_account_id UUID REFERENCES financial_account(id) ON DELETE SET NULL,
    to_account_id UUID REFERENCES financial_account(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    vnd_exchange DECIMAL(15,4),
    expense_category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    income_category_id UUID REFERENCES income_categories(id) ON DELETE SET NULL,
    counterparty_id UUID REFERENCES counterparty(id) ON DELETE SET NULL,
    payment_method VARCHAR(50),
    date_time TIMESTAMP NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_transaction_user_id ON transaction(user_id);
CREATE INDEX idx_transaction_date_time ON transaction(date_time);
CREATE INDEX idx_transaction_type ON transaction(type);
CREATE INDEX idx_transaction_from_account ON transaction(from_account_id);
CREATE INDEX idx_transaction_to_account ON transaction(to_account_id);
CREATE INDEX idx_financial_account_user_id ON financial_account(user_id);
CREATE INDEX idx_expense_categories_user_id ON expense_categories(user_id);
CREATE INDEX idx_expense_categories_parent ON expense_categories(parent_category_id);
CREATE INDEX idx_income_categories_user_id ON income_categories(user_id);
CREATE INDEX idx_counterparty_user_id ON counterparty(user_id);

-- Updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply Trigger to Tables with updated_at
CREATE TRIGGER update_user_account_updated_at BEFORE UPDATE ON user_account
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_account_updated_at BEFORE UPDATE ON financial_account
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_updated_at BEFORE UPDATE ON transaction
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE user_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE counterparty ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own data
CREATE POLICY user_account_policy ON user_account
    FOR ALL USING (id = auth.uid());

CREATE POLICY financial_account_policy ON financial_account
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY transaction_policy ON transaction
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY expense_categories_policy ON expense_categories
    FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY income_categories_policy ON income_categories
    FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY counterparty_policy ON counterparty
    FOR ALL USING (user_id = auth.uid());
```

---

## Default Categories Seed Data

```sql
-- Insert Default Expense Parent Categories with fixed UUIDs for reference
INSERT INTO expense_categories (id, user_id, name, parent_category_id) VALUES
    ('11111111-1111-1111-1111-111111111111', NULL, 'Food & Drinks', NULL),
    ('22222222-2222-2222-2222-222222222222', NULL, 'Housing', NULL),
    ('33333333-3333-3333-3333-333333333333', NULL, 'Household', NULL),
    ('44444444-4444-4444-4444-444444444444', NULL, 'Transportation', NULL),
    ('55555555-5555-5555-5555-555555555555', NULL, 'Children', NULL),
    ('66666666-6666-6666-6666-666666666666', NULL, 'Health', NULL),
    ('77777777-7777-7777-7777-777777777777', NULL, 'Lifestyle', NULL),
    ('88888888-8888-8888-8888-888888888888', NULL, 'Family & Social', NULL),
    ('99999999-9999-9999-9999-999999999999', NULL, 'Personal Development', NULL),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 'Others', NULL);

-- Insert Default Expense Child Categories
INSERT INTO expense_categories (user_id, name, parent_category_id) VALUES
    -- Food & Drinks
    (NULL, 'Groceries', '11111111-1111-1111-1111-111111111111'),
    (NULL, 'Delivery', '11111111-1111-1111-1111-111111111111'),
    (NULL, 'Dining Out', '11111111-1111-1111-1111-111111111111'),
    (NULL, 'Junk Food', '11111111-1111-1111-1111-111111111111'),
    (NULL, 'Coffee & Drinks', '11111111-1111-1111-1111-111111111111'),
    
    -- Housing
    (NULL, 'Rent/Mortgage', '22222222-2222-2222-2222-222222222222'),
    (NULL, 'Utilities', '22222222-2222-2222-2222-222222222222'),
    (NULL, 'Furniture & Appliances', '22222222-2222-2222-2222-222222222222'),
    (NULL, 'Property management fee', '22222222-2222-2222-2222-222222222222'),
    (NULL, 'Home maintenance', '22222222-2222-2222-2222-222222222222'),
    
    -- Household
    (NULL, 'Household Supplies', '33333333-3333-3333-3333-333333333333'),
    (NULL, 'Helper', '33333333-3333-3333-3333-333333333333'),
    
    -- Transportation
    (NULL, 'Fuel', '44444444-4444-4444-4444-444444444444'),
    (NULL, 'Taxi & Public Transportation', '44444444-4444-4444-4444-444444444444'),
    (NULL, 'Parking & Toll', '44444444-4444-4444-4444-444444444444'),
    (NULL, 'Vehicle maintenance', '44444444-4444-4444-4444-444444444444'),
    
    -- Children
    (NULL, 'Tuition fee', '55555555-5555-5555-5555-555555555555'),
    (NULL, 'Education supplies', '55555555-5555-5555-5555-555555555555'),
    (NULL, 'Toys', '55555555-5555-5555-5555-555555555555'),
    
    -- Health
    (NULL, 'Medical checkups', '66666666-6666-6666-6666-666666666666'),
    (NULL, 'Medications', '66666666-6666-6666-6666-666666666666'),
    (NULL, 'Sports & Fitness', '66666666-6666-6666-6666-666666666666'),
    
    -- Lifestyle
    (NULL, 'Travel', '77777777-7777-7777-7777-777777777777'),
    (NULL, 'Entertainment & Leisure', '77777777-7777-7777-7777-777777777777'),
    (NULL, 'Beauty & Self-care', '77777777-7777-7777-7777-777777777777'),
    
    -- Family & Social
    (NULL, 'Gifts', '88888888-8888-8888-8888-888888888888'),
    (NULL, 'Weddings & Funerals', '88888888-8888-8888-8888-888888888888'),
    (NULL, 'Holiday & Festivals (Tet...)', '88888888-8888-8888-8888-888888888888'),
    (NULL, 'Family gatherings', '88888888-8888-8888-8888-888888888888'),
    (NULL, 'Social gatherings', '88888888-8888-8888-8888-888888888888'),
    
    -- Personal Development
    (NULL, 'Courses & Training', '99999999-9999-9999-9999-999999999999'),
    (NULL, 'Books', '99999999-9999-9999-9999-999999999999'),
    (NULL, 'Subscriptions', '99999999-9999-9999-9999-999999999999'),
    
    -- Others
    (NULL, 'Other', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Insert Default Income Categories
INSERT INTO income_categories (user_id, name) VALUES
    (NULL, 'Salary'),
    (NULL, 'Freelance'),
    (NULL, 'Investment'),
    (NULL, 'House rent'),
    (NULL, 'Other');
```

---

## Notes

- All tables use UUID as primary keys for better security and distributed system compatibility
- Row Level Security (RLS) ensures users can only access their own data
- Default categories have `user_id = NULL` to indicate they're system-wide
- Custom categories have `user_id` set to the creating user's ID
- The `updated_at` timestamp is automatically maintained via triggers
- Foreign keys use `ON DELETE CASCADE` for owned data and `ON DELETE SET NULL` for references
