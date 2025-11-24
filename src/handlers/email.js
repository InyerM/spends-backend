import { parseExpense } from '../parsers/gemini.js';
import { saveExpense } from '../services/sheets.js';

export async function handleEmail(request, env) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    let emailData;
    
    // Formato desde Gmail Apps Script
    if (contentType.includes('application/json')) {
      emailData = await request.json();
      console.log('[Email] Recibido desde Apps Script:', emailData);
      
      const emailText = emailData.body || emailData.text || emailData.subject || '';
      
      // Validar que sea de Bancolombia
      if (!emailText.toLowerCase().includes('bancolombia')) {
        console.log('[Email] No es de Bancolombia, ignorando');
        return new Response(JSON.stringify({ status: 'ignored', reason: 'not_bancolombia' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Extraer texto relevante
      const cleanText = extractBancolombiaText(emailText);
      
      if (!cleanText) {
        console.log('[Email] No se pudo extraer texto válido');
        return new Response(JSON.stringify({ status: 'error', reason: 'no_text_extracted' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      console.log('[Email] Texto limpio:', cleanText);
      
      // Parsear con Gemini
      const expense = await parseExpense(cleanText, env.GEMINI_API_KEY);
      
      // Guardar en Sheets
      await saveExpense(expense, env);
      
      console.log('[Email] Procesado exitosamente');
      
      return new Response(JSON.stringify({ 
        status: 'success', 
        expense: {
          monto: expense.monto,
          descripcion: expense.descripcion,
          categoria: expense.categoria
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ status: 'error', reason: 'invalid_format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[Email] Error:', error);
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function extractBancolombiaText(emailBody) {
  // Buscar patrones típicos de Bancolombia
  const patterns = [
    /Bancolombia:.*?(?:\$|COP)?[\d,\.]+.*?en.*?/i,
    /Compraste.*?(?:\$|COP)?[\d,\.]+.*?en.*?con tu/i,
    /Retiraste.*?(?:\$|COP)?[\d,\.]+.*?en/i,
    /Pagaste.*?(?:\$|COP)?[\d,\.]+.*?en/i
  ];
  
  for (const pattern of patterns) {
    const match = emailBody.match(pattern);
    if (match) {
      // Extraer hasta 200 caracteres desde el match
      let text = match[0];
      const startIdx = emailBody.indexOf(text);
      const extended = emailBody.substring(startIdx, startIdx + 200);
      return extended.split('\n')[0]; // Primera línea completa
    }
  }
  
  // Si no encuentra patrón, buscar línea con "Bancolombia:"
  const lines = emailBody.split('\n');
  for (const line of lines) {
    if (line.toLowerCase().includes('bancolombia') && /[\d,\.]+/.test(line)) {
      return line.trim();
    }
  }
  
  return null;
}
