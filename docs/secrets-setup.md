# Configuración de Secretos (Producción)

Ejecuta estos comandos en tu terminal para configurar las variables sensibles en Cloudflare. 
Te pedirá el valor para cada una.

```bash
# Telegram
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_BOT_USERNAME
npx wrangler secret put YOUR_CHAT_ID

# Gemini
npx wrangler secret put GEMINI_API_KEY

# Google Sheets
npx wrangler secret put GOOGLE_SHEET_ID
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
npx wrangler secret put GOOGLE_CREDENTIALS_JSON
```

> **Nota:** Para `GOOGLE_CREDENTIALS_JSON`, asegúrate de pegar el contenido MINIFICADO (todo en una línea) del JSON de tu service account, o su versión en base64 si así lo implementaste.

---

# Configuración Local (.dev.vars)

Para desarrollo local (`npm run dev`), asegúrate de tener un archivo `.dev.vars` en la raíz del proyecto con este formato:

```ini
TELEGRAM_BOT_TOKEN=tu_token
TELEGRAM_BOT_USERNAME=tu_usuario
YOUR_CHAT_ID=tu_chat_id
GEMINI_API_KEY=tu_api_key
GOOGLE_SHEET_ID=tu_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu_email
GOOGLE_CREDENTIALS_JSON=tu_json_en_una_linea
```
