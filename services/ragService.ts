/**
 * RAG (Retrieval-Augmented Generation) Service
 * - Pinecone Vector DB for counseling data
 * - Hybrid Search (Semantic + Keyword)
 * - Reciprocal Rank Fusion
 */

import { GoogleGenAI } from '@google/genai';
import { Index, RecordMetadata } from '@pinecone-database/pinecone';
import { initPinecone } from '../config/pinecone';
import Hangul from 'hangul-js';
import natural from 'natural';
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
  metadata?: RecordMetadata;
}

class RAGService {
  private pineconeIndex: Index<RecordMetadata> | null = null;
  private genAI: GoogleGenAI | null = null;
  private embedModel: any = null;
  private tfidf: natural.TfIdf;
  private keywordCache: Map<string, string[]> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.tfidf = new natural.TfIdf();
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('RAG service already initialized');
      return;
    }

    try {
      this.pineconeIndex = await initPinecone();
      
      // Node.js 환경(스크립트)과 브라우저 환경(Vite) 모두 지원
      const apiKey = process.env.API_KEY 
        || process.env.VITE_API_KEY
        || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_KEY)
        || '';
        
      if (!apiKey) {
        throw new Error('API_KEY 또는 VITE_API_KEY 환경 변수가 설정되지 않았습니다.\n.env 파일에 Gemini API 키를 추가해주세요.');
      }
      
      this.genAI = new GoogleGenAI({ apiKey });
      this.embedModel = this.genAI.models;
      
      this.isInitialized = true;
      console.log('RAG service initialized');
    } catch (error) {
      console.error('RAG service initialization failed:', error);
      throw error;
    }
  }

  private extractKeywords(text: string): string[] {
    const stopwords = ['은', '는', '이', '가', '을', '를', '에', '의', '와', '과', '도', '로', '으로'];
    
    const words = text
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopwords.includes(w));

    this.tfidf.addDocument(words.join(' '));
    const docIndex = this.tfidf.documents.length - 1;
    const terms = this.tfidf.listTerms(docIndex)
      .slice(0, 10)
      .map(term => term.term);

    return [...new Set(terms)];
  }

  private async createEmbedding(text: string): Promise<number[]> {
    if (!this.embedModel) {
      throw new Error('Embedding model not initialized');
    }

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
    } catch (error) {
      console.error('Embedding generation failed:', error);
      return new Array(768).fill(0);
    }
  }

  async uploadCounselingData(dataPath: string, batchSize: number = 100, startFrom: number = 0) {
    if (!this.pineconeIndex) {
      throw new Error('Pinecone index not initialized');
    }

    const fs = await import('fs');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    
    // JSONL 파일 파싱 (.jsonl은 각 줄이 독립적인 JSON 객체)
    const rawData: CounselingData[] = fileContent
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

    console.log(`📊 Total records: ${rawData.length}`);
    
    if (startFrom > 0) {
      console.log(`⏩ Resuming from index ${startFrom}...`);
    }
    
    console.log(`Uploading ${rawData.length} counseling records...`);

    for (let i = startFrom; i < rawData.length; i += batchSize) {
      const batch = rawData.slice(i, i + batchSize);
      const vectors = [];

      for (const item of batch) {
        try {
          const embedding = await this.createEmbedding(item.input);
          const keywords = item.keywords || this.extractKeywords(item.input);
          
          vectors.push({
            id: item.id,
            values: embedding,
            metadata: {
              input: item.input,
              output: item.output,
              keywords: keywords.join(','),
              emotions: (item.emotions || []).join(','),
            }
          });

          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to process ${item.id}:`, error);
        }
      }

      if (vectors.length > 0) {
        // Retry logic for network errors
        let retries = 0;
        const maxRetries = 5;
        
        while (retries <= maxRetries) {
          try {
            await this.pineconeIndex.upsert(vectors);
            console.log(`✅ Uploaded ${i + vectors.length}/${rawData.length}`);
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
    if (!this.pineconeIndex) {
      throw new Error('Pinecone index not initialized');
    }

    try {
      const queryEmbedding = await this.createEmbedding(userQuery);
      
      const semanticFilter = emotionContext && emotionContext.length > 0
        ? { emotions: { $in: emotionContext } }
        : undefined;

      const semanticResults = await this.pineconeIndex.query({
        vector: queryEmbedding,
        topK: topK * 2,
        includeMetadata: true,
        filter: semanticFilter,
      });

      const userKeywords = this.extractKeywords(userQuery);
      const keywordResults = await this.pineconeIndex.query({
        vector: queryEmbedding,
        topK: topK * 2,
        includeMetadata: true,
        filter: userKeywords.length > 0 ? {
          keywords: { $in: userKeywords }
        } : undefined
      });

      const rrfResults = this.reciprocalRankFusion(
        [
          { results: semanticResults.matches, weight: 0.7, type: 'semantic' },
          { results: keywordResults.matches, weight: 0.3, type: 'keyword' }
        ],
        topK
      );

      return rrfResults.map(item => ({
        id: item.id,
        input: (item.metadata?.input as string) || '',
        output: (item.metadata?.output as string) || '',
        keywords: ((item.metadata?.keywords as string) || '').split(',').filter(k => k),
        emotions: ((item.metadata?.emotions as string) || '').split(',').filter(e => e),
        similarity: item.score || 0,
        retrievalType: item.type as 'semantic' | 'keyword' | 'emotion'
      }));
    } catch (error) {
      console.error('Search failed:', error);
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
