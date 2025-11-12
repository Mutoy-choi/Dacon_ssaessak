# 🎨 v1.1 Feature Implementation Guide

## 새로 추가된 기능들

### 1. 🌙 다크모드/라이트모드 토글

#### 구현 내용
- **자동 테마 감지**: 시스템 설정에 따라 자동으로 다크/라이트 모드 적용
- **수동 토글**: 헤더의 토글 버튼으로 언제든지 변경 가능
- **LocalStorage 저장**: 사용자 설정 유지
- **부드러운 전환**: CSS transition으로 자연스러운 색상 변화

#### 사용 방법
```typescript
import { getTheme, setTheme, toggleTheme } from './utils/theme';

// 현재 테마 가져오기
const currentTheme = getTheme(); // 'dark' | 'light'

// 테마 설정
setTheme('dark');

// 토글
const newTheme = toggleTheme();
```

#### UI 위치
- 헤더 우측 상단에 해/달 아이콘 버튼
- 클릭시 즉시 전환 (0.3초 애니메이션)

---

### 2. ✨ 애니메이션 효과 시스템

#### 구현된 애니메이션

##### 레벨업 애니메이션
```typescript
triggerLevelUpAnimation(element);
```
- 2초간 스케일, 회전, 밝기 변화
- 파티클 효과 (30개의 색상 파티클 폭발)
- 빛나는 효과 (Glow)

##### 감정 변화 애니메이션
```typescript
triggerEmotionChangeAnimation(element, emotion);
```
- 1초간 부드러운 스케일 변화
- 감정별 색상 Glow 효과
  - joy: 노란색
  - sadness: 파란색
  - outburst: 빨간색
  - anxiety: 보라색

##### EXP 획득 애니메이션
```typescript
triggerExpGainAnimation(element, exp);
```
- "+15 EXP" 텍스트 팝업
- 위로 떠오르며 페이드아웃
- 1.5초 지속

##### 이미지 페이드 전환
```typescript
await fadeTransition(imageElement, newSrc, 500);
```
- 기존 이미지 페이드아웃
- 새 이미지 로드
- 새 이미지 페이드인

##### 호흡 효과 (Idle 상태)
```typescript
const stopPulse = startPulseAnimation(element);
// 나중에 중지: stopPulse();
```
- 3초 주기로 부드럽게 커졌다 작아짐
- 살아있는 느낌 표현

#### CSS 클래스 직접 사용
```html
<div class="animate-level-up">레벨업!</div>
<div class="animate-emotion-change" data-emotion="joy">표정 변화</div>
<div class="animate-pulse-breathing">호흡 효과</div>
<div class="shimmer">로딩 중...</div>
```

---

### 3. 🎭 실시간 표정 변화 (Nano Banana 스타일)

#### 구현 내용
대화 중 감정 분석 결과에 따라 펫의 표정이 **미세하게** 변화합니다.

#### 작동 방식
```typescript
// 1. 대화 분석 후 감정 점수 획득
const analysis = await analyzeLog(userMessage);
// emotions: { joy: 8.5, sadness: 2.0, ... }

// 2. 주된 감정 파악
const dominantEmotion = 'joy';

// 3. 실시간 표정 업데이트
const updatedImage = await updateLiveExpression(
  currentImageUrl,
  dominantEmotion,
  8.5  // intensity
);

// 4. 부드럽게 이미지 전환
await fadeTransition(petImageRef.current, updatedImage, 400);
```

#### 특징
- **미세한 변화만**: 전체 디자인 유지, 눈/입 등 세부만 조정
- **연속성 보장**: Base64 이미지 편집으로 일관된 스타일
- **실패 안전**: 이미지 생성 실패시 기존 이미지 유지
- **비동기 처리**: 대화 흐름 방해 없음

#### 감정별 표현
```typescript
joy:        밝은 미소, 반짝이는 눈
sadness:    눈물, 축 처진 자세
outburst:   크게 벌린 입, 폭발적 에너지
irritable:  찌푸린 눈썹, 팔짱
timid:      수줍게 숨음, 붉어진 뺨
anxiety:    걱정스러운 눈, 땀방울
flustered:  붉어진 얼굴, 어지러운 소용돌이
envy:       옆눈질, 초록빛 분위기
boredom:    하품, 반감긴 눈
exhaustion: 누워있음, 다크서클
```

---

### 4. 🎨 개선된 이미지 프롬프트 시스템

