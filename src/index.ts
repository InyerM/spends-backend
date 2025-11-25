import { handleTelegram } from './handlers/telegram';
import { handleEmail } from './handlers/email';
import { handleTransaction } from './handlers/transaction';
import { Env } from './types/env';

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Telegram Webhook
    if (request.method === 'POST' && url.pathname === '/telegram') {
      return handleTelegram(request, env);
    }

    // Endpoint para emails desde Gmail Apps Script
    if (url.pathname === '/email' && request.method === 'POST') {
      return handleEmail(request, env);
    }

    // Generic Transaction API
    if (url.pathname === '/transaction' && request.method === 'POST') {
      return handleTransaction(request, env);
    }

    // Health check
    if (url.pathname === '/') {
      return new Response('Expense Assistant Bot is running!', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  },

  // Cron Triggers
  async scheduled(_event: ScheduledEvent, _env: Env, _ctx: ExecutionContext) {
    // Implement daily summary here
    console.log("Cron triggered");
  }
};
