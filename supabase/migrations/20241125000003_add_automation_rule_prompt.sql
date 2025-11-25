-- ====================================
-- ADD DYNAMIC PROMPT FIELDS TO AUTOMATION RULES
-- ====================================

-- Add prompt fields to automation_rules
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS prompt_text TEXT;
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS match_phone VARCHAR(15);
ALTER TABLE automation_rules ADD COLUMN IF NOT EXISTS transfer_to_account_id UUID REFERENCES accounts(id);

-- Add index for phone lookups
CREATE INDEX IF NOT EXISTS idx_automation_rules_phone ON automation_rules(match_phone) 
WHERE match_phone IS NOT NULL;

-- Add index for active rules with prompts
CREATE INDEX IF NOT EXISTS idx_automation_rules_active_prompt ON automation_rules(is_active) 
WHERE prompt_text IS NOT NULL;

COMMENT ON COLUMN automation_rules.prompt_text IS 'Custom prompt text to inject into Gemini for this rule';
COMMENT ON COLUMN automation_rules.match_phone IS 'Phone number to match for transfer detection (10 digits)';
COMMENT ON COLUMN automation_rules.transfer_to_account_id IS 'Target account for internal transfers';
