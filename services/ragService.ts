/**
 * RAG (Retrieval-Augmented Generation) Service
 * - Supabase Vector DB (PostgreSQL + pgvector)
 * - 브라우저에서 직접 작동 가능
 * - Hybrid Search (Semantic + Keyword)
 */

import { GoogleGenAI } from '@google/genai';
import { initSupabase, type MatchCounselingCasesResult } from '../config/supabase';
import type { PetPersona } from '../types';

interface CounselingData {
  id: string;
  input: string;
  output: string;
  keywords?: string[];
  emotions?: string[];
}

interface RetrievedCase extends CounselingData {
  similarity: number;
  retrievalType: 'semantic' | 'keyword' | 'emotion';
}

interface RankItem {
  id: string;
  score?: number;
  metadata?: any;
}

class RAGService {
  private supabase: ReturnType<typeof initSupabase> | null = null;
  private genAI: GoogleGenAI | null = null;
  private embedModel: any = null;
  private keywordCache: Map<string, string[]> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    // No dependencies needed
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('✅ RAG service already initialized');
      return;
    }

    try {
      // Supabase 클라이언트 초기화
      this.supabase = initSupabase();
      console.log('✅ Supabase 연결 완료');
      
      // Node.js 환경(스크립트)과 브라우저 환경(Vite) 모두 지원
      const apiKey = process.env.GEMINI_API_KEY 
        || (typeof import.meta !== 'undefined' && (import.meta as any).env?.GEMINI_API_KEY)
        || '';
        
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.\n.env.local 파일에 Gemini API 키를 추가해주세요.');
      }
      
      this.genAI = new GoogleGenAI({ apiKey });
      this.embedModel = this.genAI.models;
      
      this.isInitialized = true;
      console.log('🎉 RAG service initialized successfully');
    } catch (error) {
      console.error('❌ RAG service initialization failed:', error);
      throw error;
    }
  }

  private extractKeywords(text: string): string[] {
    // 간단한 키워드 추출 (브라우저 호환)
    const stopwords = new Set([
      '은', '는', '이', '가', '을', '를', '에', '의', '와', '과', '도', '로', '으로',
      '그', '저', '이것', '그것', '저것', '그런', '이런', '저런', '있다', '없다',
      '하다', '되다', '이다', '아니다', '같다', '다르다', '많다', '적다'
    ]);
    
    // 단어 추출 (2글자 이상)
    const words = text
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !stopwords.has(w));
    
    // 빈도수 계산
    const frequency = new Map<string, number>();
    words.forEach(word => {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    });
    
    // 빈도순 정렬 후 상위 10개 반환
    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private async createEmbedding(text: string): Promise<number[]> {
    if (!this.embedModel) {
      throw new Error('Embedding model not initialized');
    }

    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Gemini embedContent API
        const result = await this.embedModel.embedContent({
          model: 'text-embedding-004',
          contents: [{ parts: [{ text }] }]
        });
        
        // Response structure: result.embeddings[0].values
        if (!result || !result.embeddings || !result.embeddings[0] || !result.embeddings[0].values) {
          console.error('❌ Unexpected embedding response');
          return new Array(768).fill(0);
        }
        
        return result.embeddings[0].values;
      } catch (error: any) {
        lastError = error;
        
        // API 500 에러는 재시도
        if (error.status === 500 && attempt < maxRetries) {
          const waitTime = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
          console.warn(`⚠️  Embedding API error (${error.status}), retry ${attempt + 1}/${maxRetries} after ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        console.error('Embedding generation failed:', error);
        return new Array(768).fill(0);
      }
    }
    
    console.error('Embedding generation failed after retries:', lastError);
    return new Array(768).fill(0);
  }

  async uploadCounselingData(
    dataPath: string, 
    batchSize: number = 50, 
    startFrom: number = 0,
    maxRecords: number = -1  // -1 means upload all
  ) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const fs = await import('fs');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    
    // JSONL 파일 파싱 (.jsonl은 각 줄이 독립적인 JSON 객체)
    let rawData: CounselingData[] = fileContent
      .trim()
      .split('\n')
      .map((line, index) => {
        try {
          const data = JSON.parse(line);
          return {
            id: `counsel_${String(index + 1).padStart(5, '0')}`,
            ...data
          };
        } catch (error) {
          console.error(`❌ Line ${index + 1} parsing failed:`, error);
          return null;
        }
      })
      .filter((item): item is CounselingData => item !== null);

    console.log(`📊 Total records in file: ${rawData.length}`);
    
    // Limit records if maxRecords is specified
    if (maxRecords > 0 && rawData.length > maxRecords) {
      rawData = rawData.slice(0, maxRecords);
      console.log(`🔢 Limiting upload to first ${maxRecords} records`);
    }
    
    if (startFrom > 0) {
      console.log(`⏩ Resuming from index ${startFrom}...`);
    }
    
    console.log(`Uploading ${rawData.length} counseling records...`);

    for (let i = startFrom; i < rawData.length; i += batchSize) {
      const batch = rawData.slice(i, i + batchSize);
      const records = [];

      for (const item of batch) {
        try {
          const embedding = await this.createEmbedding(item.input);
          
          // Skip zero vectors (failed embeddings)
          const hasNonZero = embedding.some(val => val !== 0);
          if (!hasNonZero) {
            console.warn(`⚠️  Skipping ${item.id}: zero vector (API error)`);
            continue;
          }
          
          const keywords = item.keywords || this.extractKeywords(item.input);
          
          records.push({
            id: item.id,
            input: item.input,
            output: item.output,
            embedding: `[${embedding.join(',')}]`, // Convert to pgvector string format
            keywords,
            emotions: item.emotions || [],
          });

          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to process ${item.id}:`, error);
        }
      }

      if (records.length > 0) {
        // Retry logic for network errors
        let retries = 0;
        const maxRetries = 5;
        
        while (retries <= maxRetries) {
          try {
            const { error } = await this.supabase
              .from('counseling_cases')
              .insert(records);
            
            if (error) throw error;
            
            console.log(`✅ Uploaded ${i + records.length}/${rawData.length}`);
            break; // Success, exit retry loop
          } catch (error: any) {
            retries++;
            if (retries > maxRetries) {
              console.error(`❌ Failed after ${maxRetries} retries at ${i}/${rawData.length}`);
              throw error;
            }
            
            const waitTime = Math.min(1000 * Math.pow(2, retries), 30000); // Max 30s
            console.warn(`⚠️  Network error, retry ${retries}/${maxRetries} after ${waitTime/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
    }

    console.log('🎉 All data uploaded successfully!');
  }

  async retrieveRelevantCases(
    userQuery: string,
    topK: number = 5,
    emotionContext?: string[]
  ): Promise<RetrievedCase[]> {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    try {
      console.log('🔍 RAG retrieveRelevantCases 호출:', {
        query: userQuery.substring(0, 50),
        topK,
        emotionContext
      });
      
      console.log('📝 검색 쿼리 전문:', userQuery);
      
      // 1. 쿼리 임베딩 생성
      const queryEmbedding = await this.createEmbedding(userQuery);
      console.log('✅ 임베딩 생성 완료:', queryEmbedding.slice(0, 5));
      
      // Convert to pgvector string format for Supabase
      const embeddingString = `[${queryEmbedding.join(',')}]`;
      console.log('📊 임베딩 문자열 형식:', embeddingString.substring(0, 50) + '...');
      
      // 2. Supabase RPC로 벡터 유사도 검색
      const { data, error } = await this.supabase.rpc('match_counseling_cases', {
        query_embedding: embeddingString,
        match_threshold: 0.0,  // 임시로 0.0으로 설정하여 모든 결과 가져오기
        match_count: topK * 2,
        filter_emotions: emotionContext || null,
      });

      console.log('🔍 Supabase RPC 결과:', { 
        dataLength: data?.length || 0, 
        error: error?.message || error,
        hasData: !!data,
        dataType: typeof data
      });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('ℹ️ No matching cases found');
        return [];
      }

      // 3. 키워드 기반 재순위화 (Hybrid Search)
      const userKeywords = this.extractKeywords(userQuery);
      const scoredResults = data.map((item: any) => {
        const semanticScore = item.similarity || 0;
        
        // 키워드 매칭 점수
        const keywords = item.keywords || [];
        const keywordMatches = userKeywords.filter(qk => 
          keywords.some((k: string) => k.includes(qk) || qk.includes(k))
        ).length;
        const keywordScore = keywordMatches / Math.max(userKeywords.length, 1);

        // Hybrid Score: 70% Semantic + 30% Keyword
        const hybridScore = semanticScore * 0.7 + keywordScore * 0.3;

        return {
          id: item.id,
          input: item.input,
          output: item.output,
          keywords: item.keywords,
          emotions: item.emotions,
          similarity: hybridScore,
          retrievalType: 'semantic' as const,
        };
      });

      // 4. Hybrid Score로 정렬 후 상위 topK 반환
      const topResults = scoredResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
      
      // 상위 결과 로그
      console.log('🎯 상위 검색 결과:', topResults.map(r => ({
        id: r.id,
        similarity: r.similarity.toFixed(3),
        inputPreview: r.input.substring(0, 60) + '...',
        outputPreview: r.output.substring(0, 60) + '...'
      })));
      
      return topResults;
    } catch (error) {
      console.error('❌ RAG 검색 실패:', error);
      return [];
    }
  }

  private reciprocalRankFusion(
    resultSets: Array<{ results: any[]; weight: number; type: string }>,
    topK: number,
    k: number = 60
  ): any[] {
    const scoreMap = new Map<string, { score: number; item: any; type: string }>();

    resultSets.forEach(({ results, weight, type }) => {
      results.forEach((item, rank) => {
        const id = item.id;
        const rrfScore = weight / (k + rank + 1);

        if (scoreMap.has(id)) {
          scoreMap.get(id)!.score += rrfScore;
        } else {
          scoreMap.set(id, { score: rrfScore, item, type });
        }
      });
    });

    return Array.from(scoreMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ item, score, type }) => ({ ...item, score, type }));
  }

  buildRAGPrompt(
    userQuery: string,
    retrievedCases: RetrievedCase[],
    petPersona?: PetPersona
  ): string {
    if (retrievedCases.length === 0) {
      return '';
    }

    const casesText = retrievedCases.map((c, idx) => `
### Reference Case ${idx + 1}
**Similarity:** ${(c.similarity * 100).toFixed(1)}% | **Type:** ${c.retrievalType}

**User Issue:**
${c.input.substring(0, 200)}${c.input.length > 200 ? '...' : ''}

**Counselor Response:**
${c.output.substring(0, 300)}${c.output.length > 300 ? '...' : ''}

---
`).join('\n');

    return `
## Professional Counseling References

Below are ${retrievedCases.length} professional counseling cases similar to the user's concern.
Use the APPROACH and WISDOM from these cases naturally, not mechanically copying.

${casesText}

## Response Guidelines
1. **Genuine Empathy**: Show understanding and compassion
2. **Specific Suggestions**: Provide 2-3 actionable methods
3. **Reflective Questions**: Guide user to self-discovery
4. **Warm Closing**: End with hope and support
5. **Natural Tone**: Use friendly, accessible language

⚠️ Important: Integrate the core ideas naturally, not direct quotes.
`;
  }
}

export const ragService = new RAGService();
export default ragService;
