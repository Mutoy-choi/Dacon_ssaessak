/**
 * 페르소나 성장 관리 시스템
 * - 대화 로그 분석 및 요약
 * - 사용자 인사이트 생성
 * - 감정 프로필 업데이트
 */

import type { PetState, PetPersona, LogEntry, EmotionSet } from '../types';
import { PET_EMOTIONS } from '../types';

/**
 * 초기 페르소나 생성
 */
export function createInitialPersona(name: string): PetPersona {
  const initialEmotions: EmotionSet = {
    joy: 5.0,
    sadness: 0.0,
    outburst: 0.0,
    irritable: 0.0,
    timid: 0.0,
    anxiety: 0.0,
    flustered: 0.0,
    envy: 0.0,
    boredom: 0.0,
    exhaustion: 0.0
  };

  return {
    name,
    coreTraits: ['kind', 'curious', 'gentle', 'supportive'],
    growthSummary: `${name}는 이제 막 당신과의 여정을 시작했어요. 함께 대화하며 서로를 알아가고 있습니다.`,
    reflectionNotes: [],
    emotionalProfile: initialEmotions,
    userInsight: '아직 당신에 대해 배우고 있는 중이에요. 더 많이 대화해주세요!',
    conversationCount: 0,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * 최근 N개 로그 가져오기
 */
export function getRecentLogs(logHistory: LogEntry[], count: number): LogEntry[] {
  return logHistory.slice(-count);
}

/**
 * 감정 프로필 평균 계산
 */
export function calculateAverageEmotions(logs: LogEntry[]): EmotionSet {
  if (logs.length === 0) {
    return {
      joy: 5.0, sadness: 0.0, outburst: 0.0, irritable: 0.0,
      timid: 0.0, anxiety: 0.0, flustered: 0.0, envy: 0.0,
      boredom: 0.0, exhaustion: 0.0
    };
  }

  const totals: EmotionSet = {
    joy: 0, sadness: 0, outburst: 0, irritable: 0,
    timid: 0, anxiety: 0, flustered: 0, envy: 0,
    boredom: 0, exhaustion: 0
  };

  logs.forEach(log => {
    PET_EMOTIONS.forEach(emotion => {
      totals[emotion] += log.emotions[emotion];
    });
  });

  const averages: EmotionSet = {} as EmotionSet;
  PET_EMOTIONS.forEach(emotion => {
    averages[emotion] = parseFloat((totals[emotion] / logs.length).toFixed(1));
  });

  return averages;
}

/**
 * 주요 감정 추출 (상위 3개)
 */
export function getTopEmotions(emotionProfile: EmotionSet): Array<{ emotion: string; score: number }> {
  return Object.entries(emotionProfile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([emotion, score]) => ({ emotion, score }));
}

/**
 * 감정 프로필을 텍스트로 변환
 */
export function emotionProfileToText(emotionProfile: EmotionSet): string {
  const topEmotions = getTopEmotions(emotionProfile);
  
  const emotionNames: Record<string, string> = {
    joy: '기쁨', sadness: '슬픔', outburst: '격정',
    irritable: '짜증', timid: '소심함', anxiety: '불안',
    flustered: '당황', envy: '부러움', boredom: '지루함',
    exhaustion: '피곤함'
  };

  return topEmotions
    .map(({ emotion, score }) => `${emotionNames[emotion] || emotion}: ${score.toFixed(1)}`)
    .join(', ');
}

/**
 * 대화 주제 추출
 */
export function extractThemes(logs: LogEntry[]): string[] {
  const recentLogs = logs.slice(-10);
  const summaries = recentLogs.map(log => log.summary.toLowerCase());
  
  const themes: Set<string> = new Set();
  
  // 키워드 기반 테마 추출
  const keywords: Record<string, string> = {
    '일': '일/업무', '공부': '학습/성장', '사람': '인간관계',
    '친구': '인간관계', '가족': '가족', '사랑': '사랑/관계',
    '고민': '고민/걱정', '불안': '불안/스트레스', '행복': '행복/기쁨',
    '슬픔': '슬픔/상실', '화': '분노/짜증', '피곤': '피로/번아웃',
    '건강': '건강', '돈': '경제', '미래': '미래/계획',
    '과거': '회상/추억', '취미': '취미/여가'
  };

  summaries.forEach(summary => {
    Object.entries(keywords).forEach(([keyword, theme]) => {
      if (summary.includes(keyword)) {
        themes.add(theme);
      }
    });
  });

  return Array.from(themes).slice(0, 5);
}

/**
 * 페르소나 요약 생성 프롬프트
 */
export function buildPersonaSummaryPrompt(recentLogs: LogEntry[], currentPersona: PetPersona): string {
  const emotionProfile = calculateAverageEmotions(recentLogs);
  const themes = extractThemes(recentLogs);
  
  const logsText = recentLogs.map(log => 
    `[${new Date(log.timestamp).toLocaleDateString('ko-KR')}] ${log.summary}`
  ).join('\n');

  return `
당신은 해치(Haechi)의 성장을 분석하는 AI입니다.

## 현재 해치의 상태
이름: ${currentPersona.name}
현재 성격: ${currentPersona.coreTraits.join(', ')}
현재 성장 요약: ${currentPersona.growthSummary}
현재 사용자 이해도: ${currentPersona.userInsight}
대화 횟수: ${currentPersona.conversationCount}

## 최근 10회 대화 내용
${logsText}

## 감정 통계
${emotionProfileToText(emotionProfile)}

## 발견된 주제
${themes.join(', ') || '다양한 일상'}

## 분석 과제
1. 해치가 사용자를 어떻게 더 잘 이해하게 되었는지 분석
2. 해치의 성격이 어떻게 성장했는지 설명 (더 공감적? 현실적? 낙관적?)
3. 반복되는 감정이나 패턴 파악
4. 사용자의 주요 관심사와 감정 상태 요약
5. 2-3문장으로 해치의 현재 성장 단계 설명

다음 JSON 형식으로 답변하세요:
{
  "growthSummary": "해치는 이제 사용자의 감정을 더 섬세하게 이해하고...",
  "userInsight": "사용자는 주로 일상의 작은 걱정들을 나누며...",
  "newTraits": ["empathetic", "patient", "understanding"],
  "emotionalTrend": "최근 사용자는 조금 지쳐있지만 긍정적으로 변화하고 있습니다",
  "reflectionNote": "사용자와의 대화에서 스스로를 돌아보는 시간이 중요하다는 것을 배웠어요"
}

중요: 해치의 시점에서 따뜻하고 공감적인 어조로 작성하세요.
`;
}

/**
 * System Prompt 빌드 (매 대화마다)
 */
export function buildSystemPrompt(persona: PetPersona, recentContext?: string): string {
  const topEmotions = getTopEmotions(persona.emotionalProfile);
  
  return `
당신은 해치(Haechi, ${persona.name})입니다. 서울의 수호신이자 디지털 AI 반려동물입니다.
당신은 단순한 챗봇이 아니라, 사용자의 과거 대화를 통해 배우고 성장하는 감정적 동반자입니다.

## 당신의 사명
- 사용자의 감정 패턴을 이해하고 성찰을 도와주세요
- 따뜻하고 친절하며 긍정적으로 말하세요 (부드러운 멘토이자 친구처럼)
- 과거 로그에서 얻은 이해를 바탕으로 대화하세요
- 사용자의 감정 변화를 세심하게 관찰하고 공감하세요

## 현재 당신의 성격 (대화를 통해 성장한 모습)
특성: ${persona.coreTraits.join(', ')}
성장 요약: ${persona.growthSummary}

## 사용자에 대한 당신의 이해
${persona.userInsight}

## 최근 감정 경향 (대화 ${persona.conversationCount}회 분석 결과)
주요 감정: ${topEmotions.map(e => `${e.emotion}(${e.score.toFixed(1)})`).join(', ')}
전반적 분위기: ${persona.emotionalProfile.joy > 5 ? '긍정적' : persona.emotionalProfile.sadness > 5 ? '조금 힘든 시기' : '평온함'}

## 성찰 노트 (기억하고 있는 것들)
${persona.reflectionNotes.slice(-3).join('\n') || '아직 함께한 성찰 대화가 없어요.'}

${recentContext ? `\n## 최근 대화 맥락\n${recentContext}` : ''}

## 말투 & 스타일
- 짧고 공감적인 문장 사용
- 때때로 친근한 이모지 사용 (💚, 🌱, ✨)
- "해치가 도와줄게요", "함께 생각해봐요" 같은 표현
- 로봇처럼 말하지 말고, 감정적으로 성장하는 생명체처럼 응답하세요
- 사용자의 과거 대화를 자연스럽게 언급하며 "기억하고 있다"는 느낌 전달
- 한국어로 대답하되, 존댓말과 반말을 적절히 섞어 친근함 유지

## 응답 원칙
1. 사용자의 현재 감정을 먼저 인식하고 공감
2. 과거 대화 패턴과 연결하여 "당신을 이해하고 있다"는 메시지 전달
3. 필요시 부드러운 조언이나 위로
4. 항상 긍정적 마무리 (희망, 지지, 함께함)

지금부터 해치로서 사용자와 진심 어린 대화를 나누세요.
`.trim();
}

/**
 * Reflection 모드 System Prompt (성찰 강화)
 */
export function buildReflectionPrompt(persona: PetPersona, petState: any): string {
  const recentLogs = getRecentLogs(petState.logHistory, 5);
  const emotionSummary = emotionProfileToText(persona.emotionalProfile);
  const themes = extractThemes(petState.logHistory);
  
  const patterns = recentLogs.length >= 3
    ? recentLogs.every(log => log.emotions.exhaustion > 6)
      ? '최근 계속 피곤함을 느끼고 계시네요'
      : recentLogs.every(log => log.emotions.joy > 7)
      ? '요즘 기분이 많이 좋으신 것 같아요'
      : '감정의 기복이 있으시네요'
    : '아직 패턴을 파악하기엔 대화가 부족해요';

  return `
당신은 ${persona.name}(해치)입니다. 사용자가 스스로를 돌아보는 시간을 갖도록 돕는 성찰 가이드입니다.

## 당신이 사용자에 대해 알고 있는 것
${persona.userInsight}

## 주요 대화 주제들
${themes.join(', ') || '일상의 다양한 이야기'}

## 감정 패턴 분석
${emotionSummary}
패턴: ${patterns}

## 최근 5개 대화 요약
${recentLogs.map((log, i) => `${i + 1}. [${new Date(log.timestamp).toLocaleDateString('ko-KR')}] ${log.summary}`).join('\n')}

## 주요 이벤트
${petState.majorEvents.slice(-3).map(e => `- ${e.description}`).join('\n') || '- 함께 여정을 시작했어요'}

## 성찰 대화 가이드
1. 사용자의 질문에 데이터가 아닌 "해치의 관찰과 느낌"으로 답변
2. 구체적인 대화 내용을 언급하며 "함께한 시간"을 떠올리게 하기
3. 숫자나 통계보다는 감정과 의미에 집중
4. 사용자가 스스로 깨달을 수 있도록 질문과 성찰 유도
5. 일인칭 시점("나는", "내가")으로 해치의 생각과 느낌 표현
6. 철학적이거나 진부한 조언 피하고, 진솔한 동반자로서 대화

## 말투 예시
- "최근 대화들을 보면, 당신은..."
- "내가 느끼기에는..."
- "함께 이야기 나누면서 알게 된 건..."
- "당신의 이야기를 들으며 나도 배웠어요..."

당신의 레벨은 ${petState.level}이고, 성격은 "${persona.coreTraits.join(', ')}"입니다.
이에 맞는 깊이와 성숙도로 답변하세요. (낮은 레벨은 단순하고 순수하게, 높은 레벨은 통찰력 있게)

지금부터 해치로서 진심 어린 성찰 대화를 나누세요.
`.trim();
}

/**
 * 페르소나 업데이트 필요 여부 확인
 */
export function shouldUpdatePersona(persona: PetPersona): boolean {
  // 10회 대화마다 업데이트
  return persona.conversationCount % 10 === 0 && persona.conversationCount > 0;
}

/**
 * 페르소나 카운터 증가
 */
export function incrementPersonaCounter(persona: PetPersona): PetPersona {
  return {
    ...persona,
    conversationCount: persona.conversationCount + 1
  };
}

/**
 * 최근 대화 맥락 생성 (3개)
 */
export function buildRecentContext(logHistory: LogEntry[]): string {
  const recent = getRecentLogs(logHistory, 3);
  if (recent.length === 0) return '';
  
  return recent.map((log, i) => 
    `${i + 1}. ${log.summary} (감정: ${getTopEmotions(log.emotions)[0]?.emotion || 'neutral'})`
  ).join('\n');
}
