
export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  logAnalysis?: LogAnalysis;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
}

export interface Provider {
  id: string;
  name: string;
  models: Model[];
}

// New types for A. me
export type PetType = 'hatchi';

export const PET_EMOTIONS = [
  'joy', 'sadness', 'outburst', 'irritable', 'timid',
  'anxiety', 'flustered', 'envy', 'boredom', 'exhaustion'
] as const;

export type Emotion = typeof PET_EMOTIONS[number];

export type EmotionSet = Record<Emotion, number>;

export interface MajorEvent {
    timestamp: string;
    description: string;
}

export interface LogEntry {
    timestamp: string;
    summary: string;
    emotions: EmotionSet;
}

export interface PetState {
  type: PetType;
  name: string;
  level: number;
  exp: number;
  dominantEmotion: Emotion;
  imageUrl: string | null;
  logHistory: LogEntry[];
  majorEvents: MajorEvent[];
}

export interface LogAnalysis {
    query_summary: string;
    emotions: EmotionSet;
    xp: number;
}

export type ApiKeys = {
  openrouter?: string;
  anthropic?: string;
  openai?: string;
};
