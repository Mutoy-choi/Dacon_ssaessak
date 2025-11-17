/**
 * Reset Supabase table and upload limited counseling data
 * 
 * Usage:
 *   npm run reset-upload      # Delete all + Upload 1000 records
 *   npm run reset-upload 500  # Delete all + Upload 500 records
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../.env.local') });

import ragService from '../services/ragService';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

async function main() {
  console.log('🔄 Reset and Upload Counseling Data\n');

  const geminiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!geminiKey || !supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  const maxRecords = parseInt(process.argv[2] || '1000', 10);

  try {
    // Step 1: Delete all existing data
    console.log('🗑️  Deleting all existing data...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { error: deleteError } = await supabase
      .from('counseling_cases')
      .delete()
      .neq('id', ''); // Delete all (neq empty string matches everything)
    
    if (deleteError) {
      console.error('Delete error:', deleteError);
      throw deleteError;
    }
    
    console.log('✅ All data deleted\n');

    // Step 2: Upload new data
    console.log(`📦 Uploading ${maxRecords} records...\n`);
    
    await ragService.initialize();
    
    const dataPath = path.resolve(__dirname, '../data/counseling_data.jsonl');
    await ragService.uploadCounselingData(dataPath, 50, 0, maxRecords);
    
    console.log('\n✅ Reset and upload completed successfully!');
    console.log(`📊 Total records in database: ${maxRecords}`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Operation failed:', error);
    process.exit(1);
  }
}

main();
