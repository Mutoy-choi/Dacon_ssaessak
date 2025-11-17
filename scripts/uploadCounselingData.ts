/**
 * Upload Counseling Data to Supabase
 * 
 * Usage:
 *   npm run upload-counseling
 * 
 * Environment variables required (.env.local):
 *   - GEMINI_API_KEY (Gemini API Key)
 *   - VITE_SUPABASE_URL (Supabase URL)
 *   - VITE_SUPABASE_ANON_KEY (Supabase Anon Key)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES Module에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.local 파일 로드
config({ path: resolve(__dirname, '../.env.local') });

import ragService from '../services/ragService';
import * as path from 'path';

async function main() {
  console.log('🚀 Starting counseling data upload...\n');

  // 환경 변수 확인 (Supabase 버전)
  const geminiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!geminiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env.local file');
    console.error('Please add your Gemini API key to .env.local file:\n');
    console.error('GEMINI_API_KEY=your_gemini_api_key\n');
    process.exit(1);
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials not found in .env.local file');
    console.error('Please add your Supabase credentials to .env.local file:\n');
    console.error('VITE_SUPABASE_URL=your_supabase_url');
    console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key\n');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded');
  console.log(`   - Gemini API Key: ${geminiKey.substring(0, 10)}...`);
  console.log(`   - Supabase URL: ${supabaseUrl}`);
  console.log(`   - Supabase Key: ${supabaseKey.substring(0, 10)}...\n`);

  try {
    // Initialize RAG service
    console.log('📦 Initializing RAG service...');
    await ragService.initialize();
    
    // Upload counseling data
    const dataPath = path.resolve(__dirname, '../data/counseling_data.jsonl');
    console.log(`📂 Data file: ${dataPath}\n`);
    
    // Check if resuming from a specific index (command line argument)
    const startFrom = parseInt(process.argv[2] || '0', 10);
    const maxRecords = parseInt(process.argv[3] || '1000', 10); // 기본 1000개로 제한
    
    await ragService.uploadCounselingData(dataPath, 50, startFrom, maxRecords);
    
    console.log('\n✅ Upload completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    console.error('\n💡 Usage:');
    console.error('   npm run upload-counseling                    # Upload first 1000 records (default)');
    console.error('   npm run upload-counseling -- 0 13234        # Upload all 13,234 records');
    console.error('   npm run upload-counseling -- 1000 500       # Resume from 1000, upload 500 more');
    console.error('   npm run upload-counseling -- <start> <max>  # Custom start and max');
    process.exit(1);
  }
}

main();
