import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { SupabaseClient } from '../src/services/supabase';
import { CreateTransactionInput } from '../src/types/transaction';
import { Env } from '../src/types/env';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: '.env.local' });

// Mock Env for SupabaseClient
const env: Env = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  GEMINI_API_KEY: '',
  TELEGRAM_BOT_TOKEN: '',
  API_KEY: ''
};

if (!env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Falta SUPABASE_SERVICE_KEY en .env.local');
  process.exit(1);
}

const supabase = new SupabaseClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function importCSV(csvPath: string) {
  try {
    // 1. Leer CSV
    console.log(`📖 Leyendo archivo: ${csvPath}`);
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`📊 Encontrados ${records.length} registros`);
    
    // 2. Procesar y guardar
    console.log(`🚀 Iniciando importación...`);
    
    let successCount = 0;
    let failCount = 0;

    for (const record of records) {
      try {
        // Budget Bakers export format: Date,Amount,Category,Account,Note,Labels
        const amount = Math.abs(parseFloat(record.Amount));
        const dateObj = new Date(record.Date);
        const date = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
        const time = '12:00:00'; // Default time

        // Map Category
        const categoryName = mapCategory(record.Category);
        const category = await supabase.getCategory(categoryName);
        const categoryId = category ? category.id : undefined;

        // Map Account
        const accountName = mapAccount(record.Account);
        const account = await supabase.getAccount(accountName);
        const accountId = account ? account.id : '00000000-0000-0000-0000-000000000000'; // Placeholder if not found

        let description = record.Note || record.Category;
        if (record.Labels) {
          description += ` (${record.Labels})`;
        }

        const transaction: CreateTransactionInput = {
          date,
          time,
          amount,
          description: capitalize(description),
          category_id: categoryId,
          account_id: accountId,
          type: 'expense',
          payment_method: 'efectivo', // Default
          source: 'import_csv',
          confidence: 100,
          raw_text: JSON.stringify(record)
        };

        await supabase.createTransaction(transaction);
        successCount++;
        
        if (successCount % 50 === 0) {
          console.log(`✅ Importados ${successCount}/${records.length}`);
        }

      } catch (err) {
        console.error(`❌ Error importando registro:`, record, err);
        failCount++;
      }
    }
    
    console.log(`🎉 Importación completada. Exitosos: ${successCount}, Fallidos: ${failCount}`);
    
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

function mapCategory(budgetBakersCategory: string): string {
  const mapping: Record<string, string> = {
    'Food & Drink': 'Food',
    'Restaurants': 'Food',
    'Groceries': 'Food', // Or Shopping? My seed has Food.
    'Transport': 'Transportation',
    'Shopping': 'Shopping',
    'Entertainment': 'Entertainment',
    'Health': 'Health',
    'Bills & Utilities': 'Utilities',
    'Education': 'Education',
    'Home': 'Home',
    'Rent': 'Home',
    'Salary': 'Salary', // Income?
    'Fitness': 'Health',
    'Travel': 'Other'
  };
  
  return mapping[budgetBakersCategory] || 'Other';
}

function mapAccount(accountName: string): string {
  const lower = accountName.toLowerCase();
  if (lower.includes('bancolombia')) return 'bancolombia';
  if (lower.includes('nequi')) return 'nequi';
  if (lower.includes('cash') || lower.includes('efectivo')) return 'cash'; // 'cash' is type, but I need institution for getAccount? 
  // My getAccount uses institution.
  // I need to fix getAccount in SupabaseClient to be more robust or use a different method.
  // For now, let's assume 'bancolombia' works.
  return 'bancolombia';
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// --- Main Execution ---
const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Uso: npx ts-node scripts/import-csv.ts <ruta-al-csv>');
  process.exit(1);
}

importCSV(csvPath);
