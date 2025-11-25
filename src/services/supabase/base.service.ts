export abstract class BaseService {
  protected url: string;
  protected headers: Record<string, string>;

  constructor(url: string, serviceKey: string) {
    this.url = url;
    this.headers = {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  protected async fetch<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.url}${endpoint}`, {
      ...options,
      headers: { ...this.headers, ...options?.headers }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.statusText} - ${error}`);
    }

    return await response.json();
  }
}
