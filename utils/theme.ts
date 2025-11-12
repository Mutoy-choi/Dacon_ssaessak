/**
 * 테마 관리 시스템
 * 다크모드/라이트모드 토글 및 로컬 저장
 */

export type Theme = 'light' | 'dark';

const THEME_KEY = 'ame-theme';

/**
 * 현재 테마 가져오기
 */
export function getTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    
    // 시스템 설정 확인
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'dark'; // 기본값
  } catch {
    return 'dark';
  }
}

/**
 * 테마 저장 및 적용
 */
export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  } catch (error) {
    console.error('Failed to save theme:', error);
  }
}

/**
 * DOM에 테마 클래스 적용
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}

/**
 * 테마 토글
 */
export function toggleTheme(): Theme {
  const current = getTheme();
  const newTheme: Theme = current === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  return newTheme;
}

/**
 * 초기 테마 설정
 */
export function initTheme(): void {
  const theme = getTheme();
  applyTheme(theme);
}

/**
 * 시스템 테마 변경 감지
 */
export function watchSystemTheme(callback: (theme: Theme) => void): () => void {
  if (!window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent) => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (!savedTheme) {
      const newTheme: Theme = e.matches ? 'dark' : 'light';
      applyTheme(newTheme);
      callback(newTheme);
    }
  };

  // Modern API
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }
  
  // Legacy API
  mediaQuery.addListener(handler);
  return () => mediaQuery.removeListener(handler);
}
