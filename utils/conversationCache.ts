/**
 * 대화 요약 캐싱 시스템
 * - 중복 분석 방지
 * - 메모리 효율적 저장
 * - TTL 기반 자동 만료
 */

interface ConversationSummary {
  key: string;              // 대화 해시
  summary: string;          // AI 생성 요약
  emotions: {               // 감정 분석 결과
    [key: string]: number;
  };
  xp: number;               // 획득 XP
  timestamp: number;        // 생성 시간
  expiresAt: number;        // 만료 시간
}

interface CacheEntry {
  summary: ConversationSummary;
  hitCount: number;         // 조회 횟수
  lastAccessed: number;     // 마지막 접근
}

interface ConversationCacheStats {
  totalEntries: number;
  hitRate: number;
  averageAge: number;
  memoryUsage: number;
}

class ConversationCacheManager {
  private cache = new Map<string, CacheEntry>();
  
  // 설정
  private maxEntries = 200;              // 최대 캐시 항목
  private defaultTTL = 2 * 60 * 60 * 1000; // 2시간
  private similarityThreshold = 0.85;    // 유사도 임계값
  
  // 통계
  private hits = 0;
  private misses = 0;

  /**
   * 대화 해시 생성 (빠른 조회용)
   */
  private generateHash(text: string): string {
    // 간단한 해시 함수 (성능 최적화)
    let hash = 0;
    const normalized = text.toLowerCase().trim();
    
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    
    return `conv_${hash.toString(36)}`;
  }

  /**
   * 텍스트 유사도 계산 (Jaccard 유사도)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const tokens1 = new Set(text1.toLowerCase().split(/\s+/));
    const tokens2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    
    return intersection.size / union.size;
  }

  /**
   * 유사한 대화 찾기
   */
  private findSimilar(text: string): CacheEntry | null {
    const entries = Array.from(this.cache.values());
    
    for (const entry of entries) {
      // 만료 확인
      if (Date.now() > entry.summary.expiresAt) {
        this.cache.delete(entry.summary.key);
        continue;
      }
      
      // 유사도 계산 (첫 100자만 비교로 최적화)
      const sample1 = text.slice(0, 100);
      const sample2 = entry.summary.summary.slice(0, 100);
      const similarity = this.calculateSimilarity(sample1, sample2);
      
      if (similarity >= this.similarityThreshold) {
        return entry;
      }
    }
    
    return null;
  }

  /**
   * 캐시에서 요약 가져오기
   */
  get(userMessage: string): ConversationSummary | null {
    const hash = this.generateHash(userMessage);
    
    // 정확한 매칭 먼저 시도
    const exact = this.cache.get(hash);
    if (exact && Date.now() <= exact.summary.expiresAt) {
      exact.hitCount++;
      exact.lastAccessed = Date.now();
      this.hits++;
      return exact.summary;
    }
    
    // 유사한 대화 찾기
    const similar = this.findSimilar(userMessage);
    if (similar) {
      similar.hitCount++;
      similar.lastAccessed = Date.now();
      this.hits++;
      return similar.summary;
    }
    
    this.misses++;
    return null;
  }

  /**
   * 캐시에 요약 저장
   */
  set(
    userMessage: string,
    summary: string,
    emotions: { [key: string]: number },
    xp: number,
    ttl?: number
  ): void {
    const hash = this.generateHash(userMessage);
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    
    const conversationSummary: ConversationSummary = {
      key: hash,
      summary,
      emotions,
      xp,
      timestamp: now,
      expiresAt
    };
    
    const entry: CacheEntry = {
      summary: conversationSummary,
      hitCount: 0,
      lastAccessed: now
    };
    
    // 용량 확인
    if (this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }
    
    this.cache.set(hash, entry);
  }

  /**
   * LRU 정책으로 항목 제거
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 만료된 항목 정리
   */
  cleanExpired(): number {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.summary.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    return removed;
  }

  /**
   * 특정 항목 삭제
   */
  delete(userMessage: string): boolean {
    const hash = this.generateHash(userMessage);
    return this.cache.delete(hash);
  }

  /**
   * 전체 캐시 삭제
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 캐시 통계
   */
  getStats(): ConversationCacheStats {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    const totalEntries = entries.length;
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    
    const averageAge = entries.length > 0
      ? entries.reduce((sum, e) => sum + (now - e.summary.timestamp), 0) / entries.length
      : 0;
    
    // 메모리 사용량 추정 (대략적)
    const memoryUsage = entries.reduce((sum, e) => {
      const jsonSize = JSON.stringify(e.summary).length;
      return sum + jsonSize;
    }, 0);
    
    return {
      totalEntries,
      hitRate,
      averageAge,
      memoryUsage
    };
  }

  /**
   * 인기 항목 조회 (히트 수 기준)
   */
  getTopHits(limit: number = 10): Array<{ message: string; hits: number }> {
    const entries = Array.from(this.cache.values())
      .sort((a, b) => b.hitCount - a.hitCount)
      .slice(0, limit);
    
    return entries.map(e => ({
      message: e.summary.summary.slice(0, 50) + '...',
      hits: e.hitCount
    }));
  }

  /**
   * LocalStorage에 백업
   */
  backup(): void {
    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem('saessak-conversation-cache', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to backup conversation cache:', error);
    }
  }

  /**
   * LocalStorage에서 복원
   */
  restore(): boolean {
    try {
      const data = localStorage.getItem('saessak-conversation-cache');
      if (!data) return false;
      
      const entries = JSON.parse(data) as Array<[string, CacheEntry]>;
      this.cache = new Map(entries);
      
      // 만료된 항목 정리
      this.cleanExpired();
      return true;
    } catch (error) {
      console.error('Failed to restore conversation cache:', error);
      return false;
    }
  }

  /**
   * 자동 백업 시작 (5분마다)
   */
  startAutoBackup(): void {
    setInterval(() => {
      this.backup();
      this.cleanExpired();
    }, 5 * 60 * 1000);
  }
}

// 싱글톤 인스턴스
export const conversationCache = new ConversationCacheManager();

// 자동 복원 및 백업 시작
conversationCache.restore();
conversationCache.startAutoBackup();

// 유틸리티 함수들
export const conversationCacheUtils = {
  /**
   * 메모리 사용량 포맷
   */
  formatMemory(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  },

  /**
   * 시간 포맷
   */
  formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}시간 ${minutes % 60}분`;
    if (minutes > 0) return `${minutes}분`;
    return '1분 미만';
  },

  /**
   * 히트율 색상
   */
  getHitRateColor(rate: number): string {
    if (rate >= 80) return 'text-green-500';
    if (rate >= 60) return 'text-yellow-500';
    return 'text-red-500';
  }
};
