/**
 * 테마별 펫 스킨 시스템
 * - 다크/라이트 모드별 색상 팔레트
 * - 동적 프롬프트 생성
 */

export type SkinTheme = 'dark' | 'light';

interface SkinPalette {
  primary: string;       // 메인 컬러
  secondary: string;     // 보조 컬러
  accent: string;        // 강조 컬러
  background: string;    // 배경 분위기
  atmosphere: string;    // 전체 분위기
  lighting: string;      // 조명 설정
}

interface ThemeSkins {
  dark: SkinPalette;
  light: SkinPalette;
}

/**
 * 테마별 색상 팔레트 정의
 */
const THEME_PALETTES: ThemeSkins = {
  dark: {
    primary: 'deep purple and dark blue tones',
    secondary: 'cyan and teal accents',
    accent: 'glowing neon highlights',
    background: 'dark starry night sky, cosmic nebula',
    atmosphere: 'mysterious, dreamy, ethereal',
    lighting: 'soft moonlight, bioluminescent glow, rim lighting'
  },
  light: {
    primary: 'soft pastel pink and warm yellow',
    secondary: 'mint green and sky blue',
    accent: 'golden sun highlights',
    background: 'bright sunny meadow, fluffy white clouds',
    atmosphere: 'cheerful, warm, welcoming',
    lighting: 'soft natural sunlight, warm golden hour glow'
  }
};

/**
 * 감정별 추가 색상 변형
 */
const EMOTION_COLOR_MODIFIERS: Record<string, { dark: string; light: string }> = {
  joy: {
    dark: 'sparkling stardust, vibrant purple-blue gradients',
    light: 'sunny yellow sparkles, warm peachy glow'
  },
  sadness: {
    dark: 'deep indigo shadows, cool blue tones',
    light: 'soft grey-blue tints, gentle rainy atmosphere'
  },
  anger: {
    dark: 'intense crimson and deep magenta accents',
    light: 'bold orange-red highlights, energetic warm tones'
  },
  fear: {
    dark: 'dark shadows, eerie purple-black gradients',
    light: 'pale lavender, misty white-grey atmosphere'
  },
  surprise: {
    dark: 'electric cyan sparks, bright teal flashes',
    light: 'bright white sparkles, fresh mint highlights'
  },
  love: {
    dark: 'romantic deep rose, soft magenta glow',
    light: 'rosy pink hearts, coral and peach tones'
  },
  trust: {
    dark: 'serene deep blue, calming violet hues',
    light: 'gentle sky blue, soft aqua tones'
  },
  anticipation: {
    dark: 'glowing amber, mysterious gold shimmer',
    light: 'bright lemon yellow, vibrant lime accents'
  },
  disgust: {
    dark: 'murky green-grey, toxic purple edges',
    light: 'muted olive green, earthy moss tones'
  },
  curiosity: {
    dark: 'mystical violet, twinkling star patterns',
    light: 'bright turquoise, playful rainbow hints'
  }
};

/**
 * 레벨별 스타일 변형
 */
const LEVEL_STYLE_THEMES: Record<number, { dark: string; light: string }> = {
  1: {
    dark: 'tiny chibi style, glowing in darkness',
    light: 'tiny chibi style, basking in sunlight'
  },
  2: {
    dark: 'cute chibi, subtle cosmic particles',
    light: 'cute chibi, surrounded by flower petals'
  },
  3: {
    dark: 'growing chibi, ethereal aura beginning',
    light: 'growing chibi, gentle rainbow shimmer'
  },
  4: {
    dark: 'confident pose, starlight trails',
    light: 'confident pose, sunbeam trails'
  },
  5: {
    dark: 'dynamic chibi, magical energy swirls',
    light: 'dynamic chibi, natural energy swirls'
  },
  6: {
    dark: 'semi-realistic, moonlit mystique',
    light: 'semi-realistic, daylight radiance'
  },
  7: {
    dark: 'detailed character, cosmic crown',
    light: 'detailed character, floral crown'
  },
  8: {
    dark: 'powerful aura, galaxy background',
    light: 'powerful aura, sky garden background'
  },
  9: {
    dark: 'majestic form, nebula wings',
    light: 'majestic form, butterfly wings'
  },
  10: {
    dark: 'divine presence, black hole portal',
    light: 'divine presence, heaven portal'
  },
  11: {
    dark: 'transcendent singularity, void aesthetics',
    light: 'transcendent singularity, light aesthetics'
  }
};