#### imagePrompts.ts
모든 이미지 생성을 체계적으로 관리:

```typescript
// 일반 이미지 생성
buildImagePrompt(petType, level, emotion, levelName);

// 표정 변화용 (실시간)
buildExpressionPrompt(petType, emotion, intensity);

// 이벤트 이미지 (레벨업, 마일스톤)
buildEventPrompt(petType, level, 'levelup', levelName);
```

#### 3가지 프롬프트 타입
1. **Full Image**: 전신 + 배경 (레벨업시)
2. **Expression**: 얼굴 클로즈업 (실시간 변화)
3. **Event**: 특수 효과 포함 (축하, 업적)

---

## 🎯 사용 시나리오

### 시나리오 1: 일반 대화
```
User: "오늘 정말 좋은 일이 있었어!"
↓
1. AI 응답 생성
2. 감정 분석: joy 8.5, happiness 7.0
3. +18 EXP 획득 (팝업 애니메이션)
4. 펫 표정이 밝은 미소로 변화 (페이드 전환)
5. 호흡 애니메이션 지속
```

### 시나리오 2: 레벨업
```
누적 EXP 100 도달
↓
1. "✨ Your companion is evolving! ✨" 메시지
2. 레벨업 애니메이션 (스케일, 회전, 밝기)
3. 파티클 폭발 효과 (30개)
4. 새로운 이미지 생성 (진화된 모습)
5. 페이드 전환 (0.8초)
6. "🎉 Congratulations! Level 2!" 메시지
```

### 시나리오 3: 테마 전환
```
해 아이콘 클릭
↓
1. 테마 변수 변경 (dark → light)
2. 모든 요소 0.3초 전환
3. LocalStorage 저장
4. 아이콘 변경 (해 → 달)
```

---

## 📊 성능 최적화

### 이미지 생성
- **레벨업만 필수**: 실시간 표정은 optional
- **실패 처리**: try-catch로 앱 크래시 방지
- **캐싱**: Base64 이미지 재사용

### 애니메이션
- **GPU 가속**: transform, opacity 사용
- **Reduced Motion**: 접근성 설정 감지
- **자동 정리**: setTimeout 후 클래스 제거

### 테마 전환
- **CSS 변수**: 한 번에 전체 색상 변경
- **Transition**: 0.3초로 제한
- **LocalStorage**: 최소한의 데이터만 저장

---

## 🐛 알려진 제한사항

1. **이미지 생성 속도**: Gemini API 응답 시간 (3-5초)
2. **실시간 표정**: 매번 생성하면 느림 → 주요 감정 변화시만
3. **애니메이션**: 너무 많으면 산만함 → 적절히 사용
4. **테마 전환**: 이미지는 전환 안됨 (펫 이미지만 유지)

---

## 🔮 향후 개선 계획

### v1.2
- [ ] 이미지 캐싱 시스템
- [ ] 애니메이션 커스터마이징
- [ ] 테마별 펫 스킨
- [ ] 음성 대화시 입 움직임 애니메이션

### v1.3
- [ ] 3D 펫 모델 (Three.js)
- [ ] 물리 엔진 (중력, 반동)
- [ ] 파티클 시스템 확장
- [ ] 날씨/시간대 반영

---

## 📝 개발자 노트

### 애니메이션 타이밍
```
레벨업:     2000ms (임팩트)
감정 변화:  1000ms (자연스럽게)
EXP 획득:   1500ms (명확하게)
이미지 전환: 400-800ms (부드럽게)
호흡:       3000ms (차분하게)
```

### CSS 클래스 명명 규칙
```
animate-*:  애니메이션 트리거
transition-*: 전환 속도
hover-*:    호버 효과
glow-*:     빛나는 효과
```

### 코드 구조
```
utils/
  ├── theme.ts         # 테마 관리
  ├── animations.ts    # 애니메이션 함수
  └── storage.ts       # 데이터 관리

styles/
  └── animations.css   # 애니메이션 정의

components/
  └── ThemeToggle.tsx  # 테마 토글 버튼
```

---

## 🎉 완료!

v1.1의 모든 핵심 기능이 구현되었습니다:
- ✅ 다크모드/라이트모드
- ✅ 애니메이션 시스템
- ✅ 실시간 표정 변화
- ✅ Nano Banana 스타일 이미지 편집

**Made with 💚 by Team Saessak**
