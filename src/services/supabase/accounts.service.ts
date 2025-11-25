import { BaseService } from './base.service';
import type { Account } from '../../types';

export class AccountsService extends BaseService {
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

    const accounts = await this.fetch<Account[]>(
      `/rest/v1/accounts?${params}`
    );

    return accounts[0] || null;
  }
}
