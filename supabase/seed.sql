-- Default categories seed data

-- Insert Default Expense Parent Categories with fixed UUIDs for reference
INSERT INTO expense_categories (id, user_id, name, parent_category_id) VALUES
    ('11111111-1111-1111-1111-111111111111', NULL, 'Bills & Utilities', NULL),
    ('22222222-2222-2222-2222-222222222222', NULL, 'Coffee & Drinks', NULL),
    ('33333333-3333-3333-3333-333333333333', NULL, 'Dining', NULL),
    ('44444444-4444-4444-4444-444444444444', NULL, 'Education', NULL),
    ('55555555-5555-5555-5555-555555555555', NULL, 'Entertainment & Leisure', NULL),
    ('66666666-6666-6666-6666-666666666666', NULL, 'Fitness & Sports', NULL),
    ('77777777-7777-7777-7777-777777777777', NULL, 'Gifts & Donations', NULL),
    ('88888888-8888-8888-8888-888888888888', NULL, 'Groceries', NULL),
    ('99999999-9999-9999-9999-999999999999', NULL, 'Healthcare', NULL),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 'Home & Garden', NULL),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, 'Kids', NULL),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', NULL, 'Lifestyle', NULL),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', NULL, 'Personal Care', NULL),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NULL, 'Pets', NULL),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', NULL, 'Shopping', NULL),
    ('00000000-0000-0000-0000-000000000000', NULL, 'Transportation', NULL);

-- Insert Default Expense Child Categories
INSERT INTO expense_categories (user_id, name, parent_category_id) VALUES
    -- Bills & Utilities
    (NULL, 'Electricity', '11111111-1111-1111-1111-111111111111'),
    (NULL, 'Water', '11111111-1111-1111-1111-111111111111'),
    (NULL, 'Gas', '11111111-1111-1111-1111-111111111111'),
    (NULL, 'Internet', '11111111-1111-1111-1111-111111111111'),
    (NULL, 'Phone', '11111111-1111-1111-1111-111111111111'),
    
    -- Coffee & Drinks
    (NULL, 'Coffee', '22222222-2222-2222-2222-222222222222'),
    (NULL, 'Tea', '22222222-2222-2222-2222-222222222222'),
    (NULL, 'Juice', '22222222-2222-2222-2222-222222222222'),
    (NULL, 'Soft drinks', '22222222-2222-2222-2222-222222222222'),
    
    -- Dining
    (NULL, 'Restaurants', '33333333-3333-3333-3333-333333333333'),
    (NULL, 'Fast food', '33333333-3333-3333-3333-333333333333'),
    (NULL, 'Café', '33333333-3333-3333-3333-333333333333'),
    (NULL, 'Bar', '33333333-3333-3333-3333-333333333333'),
    
    -- Education
    (NULL, 'Tuition', '44444444-4444-4444-4444-444444444444'),
    (NULL, 'Books & Supplies', '44444444-4444-4444-4444-444444444444'),
    (NULL, 'Courses & Training', '44444444-4444-4444-4444-444444444444'),
    
    -- Entertainment & Leisure
    (NULL, 'Movies', '55555555-5555-5555-5555-555555555555'),
    (NULL, 'Concerts', '55555555-5555-5555-5555-555555555555'),
    (NULL, 'Games', '55555555-5555-5555-5555-555555555555'),
    (NULL, 'Hobbies & Interests', '55555555-5555-5555-5555-555555555555'),
    (NULL, 'Travel', '55555555-5555-5555-5555-555555555555'),
    (NULL, 'Parking & Toll', '55555555-5555-5555-5555-555555555555'),
    
    -- Fitness & Sports
    (NULL, 'Gym membership', '66666666-6666-6666-6666-666666666666'),
    (NULL, 'Equipment', '66666666-6666-6666-6666-666666666666'),
    
    -- Gifts & Donations
    (NULL, 'Gifts', '77777777-7777-7777-7777-777777777777'),
    (NULL, 'Charity', '77777777-7777-7777-7777-777777777777'),
    
    -- Groceries
    (NULL, 'Supermarket', '88888888-8888-8888-8888-888888888888'),
    (NULL, 'Fresh produce', '88888888-8888-8888-8888-888888888888'),
    (NULL, 'Meat & Seafood', '88888888-8888-8888-8888-888888888888'),
    
    -- Healthcare
    (NULL, 'Medications', '99999999-9999-9999-9999-999999999999'),
    (NULL, 'Doctor visits', '99999999-9999-9999-9999-999999999999'),
    (NULL, 'Insurance', '99999999-9999-9999-9999-999999999999'),
    
    -- Home & Garden
    (NULL, 'Furniture & Appliances', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    (NULL, 'Repairs', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    (NULL, 'Decor', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    (NULL, 'Garden supplies', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    
    -- Kids
    (NULL, 'Toys', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    (NULL, 'Childcare', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    (NULL, 'School supplies', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    
    -- Lifestyle
    (NULL, 'Clothing', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
    (NULL, 'Beauty & Self-care', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
    
    -- Personal Care
    (NULL, 'Haircuts & Grooming', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
    (NULL, 'Skincare', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
    (NULL, 'Wellness', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
    
    -- Pets
    (NULL, 'Pet food', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
    (NULL, 'Veterinary', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
    (NULL, 'Pet supplies', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
    
    -- Shopping
    (NULL, 'Electronics', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
    (NULL, 'Books', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
    (NULL, 'Holidays & Festivals', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
    (NULL, 'Events gatherings', 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
    
    -- Transportation
    (NULL, 'Fuel', '00000000-0000-0000-0000-000000000000'),
    (NULL, 'Public transit', '00000000-0000-0000-0000-000000000000'),
    (NULL, 'Taxi/Ride-share', '00000000-0000-0000-0000-000000000000'),
    (NULL, 'Vehicle maintenance', '00000000-0000-0000-0000-000000000000');

-- Insert Default Income Categories
INSERT INTO income_categories (user_id, name) VALUES
    (NULL, 'Salary'),
    (NULL, 'Freelance'),
    (NULL, 'Investment'),
    (NULL, 'House rent'),
    (NULL, 'Other');
