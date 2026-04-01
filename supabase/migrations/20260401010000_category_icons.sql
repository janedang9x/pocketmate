ALTER TABLE expense_categories
ADD COLUMN icon TEXT;

ALTER TABLE income_categories
ADD COLUMN icon TEXT;

UPDATE expense_categories
SET icon = CASE name
  WHEN 'Food & Drinks' THEN 'utensils'
  WHEN 'Groceries' THEN 'shopping-basket'
  WHEN 'Delivery' THEN 'receipt'
  WHEN 'Dining Out' THEN 'utensils'
  WHEN 'Junk Food' THEN 'coffee'
  WHEN 'Coffee & Drinks' THEN 'coffee'
  WHEN 'Housing' THEN 'home'
  WHEN 'Rent/Mortgage' THEN 'home'
  WHEN 'Utilities' THEN 'receipt'
  WHEN 'Furniture & Appliances' THEN 'home'
  WHEN 'Property management fee' THEN 'receipt'
  WHEN 'Home maintenance' THEN 'wrench'
  WHEN 'Household' THEN 'home'
  WHEN 'Household Supplies' THEN 'shopping-basket'
  WHEN 'Helper' THEN 'briefcase'
  WHEN 'Transportation' THEN 'car'
  WHEN 'Fuel' THEN 'car'
  WHEN 'Taxi & Public Transportation' THEN 'bus'
  WHEN 'Parking & Toll' THEN 'receipt'
  WHEN 'Vehicle maintenance' THEN 'wrench'
  WHEN 'Children' THEN 'graduation'
  WHEN 'Tuition fee' THEN 'graduation'
  WHEN 'Education supplies' THEN 'book'
  WHEN 'Toys' THEN 'gift'
  WHEN 'Health' THEN 'heart'
  WHEN 'Medical checkups' THEN 'heart'
  WHEN 'Medications' THEN 'heart'
  WHEN 'Sports & Fitness' THEN 'dumbbell'
  WHEN 'Lifestyle' THEN 'sparkles'
  WHEN 'Travel' THEN 'plane'
  WHEN 'Entertainment & Leisure' THEN 'sparkles'
  WHEN 'Beauty & Self-care' THEN 'sparkles'
  WHEN 'Family & Social' THEN 'gift'
  WHEN 'Gifts' THEN 'gift'
  WHEN 'Weddings & Funerals' THEN 'gift'
  WHEN 'Holiday & Festivals (Tet...)' THEN 'gift'
  WHEN 'Family gatherings' THEN 'home'
  WHEN 'Social gatherings' THEN 'briefcase'
  WHEN 'Personal Development' THEN 'book'
  WHEN 'Courses & Training' THEN 'graduation'
  WHEN 'Books' THEN 'book'
  WHEN 'Subscriptions' THEN 'receipt'
  WHEN 'Others' THEN 'tag'
  WHEN 'Other' THEN 'tag'
  ELSE 'tag'
END
WHERE user_id IS NULL;

UPDATE income_categories
SET icon = CASE name
  WHEN 'Salary' THEN 'briefcase'
  WHEN 'Freelance' THEN 'wallet'
  WHEN 'Investment' THEN 'landmark'
  WHEN 'House rent' THEN 'home'
  WHEN 'Other' THEN 'tag'
  ELSE 'tag'
END
WHERE user_id IS NULL;
