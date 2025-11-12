import React, { useState, useEffect, useCallback } from 'react';
import { imageCache, cacheUtils } from '../utils/imageCache';
import { conversationCache, conversationCacheUtils } from '../utils/conversationCache';

interface PerformanceMetrics {
  // API 호출
  apiCalls: {
    total: number;
    successful: number;
    failed: number;
    avgResponseTime: number;
  };
  
  // 렌더링
  rendering: {
    fps: number;
    avgFrameTime: number;
    slowFrames: number;
  };
  
  // 메모리
  memory: {
    jsHeapSize: number;
    jsHeapLimit: number;
    usedPercentage: number;
  };
  
  // 캐시
  cache: {
    imageCache: {
      size: number;
      items: number;
      hitRate: number;
    };
    conversationCache: {
      entries: number;
      hitRate: number;
      memory: number;
    };
  };
}

interface APICallRecord {
  timestamp: number;
  endpoint: string;
  duration: number;
  success: boolean;
}

class PerformanceTracker {
  private apiCalls: APICallRecord[] = [];
  private frameTimestamps: number[] = [];
  private maxRecords = 100;
  
  // API 호출 기록
  recordAPICall(endpoint: string, duration: number, success: boolean): void {
    this.apiCalls.push({
      timestamp: Date.now(),
      endpoint,
      duration,
      success
    });
    
    // 최대 개수 유지
    if (this.apiCalls.length > this.maxRecords) {
      this.apiCalls.shift();
    }
  }
  
  // 프레임 기록
  recordFrame(): void {
    const now = performance.now();
    this.frameTimestamps.push(now);
    
    // 최근 60프레임만 유지
    if (this.frameTimestamps.length > 60) {
      this.frameTimestamps.shift();
    }
  }
  
  // API 메트릭 계산
  getAPIMetrics() {
    const recent = this.apiCalls.slice(-50); // 최근 50개
    
    return {
      total: this.apiCalls.length,
      successful: recent.filter(c => c.success).length,
      failed: recent.filter(c => !c.success).length,
      avgResponseTime: recent.length > 0
        ? recent.reduce((sum, c) => sum + c.duration, 0) / recent.length
        : 0
    };
  }
  
  // 렌더링 메트릭 계산
  getRenderingMetrics() {
    if (this.frameTimestamps.length < 2) {
      return { fps: 0, avgFrameTime: 0, slowFrames: 0 };
    }
    
    const frameTimes: number[] = [];
    for (let i = 1; i < this.frameTimestamps.length; i++) {
      frameTimes.push(this.frameTimestamps[i] - this.frameTimestamps[i - 1]);
    }
    
    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const fps = 1000 / avgFrameTime;
    const slowFrames = frameTimes.filter(t => t > 33).length; // >30fps
    
    return { fps, avgFrameTime, slowFrames };
  }
  
  // 메모리 메트릭
  getMemoryMetrics() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        jsHeapSize: memory.usedJSHeapSize,
        jsHeapLimit: memory.jsHeapSizeLimit,
        usedPercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    
    return {
      jsHeapSize: 0,
      jsHeapLimit: 0,
      usedPercentage: 0
    };
  }
  
  reset(): void {
    this.apiCalls = [];
    this.frameTimestamps = [];
  }
}

const tracker = new PerformanceTracker();

// 전역 API 래퍼 (타이밍 측정용)
export function trackAPICall<T>(
  endpoint: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  return apiCall()
    .then(result => {
      const duration = performance.now() - start;
      tracker.recordAPICall(endpoint, duration, true);
      return result;
    })
    .catch(error => {
      const duration = performance.now() - start;
      tracker.recordAPICall(endpoint, duration, false);
      throw error;
    });
}

