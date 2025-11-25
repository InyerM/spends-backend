import { BaseService } from './base.service';
import type { Transaction, CreateTransactionInput } from '../../types';

export class TransactionsService extends BaseService {
  async createTransaction(data: CreateTransactionInput): Promise<Transaction> {
    const transactions = await this.fetch<Transaction[]>(
      '/rest/v1/transactions',
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );

    return transactions[0];
  }

  async findSimilarTransaction(
    date: string,
    amount: number,
    description: string,
    accountId: string
  ): Promise<Transaction | null> {
    const descriptionQuery = description.substring(0, 20);

    const transactions = await this.fetch<Transaction[]>(
      `/rest/v1/transactions?` +
      `date=eq.${date}&` +
      `amount=eq.${amount}&` +
      `account_id=eq.${accountId}&` +
      `description=ilike.%${encodeURIComponent(descriptionQuery)}%&` +
      `select=*`
    );

    return transactions.length > 0 ? transactions[0] : null;
  }
}