/**
 * 스킨 프롬프트 생성기
 */
class PetSkinGenerator {
  /**
   * 기본 스킨 프롬프트 생성
   */
  generateSkinPrompt(
    emotion: string,
    level: number,
    theme: SkinTheme,
    baseCharacter: string = 'Hatchi the adorable creature'
  ): string {
    const palette = THEME_PALETTES[theme];
    const emotionColors = EMOTION_COLOR_MODIFIERS[emotion]?.[theme] || '';
    const levelStyle = LEVEL_STYLE_THEMES[level]?.[theme] || '';

    return `
${baseCharacter}, ${levelStyle}.
Showing "${emotion}" emotion with expressive features.

COLOR PALETTE (${theme} theme):
- Primary colors: ${palette.primary}
- Secondary colors: ${palette.secondary}
- Accent highlights: ${palette.accent}
${emotionColors ? `- Emotion-specific: ${emotionColors}` : ''}

ENVIRONMENT:
- Background: ${palette.background}
- Atmosphere: ${palette.atmosphere}
- Lighting: ${palette.lighting}

STYLE:
- High quality digital art
- Soft painterly rendering
- Cohesive ${theme} theme aesthetic
- Full body character design
- Centered composition
`.trim();
  }

  /**
   * 표정 클로즈업 프롬프트 (테마 적용)
   */
  generateExpressionPrompt(
    emotion: string,
    intensity: number,
    theme: SkinTheme,
    baseCharacter: string = 'Hatchi'
  ): string {
    const palette = THEME_PALETTES[theme];
    const emotionColors = EMOTION_COLOR_MODIFIERS[emotion]?.[theme] || '';

    return `
Close-up portrait of ${baseCharacter}'s face showing "${emotion}" emotion.
Intensity: ${intensity}/10

THEME: ${theme} mode
- Color tone: ${palette.primary}
- Eye color: ${emotionColors || palette.accent}
- Lighting: ${palette.lighting}
- Atmosphere: ${palette.atmosphere}

IMPORTANT: Keep only facial features changes (eyes, mouth, cheeks).
Maintain overall character design consistency.
Subtle, natural emotion expression.
`.trim();
  }

  /**
   * 레벨업 이벤트 프롬프트 (테마 적용)
   */
  generateLevelUpPrompt(
    level: number,
    theme: SkinTheme,
    baseCharacter: string = 'Hatchi'
  ): string {
    const palette = THEME_PALETTES[theme];
    const levelStyle = LEVEL_STYLE_THEMES[level]?.[theme] || '';

    const celebrationElements = theme === 'dark'
      ? 'cosmic fireworks, stardust explosion, magical purple-blue particles'
      : 'confetti shower, rainbow sparkles, golden light rays';

    return `
${baseCharacter} celebrating evolution to Level ${level}!
${levelStyle}

CELEBRATION (${theme} theme):
- Effects: ${celebrationElements}
- Background: ${palette.background} with celebration atmosphere
- Lighting: ${palette.lighting} enhanced with joy
- Mood: triumphant, exciting, magical

VISUAL ENHANCEMENT:
- Dynamic pose showing happiness
- Glowing aura around character
- Particle effects matching ${theme} theme
- Vibrant and energetic composition
`.trim();
  }

