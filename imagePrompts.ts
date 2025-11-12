import type { Emotion, PetType } from './types';

/**
 * 감정별 상세 이미지 프롬프트 설명
 */
export const EMOTION_DESCRIPTORS: Record<Emotion, string> = {
  joy: "with a bright smile, sparkling eyes, jumping or dancing joyfully, surrounded by colorful hearts and stars",
  sadness: "with teary eyes, drooping posture, sitting alone, rain clouds or blue tones in background",
  outburst: "with explosive energy, wide open mouth shouting, lightning or fire effects, dynamic action pose",
  irritable: "with furrowed brows, crossed arms, grumpy expression, small storm clouds or thorny vines around",
  timid: "hiding partially, peeking shyly, blushing cheeks, gentle pastel colors, soft lighting",
  anxiety: "with worried eyes, fidgeting hands, sweat drops, chaotic swirling background patterns",
  flustered: "with blushing face, dizzy swirls around head, heart-shaped eyes, scattered flower petals",
  envy: "with side-glancing eyes, slightly pouty lips, green tinted atmosphere, looking at something distant",
  boredom: "with half-closed eyes, yawning, slouched posture, grey monotone background, maybe a clock",
  exhaustion: "lying down or slumped over, heavy eyelids, tired expression, dark circles, dim lighting"
};

/**
 * 레벨별 스타일 가이드
 */
export const LEVEL_STYLES: Record<number, string> = {
  1: "tiny, simple, chibi style, very cute and innocent",
  2: "small, adorable, basic features, childlike appearance",
  3: "growing size, more detailed features, curious expression",
  4: "medium size, playful details, energetic appearance",
  5: "well-defined features, confident posture, vibrant colors",
  6: "mature appearance, wise expression, subtle glow effect",
  7: "elegant design, mentor-like aura, sophisticated details",
  8: "advanced form, mystical elements, ethereal glow",
  9: "transcendent appearance, cosmic background, divine light",
  10: "ultimate form, singularity aesthetic, abstract perfection",
  11: "beyond comprehension, multidimensional, infinite beauty"
};

/**
 * 배경 스타일 옵션
 */
export const BACKGROUND_STYLES = [
  "soft gradient pastel colors",
  "abstract geometric shapes",
  "dreamy watercolor wash",
  "minimalist solid color",
  "subtle bokeh effect",
  "cosmic starry pattern",
  "nature-inspired elements"
];

/**
 * 펫 타입별 기본 특징
 */
export const PET_TYPE_FEATURES: Record<PetType, string> = {
  hatchi: "rounded body, striped arms and tail, cute fangs, big expressive eyes, pink color palette"
};

/**
 * 이미지 생성 프롬프트를 구성합니다
 */
export function buildImagePrompt(
  petType: PetType,
  level: number,
  emotion: Emotion,
  levelName: string,
  includeBackground: boolean = true
): string {
  const typeFeatures = PET_TYPE_FEATURES[petType];
  const levelStyle = LEVEL_STYLES[level] || LEVEL_STYLES[1];
  const emotionDesc = EMOTION_DESCRIPTORS[emotion];
  const background = includeBackground 
    ? BACKGROUND_STYLES[Math.floor(Math.random() * BACKGROUND_STYLES.length)]
    : "transparent background";

  return `A digital art illustration of a level ${level} ${petType} character (${levelName}). 
Features: ${typeFeatures}. 
Style: ${levelStyle}. 
Emotion: ${emotionDesc}. 
Background: ${background}. 
Art style: cute, modern, clean digital art with soft shading, high quality, professional illustration.`;
}

/**
 * 대화 중 감정에 따른 실시간 표정 변화 프롬프트
 */
export function buildExpressionPrompt(
  petType: PetType,
  emotion: Emotion,
  intensity: number = 5.0
): string {
  const typeFeatures = PET_TYPE_FEATURES[petType];
  const emotionDesc = EMOTION_DESCRIPTORS[emotion];
  const intensityDesc = intensity > 7 
    ? "very strong" 
    : intensity > 4 
    ? "moderate" 
    : "subtle";

  return `A close-up facial expression of a ${petType} character. 
Features: ${typeFeatures}. 
Show ${intensityDesc} ${emotion} emotion: ${emotionDesc}. 
Focus on facial details and expression. 
Simple background, clean digital art style.`;
}

/**
 * 특별 이벤트용 이미지 프롬프트 (레벨업, 기념일 등)
 */
export function buildEventPrompt(
  petType: PetType,
  level: number,
  eventType: 'levelup' | 'milestone' | 'achievement',
  levelName: string
): string {
  const typeFeatures = PET_TYPE_FEATURES[petType];
  const levelStyle = LEVEL_STYLES[level] || LEVEL_STYLES[1];

  const eventEffects = {
    levelup: "surrounded by glowing light, sparkling particles, evolution energy, triumphant pose",
    milestone: "standing on a podium, confetti and fireworks, celebratory atmosphere",
    achievement: "holding a trophy or medal, proud expression, golden light rays"
  };

  return `A special event illustration of a level ${level} ${petType} (${levelName}). 
Features: ${typeFeatures}. 
Style: ${levelStyle}. 
Event: ${eventEffects[eventType]}. 
Epic, cinematic composition with dynamic lighting and particle effects. 
High quality digital art with vibrant colors and celebratory mood.`;
}
