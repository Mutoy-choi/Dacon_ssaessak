/**
 * Upload Counseling Data to Pinecone
 * 
 * Usage:
 *   npm run upload-counseling
 * 
 * Environment variables required:
 *   - API_KEY or VITE_API_KEY (Gemini API Key)
 *   - PINECONE_API_KEY or VITE_PINECONE_API_KEY (Pinecone API Key)
 */

import 'dotenv/config';
import ragService from '../services/ragService';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES Module에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('🚀 Starting counseling data upload...\n');

  // 환경 변수 확인
  const geminiKey = process.env.API_KEY || process.env.VITE_API_KEY;
  const pineconeKey = process.env.PINECONE_API_KEY || process.env.VITE_PINECONE_API_KEY;

  if (!geminiKey) {
    console.error('❌ API_KEY or VITE_API_KEY not found in .env file');
    console.error('Please add your Gemini API key to .env file:\n');
    console.error('API_KEY=your_gemini_api_key');
    console.error('VITE_API_KEY=your_gemini_api_key\n');
    process.exit(1);
  }

  if (!pineconeKey) {
    console.error('❌ PINECONE_API_KEY or VITE_PINECONE_API_KEY not found in .env file');
    console.error('Please add your Pinecone API key to .env file:\n');
    console.error('PINECONE_API_KEY=your_pinecone_api_key');
    console.error('VITE_PINECONE_API_KEY=your_pinecone_api_key\n');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded');
  console.log(`   - Gemini API Key: ${geminiKey.substring(0, 10)}...`);
  console.log(`   - Pinecone API Key: ${pineconeKey.substring(0, 10)}...\n`);

  try {
    // Initialize RAG service
    console.log('📦 Initializing RAG service...');
    await ragService.initialize();
    
    // Upload counseling data
    const dataPath = path.resolve(__dirname, '../data/counseling_data.jsonl');
    console.log(`📂 Data file: ${dataPath}\n`);
    
    // Check if resuming from a specific index (command line argument)
    const startFrom = parseInt(process.argv[2] || '0', 10);
    
    await ragService.uploadCounselingData(dataPath, 100, startFrom);
    
    console.log('\n✅ Upload completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    console.error('\n💡 To resume from where it failed, run:');
    console.error('   npm run upload-counseling -- <last_successful_index>');
    console.error('   Example: npm run upload-counseling -- 3200');
    process.exit(1);
  }
}

main();
