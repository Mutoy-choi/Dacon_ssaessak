/**
 * Pinecone 벡터 DB 설정
 * - 상담 데이터 임베딩 저장 및 검색
 */

import { Pinecone } from '@pinecone-database/pinecone';

const INDEX_NAME = 'counseling-cases';
const EMBEDDING_DIMENSION = 768; // Gemini text-embedding-004

/**
 * Pinecone 인덱스 초기화
 */
export async function initPinecone() {
  // Node.js 환경(스크립트)과 브라우저 환경(Vite) 모두 지원
  const apiKey = process.env.PINECONE_API_KEY 
    || process.env.VITE_PINECONE_API_KEY 
    || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PINECONE_API_KEY);
  
  if (!apiKey) {
    throw new Error('PINECONE_API_KEY 또는 VITE_PINECONE_API_KEY 환경 변수가 설정되지 않았습니다.\n.env 파일에 API 키를 추가해주세요.');
  }

  const pinecone = new Pinecone({
    apiKey,
  });

  try {
    // 인덱스 목록 확인
    const existingIndexes = await pinecone.listIndexes();
    const indexExists = existingIndexes.indexes?.some(idx => idx.name === INDEX_NAME);

    if (!indexExists) {
      console.log(`📦 Pinecone 인덱스 "${INDEX_NAME}" 생성 중...`);
      
      // 새 인덱스 생성
      await pinecone.createIndex({
        name: INDEX_NAME,
        dimension: EMBEDDING_DIMENSION,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      
      console.log(`✅ Pinecone 인덱스 "${INDEX_NAME}" 생성 완료`);
      
      // 인덱스 준비 대기 (약 1분 소요)
      await new Promise(resolve => setTimeout(resolve, 60000));
    }

    const index = pinecone.index(INDEX_NAME);
    console.log(`✅ Pinecone 인덱스 "${INDEX_NAME}" 연결 완료`);
    
    return index;
  } catch (error) {
    console.error('❌ Pinecone 초기화 실패:', error);
    throw error;
  }
}

export { INDEX_NAME, EMBEDDING_DIMENSION };
