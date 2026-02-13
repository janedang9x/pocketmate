-- Default categories seed data
-- Updated to match specifications.md FR-CAT-001

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