interface PerformanceMonitorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ isOpen, onClose }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isRecording, setIsRecording] = useState(true);

  // 메트릭 업데이트
  const updateMetrics = useCallback(async () => {
    if (!isRecording) return;

    tracker.recordFrame();

    const [imageCacheStats, conversationCacheStats] = await Promise.all([
      imageCache.getStats(),
      Promise.resolve(conversationCache.getStats())
    ]);

    const newMetrics: PerformanceMetrics = {
      apiCalls: tracker.getAPIMetrics(),
      rendering: tracker.getRenderingMetrics(),
      memory: tracker.getMemoryMetrics(),
      cache: {
        imageCache: {
          size: imageCacheStats.totalSize,
          items: imageCacheStats.itemCount,
          hitRate: imageCacheStats.hitRate
        },
        conversationCache: {
          entries: conversationCacheStats.totalEntries,
          hitRate: conversationCacheStats.hitRate,
          memory: conversationCacheStats.memoryUsage
        }
      }
    };

    setMetrics(newMetrics);
  }, [isRecording]);

  // 자동 업데이트 (1초마다)
  useEffect(() => {
    if (!isOpen || !isRecording) return;

    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isRecording, updateMetrics]);

  // 초기 로드
  useEffect(() => {
    if (isOpen) {
      updateMetrics();
    }
  }, [isOpen, updateMetrics]);

  const handleReset = () => {
    tracker.reset();
    updateMetrics();
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
  };

  if (!isOpen || !metrics) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                📊 성능 모니터링
              </h2>
              <p className="text-sm opacity-90 mt-1">실시간 시스템 성능 분석</p>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-white/20 rounded-full p-2 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Controls */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleToggleRecording}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isRecording ? '⏸ 일시정지' : '▶ 기록 시작'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition"
            >
              🔄 리셋
            </button>
          </div>

          {/* API Calls */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              🌐 API 호출
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="총 호출"
                value={metrics.apiCalls.total}
                color="blue"
              />
              <MetricCard
                label="성공"
                value={metrics.apiCalls.successful}
                color="green"
              />
              <MetricCard
                label="실패"
                value={metrics.apiCalls.failed}
                color="red"
              />
              <MetricCard
                label="평균 응답"
                value={`${metrics.apiCalls.avgResponseTime.toFixed(0)}ms`}
                color="purple"
              />
            </div>
          </div>

          {/* Rendering */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              🎨 렌더링 성능
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <MetricCard
                label="FPS"
                value={metrics.rendering.fps.toFixed(1)}
                color="green"
              />
              <MetricCard
                label="프레임 시간"
                value={`${metrics.rendering.avgFrameTime.toFixed(1)}ms`}
                color="blue"
              />
              <MetricCard
                label="느린 프레임"
                value={metrics.rendering.slowFrames}
                color={metrics.rendering.slowFrames > 5 ? 'red' : 'green'}
              />
            </div>
          </div>

          {/* Memory */}
          {metrics.memory.jsHeapSize > 0 && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                💾 메모리 사용량
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>사용 중</span>
                    <span className="font-mono">
                      {cacheUtils.formatSize(metrics.memory.jsHeapSize)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        metrics.memory.usedPercentage > 80
                          ? 'bg-red-500'
                          : metrics.memory.usedPercentage > 60
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(metrics.memory.usedPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>{cacheUtils.formatSize(metrics.memory.jsHeapLimit)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cache */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              💿 캐시 시스템
            </h3>
            
            {/* Image Cache */}
            <div className="mb-4">
              <h4 className="font-semibold mb-2 text-sm">이미지 캐시</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <MetricCard
                  label="저장 용량"
                  value={cacheUtils.formatSize(metrics.cache.imageCache.size)}
                  color="purple"
                  small
                />
                <MetricCard
                  label="항목 수"
                  value={metrics.cache.imageCache.items}
                  color="blue"
                  small
                />
                <MetricCard
                  label="히트율"
                  value={`${metrics.cache.imageCache.hitRate.toFixed(1)}%`}
                  color={metrics.cache.imageCache.hitRate > 50 ? 'green' : 'yellow'}
                  small
                />
              </div>
            </div>

            {/* Conversation Cache */}
            <div>
              <h4 className="font-semibold mb-2 text-sm">대화 캐시</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <MetricCard
                  label="항목 수"
                  value={metrics.cache.conversationCache.entries}
                  color="purple"
                  small
                />
                <MetricCard
                  label="메모리"
                  value={conversationCacheUtils.formatMemory(metrics.cache.conversationCache.memory)}
                  color="blue"
                  small
                />
                <MetricCard
                  label="히트율"
                  value={`${metrics.cache.conversationCache.hitRate.toFixed(1)}%`}
                  color={metrics.cache.conversationCache.hitRate > 50 ? 'green' : 'yellow'}
                  small
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
  small?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, color, small }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-3 ${small ? 'p-2' : 'p-3'}`}>
      <div className={`text-xs opacity-75 mb-1 ${small ? 'text-[10px]' : ''}`}>{label}</div>
      <div className={`font-bold font-mono ${small ? 'text-sm' : 'text-lg'}`}>{value}</div>
    </div>
  );
};

export { tracker, trackAPICall };
