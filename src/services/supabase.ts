import type { Account, Category, Transaction, CreateTransactionInput, AutomationRule } from '../types';

export class SupabaseClient {
  private url: string;
  private headers: Record<string, string>;

  constructor(url: string, serviceKey: string) {
    this.url = url;
    this.headers = {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  /**
   * Get account by institution and optional last_four
   */
  async getAccount(
    institution: string, 
    lastFour?: string | null
  ): Promise<Account | null> {
    const params = new URLSearchParams({
      institution: `eq.${institution}`,
      is_active: 'eq.true',
      select: '*'
    });
    
    if (lastFour) {
      params.append('last_four', `eq.${lastFour}`);
    }

    console.log(params.toString());
    
    const response = await fetch(
      `${this.url}/rest/v1/accounts?${params}`,
      { headers: this.headers }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get account: ${response.statusText}`);
    }
    
    const accounts: Account[] = await response.json();
    return accounts[0] || null;
  }

  /**
   * Get category by name
   */
  async getCategory(name: string): Promise<Category | null> {
    const response = await fetch(
      `${this.url}/rest/v1/categories?name=eq.${encodeURIComponent(name)}&is_active=eq.true&select=*`,
      { headers: this.headers }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get category: ${response.statusText}`);
    }
    
    const categories: Category[] = await response.json();
    return categories[0] || null;
  }

  /**
   * Create new transaction
   */
  async createTransaction(data: CreateTransactionInput): Promise<Transaction> {
    const response = await fetch(`${this.url}/rest/v1/transactions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create transaction: ${error}`);
    }
    
    const transactions: Transaction[] = await response.json();
    return transactions[0];
  }

  /**
   * Find similar transaction (for duplicate detection)
   */
  async findSimilarTransaction(
    date: string,
    amount: number,
    description: string,
    accountId: string
  ): Promise<Transaction | null> {
    const descriptionQuery = description.substring(0, 20);
    
    const response = await fetch(
      `${this.url}/rest/v1/transactions?` +
      `date=eq.${date}&` +
      `amount=eq.${amount}&` +
      `account_id=eq.${accountId}&` +
      `description=ilike.%${encodeURIComponent(descriptionQuery)}%&` +
      `select=*`,
      { headers: this.headers }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to find similar transaction: ${response.statusText}`);
    }
    
    const transactions: Transaction[] = await response.json();
    return transactions.length > 0 ? transactions[0] : null;
  }

  /**
   * Get all active automation rules
   */
  async getAutomationRules(): Promise<AutomationRule[]> {
    const response = await fetch(
      `${this.url}/rest/v1/automation_rules?is_active=eq.true&order=priority.desc&select=*`,
      { headers: this.headers }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get automation rules: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Apply automation rules to transaction
   */
  async applyAutomationRules(transaction: CreateTransactionInput): Promise<CreateTransactionInput> {
    const rules = await this.getAutomationRules();
    
    for (const rule of rules) {
      if (this.matchesConditions(transaction, rule.conditions)) {
        transaction = this.applyActions(transaction, rule.actions);
        console.log(`[Rule Applied] ${rule.name}`);
      }
    }
    
    return transaction;
  }

  /**
   * Check if transaction matches rule conditions
   */
  private matchesConditions(
    transaction: CreateTransactionInput,
    conditions: AutomationRule['conditions']
  ): boolean {
    // Description contains
    if (conditions.description_contains) {
      const desc = transaction.description.toLowerCase();
      const matches = conditions.description_contains.some((keyword: string) =>
        desc.includes(keyword.toLowerCase())
      );
      if (!matches) return false;
    }
    
    // Description regex
    if (conditions.description_regex) {
      const regex = new RegExp(conditions.description_regex, 'i');
      if (!regex.test(transaction.description)) return false;
    }
    
    // Amount between
    if (conditions.amount_between) {
      const [min, max] = conditions.amount_between;
      if (transaction.amount < min || transaction.amount > max) {
        return false;
      }
    }
    
    // Amount equals
    if (conditions.amount_equals !== undefined) {
      if (transaction.amount !== conditions.amount_equals) {
        return false;
      }
    }
    
    // From account
    if (conditions.from_account) {
      if (transaction.account_id !== conditions.from_account) {
        return false;
      }
    }
    
    // Source
    if (conditions.source) {
      if (!conditions.source.includes(transaction.source)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Apply rule actions to transaction
   */
  private applyActions(
    transaction: CreateTransactionInput,
    actions: AutomationRule['actions']
  ): CreateTransactionInput {
    if (actions.set_type) {
      transaction.type = actions.set_type;
    }
    
    if (actions.set_category !== undefined) {
      transaction.category_id = actions.set_category || undefined;
    }
    
    if (actions.link_to_account) {
      transaction.transfer_to_account_id = actions.link_to_account;
      transaction.transfer_id = crypto.randomUUID();
    }
    
    if (actions.add_note) {
      transaction.notes = transaction.notes 
        ? `${transaction.notes}\n${actions.add_note}`
        : actions.add_note;
    }
    
    return transaction;
  }
}