  /**
   * 특별 이벤트 프롬프트 (테마 적용)
   */
  generateEventPrompt(
    eventType: 'milestone' | 'achievement' | 'special',
    description: string,
    theme: SkinTheme,
    baseCharacter: string = 'Hatchi'
  ): string {
    const palette = THEME_PALETTES[theme];
    
    const eventEffects: Record<typeof eventType, { dark: string; light: string }> = {
      milestone: {
        dark: 'shooting stars, cosmic achievement badge',
        light: 'golden trophy, sunburst rays'
      },
      achievement: {
        dark: 'glowing constellation pattern, stellar crown',
        light: 'laurel wreath, victory ribbon, shimmering medal'
      },
      special: {
        dark: 'mystical portal, ethereal aurora',
        light: 'magical garden gate, butterfly swarm'
      }
    };

    const effects = eventEffects[eventType][theme];

    return `
${baseCharacter} experiencing special moment: "${description}"

SPECIAL EVENT (${theme} theme):
- Event type: ${eventType}
- Special effects: ${effects}
- Colors: ${palette.primary} with ${palette.accent}
- Background: ${palette.background}
- Atmosphere: celebratory, memorable, unique
- Lighting: ${palette.lighting} with dramatic emphasis

COMPOSITION:
- Cinematic angle
- Character as focal point
- Rich environmental details
- Emotionally impactful scene
`.trim();
  }

  /**
   * 테마 전환 미리보기 프롬프트
   */
  generateThemePreview(
    currentEmotion: string,
    currentLevel: number,
    targetTheme: SkinTheme
  ): string {
    return this.generateSkinPrompt(currentEmotion, currentLevel, targetTheme);
  }
}

// 싱글톤 인스턴스
export const petSkinGenerator = new PetSkinGenerator();

/**
 * 테마 설정 관리
 */
interface SkinSettings {
  theme: SkinTheme;
  autoSwitch: boolean;        // 시스템 테마 자동 전환
  customCharacter?: string;    // 커스텀 캐릭터 이름
  enhancedEffects: boolean;    // 강화된 이펙트
}

class SkinSettingsManager {
  private storageKey = 'saessak-skin-settings';
  
  getSettings(): SkinSettings {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load skin settings:', error);
    }
    
    // 기본값
    return {
      theme: 'dark',
      autoSwitch: true,
      enhancedEffects: true
    };
  }
  
  saveSettings(settings: SkinSettings): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save skin settings:', error);
    }
  }
  
  updateTheme(theme: SkinTheme): void {
    const settings = this.getSettings();
    settings.theme = theme;
    this.saveSettings(settings);
  }
  
  toggleAutoSwitch(): boolean {
    const settings = this.getSettings();
    settings.autoSwitch = !settings.autoSwitch;
    this.saveSettings(settings);
    return settings.autoSwitch;
  }
  
  setCustomCharacter(name: string | undefined): void {
    const settings = this.getSettings();
    settings.customCharacter = name;
    this.saveSettings(settings);
  }
  
  toggleEnhancedEffects(): boolean {
    const settings = this.getSettings();
    settings.enhancedEffects = !settings.enhancedEffects;
    this.saveSettings(settings);
    return settings.enhancedEffects;
  }
}

export const skinSettings = new SkinSettingsManager();

/**
 * 유틸리티 함수들
 */
export const skinUtils = {
  /**
   * 테마에 맞는 색상 가져오기
   */
  getThemeColors(theme: SkinTheme) {
    return THEME_PALETTES[theme];
  },

  /**
   * 감정별 색상 가져오기
   */
  getEmotionColors(emotion: string, theme: SkinTheme) {
    return EMOTION_COLOR_MODIFIERS[emotion]?.[theme] || '';
  },

  /**
   * 테마 이름 포맷
   */
  formatThemeName(theme: SkinTheme): string {
    return theme === 'dark' ? '다크 모드' : '라이트 모드';
  },

  /**
   * 테마 아이콘
   */
  getThemeIcon(theme: SkinTheme): string {
    return theme === 'dark' ? '🌙' : '☀️';
  },

  /**
   * 대비 색상 (UI용)
   */
  getContrastColor(theme: SkinTheme): string {
    return theme === 'dark' ? '#ffffff' : '#000000';
  }
};
