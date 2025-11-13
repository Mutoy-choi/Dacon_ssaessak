import type { PromptSettings } from '../types';

const STORAGE_KEY = 'ame-prompt-settings';

const DEFAULT_ANALYSIS_TEMPLATE = `You are an emotion analysis AI for the A. me system. Analyze the user's log entry and provide a summary, calculate Experience Points (XP), and rate 10 emotions on a scale of 0.0 to 10.0.

User Log: "{{log}}"

RULES:
- XP should be between 5 and 25, based on the length and emotional depth of the log.
- Your response MUST be a valid JSON object following the provided schema.`;

export const DEFAULT_PROMPT_SETTINGS: PromptSettings = {
  analysisTemplate: DEFAULT_ANALYSIS_TEMPLATE,
  systemAppendix: '',
};

const readStorage = (): Partial<PromptSettings> | null => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return typeof parsed === 'object' && parsed ? parsed as Partial<PromptSettings> : null;
  } catch (error) {
    console.warn('Failed to load prompt settings from storage:', error);
    return null;
  }
};

const writeStorage = (settings: PromptSettings) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to persist prompt settings:', error);
  }
};

const normaliseSettings = (raw: Partial<PromptSettings> | null): PromptSettings => {
  const base: PromptSettings = { ...DEFAULT_PROMPT_SETTINGS };
  if (!raw) return base;

  return {
    analysisTemplate: typeof raw.analysisTemplate === 'string' && raw.analysisTemplate.trim()
      ? raw.analysisTemplate
      : base.analysisTemplate,
    systemAppendix: typeof raw.systemAppendix === 'string'
      ? raw.systemAppendix
      : base.systemAppendix,
  };
};

export const getPromptSettings = (): PromptSettings => {
  const raw = readStorage();
  return normaliseSettings(raw);
};

export const savePromptSettings = (settings: PromptSettings): PromptSettings => {
  const normalised = normaliseSettings(settings);
  writeStorage(normalised);
  return normalised;
};

export const resetPromptSettings = (): PromptSettings => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to reset prompt settings:', error);
    }
  }
  return { ...DEFAULT_PROMPT_SETTINGS };
};

export const applyLogTemplate = (template: string, log: string): string => {
  const fallback = template || DEFAULT_PROMPT_SETTINGS.analysisTemplate;
  const replaced = fallback.replace(/\{\{\s*log\s*\}\}/gi, log);
  return replaced.includes('{{') ? replaced.replace(/\{\{[^}]+\}\}/g, '') : replaced;
};
