-- ====================================
-- ADD CREDIT ACCOUNT TYPE
-- ====================================

-- Update the CHECK constraint to include 'credit' type
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_type_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_type_check 
  CHECK (type IN ('checking', 'savings', 'credit_card', 'cash', 'investment', 'crypto', 'credit'));

COMMENT ON COLUMN accounts.type IS 'Account type: checking, savings, credit_card, cash, investment, crypto, credit (for loans/credits)';
