-- ====================================
-- ACCOUNTS TABLE
-- ====================================
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('checking', 'savings', 'credit_card', 'cash', 'investment', 'crypto')),
  institution VARCHAR(100), -- 'bancolombia', 'nequi', 'daviplata', etc
  last_four VARCHAR(4),
  currency VARCHAR(3) DEFAULT 'COP',
  balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  color VARCHAR(7),
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- CATEGORIES TABLE
-- ====================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  icon VARCHAR(50),
  color VARCHAR(7),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- TRANSACTIONS TABLE
-- ====================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  date DATE NOT NULL,
  time TIME NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  notes TEXT,
  
  -- Classification
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  
  -- Metadata
  type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  payment_method VARCHAR(50),
  source VARCHAR(50) NOT NULL,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  
  -- Inter-account transfers
  transfer_to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  transfer_id UUID,
  
  -- Reconciliation
  is_reconciled BOOLEAN DEFAULT false,
  reconciled_at TIMESTAMPTZ,
  reconciliation_id UUID,
  
  -- Audit trail
  raw_text TEXT,
  parsed_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- AUTOMATION RULES TABLE
-- ====================================
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  -- Conditions as JSON
  conditions JSONB NOT NULL,
  
  -- Actions as JSON
  actions JSONB NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- RECONCILIATIONS TABLE
-- ====================================
CREATE TABLE reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  
  -- Period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Balances
  starting_balance DECIMAL(15,2) NOT NULL,
  ending_balance DECIMAL(15,2) NOT NULL,
  statement_balance DECIMAL(15,2) NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  difference DECIMAL(15,2),
  
  -- Metadata
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- IMPORTS TABLE
-- ====================================
CREATE TABLE imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(100) NOT NULL,
  filename VARCHAR(255),
  total_rows INTEGER,
  imported_rows INTEGER,
  failed_rows INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  error_log JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- INDEXES
-- ====================================
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_source ON transactions(source);
CREATE INDEX idx_transactions_reconciled ON transactions(is_reconciled);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_transfer_id ON transactions(transfer_id) WHERE transfer_id IS NOT NULL;

-- ====================================
-- TRIGGERS
-- ====================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accounts_updated_at 
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER transactions_updated_at 
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER automation_rules_updated_at 
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ====================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================
-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to accounts" ON accounts
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role has full access to categories" ON categories
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role has full access to transactions" ON transactions
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role has full access to automation_rules" ON automation_rules
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role has full access to reconciliations" ON reconciliations
  FOR ALL TO service_role USING (true);

CREATE POLICY "Service role has full access to imports" ON imports
  FOR ALL TO service_role USING (true);
