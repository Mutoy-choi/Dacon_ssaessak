/**
 * Supabase Vector DB 설정 (브라우저 호환)
 * - PostgreSQL + pgvector 기반
 * - 상담 데이터 임베딩 저장 및 검색
 */

import { createClient } from '@supabase/supabase-js';

// Supabase 환경 변수
const getSupabaseUrl = () => {
  // Vite 환경 (브라우저)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_SUPABASE_URL;
  }
  // Node.js 환경 (스크립트)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  }
  return undefined;
};

const getSupabaseKey = () => {
  // Vite 환경 (브라우저)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
  // Node.js 환境 (스크립트)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  }
  return undefined;
};

/**
 * Supabase 클라이언트 초기화
 */
export function initSupabase() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase 환경 변수가 설정되지 않았습니다.\n' +
      '.env 파일에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 추가해주세요.'
    );
  }

  console.log('✅ Supabase 초기화:', supabaseUrl.substring(0, 30) + '...');

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false, // RAG는 인증 불필요
    },
  });
}

/**
 * Supabase 타입 정의
 */
export interface CounselingCase {
  id: string;
  input: string;
  output: string;
  embedding: number[];
  keywords: string[];
  emotions: string[];
  created_at?: string;
}

export interface MatchCounselingCasesParams {
  query_embedding: number[];
  match_threshold?: number;
  match_count?: number;
  filter_emotions?: string[];
}

export interface MatchCounselingCasesResult {
  id: string;
  input: string;
  output: string;
  keywords: string[];
  emotions: string[];
  similarity: number;
}
