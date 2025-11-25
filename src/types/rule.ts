import { TransactionType } from './transaction';

export interface AutomationRuleConditions {
  description_contains?: string[];
  description_regex?: string;
  amount_between?: [number, number];
  amount_equals?: number;
  from_account?: string;
  to_account?: string;
  source?: string[];
  category?: string;
}

export interface AutomationRuleActions {
  set_type?: TransactionType;
  set_category?: string | null;
  link_to_account?: string;
  auto_reconcile?: boolean;
  add_note?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  is_active: boolean;
  priority: number;
  conditions: AutomationRuleConditions;
  actions: AutomationRuleActions;
  created_at: string;
  updated_at: string;
}
