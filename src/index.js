import { handleTelegram } from './handlers/telegram.js';
import { handleEmail } from './handlers/email.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Telegram Webhook
    if (request.method === 'POST' && url.pathname === '/telegram') {
      return handleTelegram(request, env);
    }

    // Endpoint para emails desde Gmail Apps Script
    if (url.pathname === '/email' && request.method === 'POST') {
      return handleEmail(request, env);
    }

    // Health check
    if (url.pathname === '/') {
      return new Response('Expense Assistant Bot is running!', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  },

  // Cron Triggers
  async scheduled(event, env, ctx) {
    // Implement daily summary here
    console.log("Cron triggered");
  }
};
