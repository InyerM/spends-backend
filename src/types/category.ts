export type CategoryType = 'expense' | 'income' | 'transfer';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  parent_id: string | null;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
}
