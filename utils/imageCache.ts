/**
 * 이미지 캐싱 시스템 (IndexedDB 기반)
 * - LRU (Least Recently Used) 정책
 * - 최대 50MB 용량 제한
 * - 자동 정리 및 만료
 */

interface CachedImage {
  key: string;           // 캐시 키 (emotion + level + timestamp hash)
  imageUrl: string;      // Base64 이미지
  timestamp: number;     // 생성 시간
  lastAccessed: number;  // 마지막 접근 시간
  size: number;          // 바이트 단위 크기
  metadata: {
    emotion: string;
    level: number;
    theme?: 'dark' | 'light';
  };
}

interface CacheStats {
  totalSize: number;
  itemCount: number;
  hitRate: number;
  oldestItem: number;
}

class ImageCacheManager {
  private dbName = 'saessak-image-cache';
  private storeName = 'images';
  private version = 1;
  private db: IDBDatabase | null = null;
  
  // 설정
  private maxCacheSize = 50 * 1024 * 1024; // 50MB
  private maxItems = 100;
  private ttl = 7 * 24 * 60 * 60 * 1000; // 7일
  
  // 통계
  private hits = 0;
  private misses = 0;

  /**
   * IndexedDB 초기화
   */
  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * 캐시 키 생성
   */
  private generateKey(emotion: string, level: number, theme?: 'dark' | 'light'): string {
    const baseKey = `${emotion}_L${level}${theme ? `_${theme}` : ''}`;
    return baseKey;
  }

  /**
   * 이미지 크기 계산 (Base64)
   */
  private calculateSize(base64: string): number {
    // Base64 문자열 크기 추정
    const padding = (base64.match(/=/g) || []).length;
    return (base64.length * 0.75) - padding;
  }

  /**
   * 캐시에서 이미지 가져오기
   */
  async get(emotion: string, level: number, theme?: 'dark' | 'light'): Promise<string | null> {
    await this.init();
    if (!this.db) return null;

    const key = this.generateKey(emotion, level, theme);

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const cached = request.result as CachedImage | undefined;

        if (!cached) {
          this.misses++;
          resolve(null);
          return;
        }

        // TTL 확인
        const now = Date.now();
        if (now - cached.timestamp > this.ttl) {
          // 만료된 캐시 삭제
          store.delete(key);
          this.misses++;
          resolve(null);
          return;
        }

        // 마지막 접근 시간 업데이트 (LRU)
        cached.lastAccessed = now;
        store.put(cached);

        this.hits++;
        resolve(cached.imageUrl);
      };

      request.onerror = () => {
        this.misses++;
        resolve(null);
      };
    });
  }

  /**
   * 캐시에 이미지 저장
   */
  async set(
    emotion: string,
    level: number,
    imageUrl: string,
    theme?: 'dark' | 'light'
  ): Promise<void> {
    await this.init();
    if (!this.db) return;

    const key = this.generateKey(emotion, level, theme);
    const size = this.calculateSize(imageUrl);
    const now = Date.now();

    const cached: CachedImage = {
      key,
      imageUrl,
      timestamp: now,
      lastAccessed: now,
      size,
      metadata: { emotion, level, theme }
    };

    // 용량 확인 및 정리
    await this.ensureCapacity(size);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(cached);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 용량 확보 (LRU 정책)
   */
  private async ensureCapacity(requiredSize: number): Promise<void> {
    const stats = await this.getStats();

    // 용량 또는 개수 초과시 정리
    if (stats.totalSize + requiredSize > this.maxCacheSize || stats.itemCount >= this.maxItems) {
      await this.evictLRU();
    }
  }

  /**
   * LRU 항목 제거
   */
  private async evictLRU(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('lastAccessed');
      const request = index.openCursor(); // 오래된 것부터

      let removed = 0;
      const targetRemoval = Math.max(1, Math.floor(this.maxItems * 0.2)); // 20% 제거

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && removed < targetRemoval) {
          cursor.delete();
          removed++;
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 캐시 통계
   */
  async getStats(): Promise<CacheStats> {
    await this.init();
    if (!this.db) {
      return { totalSize: 0, itemCount: 0, hitRate: 0, oldestItem: Date.now() };
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as CachedImage[];
        
        const totalSize = items.reduce((sum, item) => sum + item.size, 0);
        const itemCount = items.length;
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
        const oldestItem = items.length > 0 
          ? Math.min(...items.map(i => i.timestamp))
          : Date.now();

        resolve({ totalSize, itemCount, hitRate, oldestItem });
      };

      request.onerror = () => {
        resolve({ totalSize: 0, itemCount: 0, hitRate: 0, oldestItem: Date.now() });
      };
    });
  }

  /**
   * 특정 항목 삭제
   */
  async delete(emotion: string, level: number, theme?: 'dark' | 'light'): Promise<void> {
    await this.init();
    if (!this.db) return;

    const key = this.generateKey(emotion, level, theme);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 전체 캐시 삭제
   */
  async clear(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        this.hits = 0;
        this.misses = 0;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 만료된 항목 정리
   */
  async cleanExpired(): Promise<number> {
    await this.init();
    if (!this.db) return 0;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as CachedImage[];
        const now = Date.now();
        let removed = 0;

        items.forEach(item => {
          if (now - item.timestamp > this.ttl) {
            store.delete(item.key);
            removed++;
          }
        });

        resolve(removed);
      };

      request.onerror = () => resolve(0);
    });
  }

  /**
   * 캐시 내보내기 (백업용)
   */
  async export(): Promise<CachedImage[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as CachedImage[]);
      request.onerror = () => resolve([]);
    });
  }

  /**
   * 캐시 가져오기 (복원용)
   */
  async import(items: CachedImage[]): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      let processed = 0;
      items.forEach(item => {
        store.put(item);
        processed++;
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// 싱글톤 인스턴스
export const imageCache = new ImageCacheManager();

// 유틸리티 함수들
export const cacheUtils = {
  /**
   * 캐시 용량을 읽기 쉬운 형식으로
   */
  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  },

  /**
   * 히트율 포맷
   */
  formatHitRate(rate: number): string {
    return `${rate.toFixed(1)}%`;
  },

  /**
   * 시간 차이 포맷
   */
  formatAge(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  }
};
