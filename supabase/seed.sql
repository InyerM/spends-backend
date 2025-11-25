-- ====================================
-- SEED DATA
-- ====================================

-- Insert default accounts
INSERT INTO accounts (name, type, institution, last_four, color, icon) VALUES
('Bancolombia Checking', 'checking', 'bancolombia', '7799', '#FFCC00', '💳'),
('Nequi', 'savings', 'nequi', NULL, '#8B5CF6', '💜'),
('Cash', 'cash', NULL, NULL, '#10B981', '💵'),
('Bancolombia Credit Card', 'credit_card', 'bancolombia', '1234', '#EF4444', '💳');

-- Insert default categories
INSERT INTO categories (name, type, icon, color) VALUES
-- Expenses
('Food', 'expense', '🍔', '#F59E0B'),
('Transportation', 'expense', '🚗', '#3B82F6'),
('Entertainment', 'expense', '🎮', '#8B5CF6'),
('Shopping', 'expense', '🛒', '#EC4899'),
('Utilities', 'expense', '💡', '#06B6D4'),
('Health', 'expense', '🏥', '#EF4444'),
('Education', 'expense', '📚', '#10B981'),
('Home', 'expense', '🏠', '#F97316'),
('Technology', 'expense', '💻', '#6366F1'),
('Subscriptions', 'expense', '📱', '#A855F7'),
('Other', 'expense', '📦', '#6B7280'),
-- Income
('Salary', 'income', '💰', '#10B981'),
('Freelance', 'income', '💼', '#14B8A6'),
('Investment', 'income', '📈', '#059669'),
-- Transfers
('Transfer', 'transfer', '↔️', '#6B7280');

-- Insert automation rule for Bancolombia → Nequi transfers
INSERT INTO automation_rules (name, priority, conditions, actions) 
SELECT 
  'Detect Bancolombia to Nequi Transfer',
  100,
  jsonb_build_object(
    'description_contains', ARRAY['transferencia', 'envío', 'enviaste', 'transfer'],
    'from_account', bancolombia.id
  ),
  jsonb_build_object(
    'set_type', 'transfer',
    'set_category', transfer_cat.id,
    'link_to_account', nequi.id,
    'auto_reconcile', true
  )
FROM 
  accounts bancolombia,
  accounts nequi,
  categories transfer_cat
WHERE 
  bancolombia.institution = 'bancolombia' 
  AND bancolombia.type = 'checking'
  AND nequi.institution = 'nequi'
  AND transfer_cat.name = 'Transfer';
