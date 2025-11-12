/**
 * 애니메이션 유틸리티
 * 레벨업, 감정 변화 등의 애니메이션 효과
 */

/**
 * 레벨업 애니메이션 트리거
 */
export function triggerLevelUpAnimation(element: HTMLElement): void {
  // 기존 클래스 제거
  element.classList.remove('animate-level-up');
  
  // 리플로우 강제
  void element.offsetWidth;
  
  // 애니메이션 클래스 추가
  element.classList.add('animate-level-up');
  
  // 애니메이션 종료 후 클래스 제거
  setTimeout(() => {
    element.classList.remove('animate-level-up');
  }, 2000);
}

/**
 * 감정 변화 애니메이션 트리거
 */
export function triggerEmotionChangeAnimation(element: HTMLElement, emotion: string): void {
  element.classList.remove('animate-emotion-change');
  void element.offsetWidth;
  element.classList.add('animate-emotion-change');
  
  // 감정별 색상 효과
  element.setAttribute('data-emotion', emotion);
  
  setTimeout(() => {
    element.classList.remove('animate-emotion-change');
  }, 1000);
}

/**
 * EXP 획득 애니메이션 트리거
 */
export function triggerExpGainAnimation(element: HTMLElement, exp: number): void {
  element.classList.remove('animate-exp-gain');
  void element.offsetWidth;
  element.classList.add('animate-exp-gain');
  
  // EXP 텍스트 표시
  const expText = document.createElement('div');
  expText.className = 'exp-popup';
  expText.textContent = `+${exp} EXP`;
  element.appendChild(expText);
  
  setTimeout(() => {
    element.classList.remove('animate-exp-gain');
    expText.remove();
  }, 1500);
}

/**
 * 펄스 애니메이션 (호흡 효과)
 */
export function startPulseAnimation(element: HTMLElement): () => void {
  element.classList.add('animate-pulse-breathing');
  
  return () => {
    element.classList.remove('animate-pulse-breathing');
  };
}

/**
 * 이미지 페이드 전환
 */
export function fadeTransition(
  element: HTMLImageElement,
  newSrc: string,
  duration: number = 500
): Promise<void> {
  return new Promise((resolve) => {
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    element.style.opacity = '0';
    
    setTimeout(() => {
      element.src = newSrc;
      element.style.opacity = '1';
      
      setTimeout(() => {
        element.style.transition = '';
        resolve();
      }, duration);
    }, duration);
  });
}

/**
 * 스케일 바운스 애니메이션
 */
export function bounceScale(element: HTMLElement): void {
  element.classList.remove('animate-bounce-scale');
  void element.offsetWidth;
  element.classList.add('animate-bounce-scale');
  
  setTimeout(() => {
    element.classList.remove('animate-bounce-scale');
  }, 600);
}

/**
 * 빛나는 효과 (레벨업시)
 */
export function addGlowEffect(element: HTMLElement, duration: number = 2000): void {
  element.classList.add('glow-effect');
  
  setTimeout(() => {
    element.classList.remove('glow-effect');
  }, duration);
}

/**
 * 파티클 효과 생성 (축하 효과)
 */
export function createParticles(container: HTMLElement, count: number = 20): void {
  const colors = ['#A855F7', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
  
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'celebration-particle';
    particle.style.cssText = `
      position: absolute;
      width: 8px;
      height: 8px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: 50%;
      pointer-events: none;
      top: 50%;
      left: 50%;
      animation: particle-burst ${1 + Math.random()}s ease-out forwards;
      transform: translate(-50%, -50%);
      --angle: ${Math.random() * 360}deg;
      --distance: ${50 + Math.random() * 100}px;
    `;
    
    container.appendChild(particle);
    
    setTimeout(() => {
      particle.remove();
    }, 2000);
  }
}
