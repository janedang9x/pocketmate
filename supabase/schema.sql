-- PocketMate database schema
-- Source: docs/database-schema.md

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
