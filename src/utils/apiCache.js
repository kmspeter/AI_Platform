import { resolveApiUrl } from '../config/api';

// API 캐싱 유틸리티
class ApiCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5분 기본 TTL
  }

  // 캐시 키 생성
  generateKey(url, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${url}${paramString ? '?' + paramString : ''}`;
  }

  // 캐시에서 데이터 가져오기
  get(key, ttl = this.defaultTTL) {
    const data = this.cache.get(key);
    const timestamp = this.timestamps.get(key);
    
    if (!data || !timestamp) {
      return null;
    }

    // TTL 체크
    if (Date.now() - timestamp > ttl) {
      this.delete(key);
      return null;
    }

    console.log(`Cache hit for: ${key}`);
    return data;
  }

  // 캐시에 데이터 저장
  set(key, data) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());
    console.log(`Cache set for: ${key}`);
  }

  // 캐시에서 데이터 삭제
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
    console.log(`Cache deleted for: ${key}`);
  }

  // 전체 캐시 클리어
  clear() {
    this.cache.clear();
    this.timestamps.clear();
    console.log('Cache cleared');
  }

  // 특정 패턴의 캐시 무효화
  invalidatePattern(pattern) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.delete(key));
  }

  // 캐시 상태 확인
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 싱글톤 인스턴스
export const apiCache = new ApiCache();

// 캐시된 fetch 함수
export const cachedFetch = async (url, options = {}, ttl) => {
  const { forceRefresh = false, ...fetchOptions } = options;
  const finalUrl = resolveApiUrl(url);
  const cacheKey = apiCache.generateKey(finalUrl, fetchOptions);

  // 강제 새로고침이 아닌 경우 캐시 확인
  if (!forceRefresh) {
    const cachedData = apiCache.get(cacheKey, ttl);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    console.log(`Fetching from API: ${finalUrl}`);
    const response = await fetch(finalUrl, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 성공한 응답만 캐시
    apiCache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};