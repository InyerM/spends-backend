const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { webcrypto } = require('crypto');

// Polyfill crypto for the copied functions if needed, though modern Node has global crypto
// We explicitly use webcrypto to match the browser API style used in sheets.js
const crypto = webcrypto;

async function importCSV(csvPath, credentials, sheetId) {
  try {
    // 1. Leer CSV
    console.log(`📖 Leyendo archivo: ${csvPath}`);
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`📊 Encontrados ${records.length} registros`);
    
    // 2. Convertir a formato de nuestra tabla
    const rows = records.map(record => {
      // Budget Bakers export format: Date,Amount,Category,Account,Note,Labels
      // Amount is negative for expenses, we want positive
      const amount = Math.abs(parseFloat(record.Amount));
      
      // Date format in CSV is usually YYYY-MM-DD or DD.MM.YYYY depending on locale
      // Assuming YYYY-MM-DD based on user request, but let's be robust
      const date = new Date(record.Date);
      
      // Formatear fecha DD/MM/YYYY
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const fechaFormateada = `${day}/${month}/${year}`;
      
      // Hora (Budget Bakers no la tiene, usar 12:00)
      const hora = '12:00:00';
      
      // Mapear categoría
      const categoria = mapCategory(record.Category);
      
      // Mapear banco
      const banco = mapAccount(record.Account);
      
      // Note + Labels
      let descripcion = record.Note || record.Category;
      if (record.Labels) {
        descripcion += ` (${record.Labels})`;
      }

      return [
        fechaFormateada,
        hora,
        amount,
        capitalize(descripcion),
        capitalize(categoria),
        capitalize(banco),
        'Efectivo', // tipo_pago por defecto si no se sabe
        'Importado' // fuente
      ];
    });
    
    if (rows.length > 0) {
      console.log(`📝 Muestra de datos (primera fila):`);
      console.log(rows[0]);
    }
    
    // 3. Autenticar con Google
    console.log('🔐 Autenticando con Google...');
    const accessToken = await getAccessToken(
      credentials.client_email,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    
    // 4. Insertar en batch
    const batchSize = 100;
    console.log(`🚀 Iniciando carga en lotes de ${batchSize}...`);
    
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      // Append to 'Todos' sheet, columns A:H
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Todos!A:H:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values: batch })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en lote ${i}: ${response.status} - ${errorText}`);
      }
      
      console.log(`✅ Insertados ${Math.min(i + batchSize, rows.length)}/${rows.length}`);
    }
    
    console.log('🎉 Importación completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

function mapCategory(budgetBakersCategory) {
  // Ajustar estos mapeos según tus categorías reales en Sheets
  const mapping = {
    'Food & Drink': 'comida',
    'Restaurants': 'comida',
    'Groceries': 'mercado',
    'Transport': 'transporte',
    'Shopping': 'compras',
    'Entertainment': 'entretenimiento',
    'Health': 'salud',
    'Bills & Utilities': 'servicios',
    'Education': 'educacion',
    'Home': 'hogar',
    'Rent': 'arriendo',
    'Salary': 'salario',
    'Fitness': 'deporte',
    'Travel': 'viajes'
  };
  
  return mapping[budgetBakersCategory] || 'otros';
}

function mapAccount(accountName) {
  const lower = accountName.toLowerCase();
  if (lower.includes('bancolombia')) return 'bancolombia';
  if (lower.includes('nequi')) return 'nequi';
  if (lower.includes('daviplata')) return 'daviplata';
  if (lower.includes('cash') || lower.includes('efectivo')) return 'efectivo';
  if (lower.includes('credit') || lower.includes('tc')) return 'tc';
  return 'otro';
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// --- Auth Functions (Adapted from src/services/sheets.js) ---

async function getAccessToken(clientEmail, privateKey, scopes) {
  const jwt = await createSignedJWT(clientEmail, privateKey, scopes);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token fetch failed: ${response.status} - ${text}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function createSignedJWT(email, pemKey, scopes) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: email,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaim = base64UrlEncode(JSON.stringify(claim));
  const unsignedToken = `${encodedHeader}.${encodedClaim}`;

  const signature = await signWithPrivateKey(unsignedToken, pemKey);
  return `${unsignedToken}.${signature}`;
}

function base64UrlEncode(str) {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function arrayBufferToBase64Url(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64UrlEncode(binary);
}

async function signWithPrivateKey(data, pemKey) {
  // 1. Parse PEM to binary
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pemKey
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");
  
  const binaryKey = str2ab(atob(pemContents));

  // 2. Import Key
  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  // 3. Sign
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(data)
  );

  return arrayBufferToBase64Url(signature);
}

function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

// --- Main Execution ---

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Uso: npm run import -- <ruta-al-csv>');
  process.exit(1);
}

// Load credentials
// Assuming google-credentials.json is in the root or we can pass it via env, 
// but user script example showed reading from file.
// We'll check for the file.
const credentialsPath = './google-credentials.json';
if (!fs.existsSync(credentialsPath)) {
  console.error('❌ No se encontró google-credentials.json en la raíz del proyecto.');
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
const sheetId = process.env.GOOGLE_SHEET_ID;

if (!sheetId) {
  console.error('❌ Falta la variable de entorno GOOGLE_SHEET_ID');
  process.exit(1);
}

importCSV(csvPath, credentials, sheetId);
