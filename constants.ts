
import type { Provider, PetType } from './types';

export const PROVIDERS: Provider[] = [
  {
    id: 'google',
    name: 'Google Gemini',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google Gemini' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google Gemini' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini', provider: 'OpenAI' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'Anthropic' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'Anthropic' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    models: [
        { id: 'openrouter/anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'OpenRouter' },
        { id: 'openrouter/meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'OpenRouter' },
        { id: 'openrouter/mistralai/mistral-large', name: 'Mistral Large 2', provider: 'OpenRouter' },
        { id: 'openrouter/google/gemini-flash-1.5', name: 'Gemini 1.5 Flash', provider: 'OpenRouter' },
    ],
  },
];

export const PET_TYPES: { id: PetType; name: string; icon: string; }[] = [
    { id: 'hatchi', name: 'Hatchi', icon: '👾' },
];

export const LEVEL_THRESHOLDS = [
    0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000
];

export const LEVEL_NAMES = [
    "Infant", "Newborn", "Curious Companion", "Playful Partner", "Adept Apprentice", 
    "Wise Friend", "Insightful Mentor", "Evolved Entity", "Transcendent Being", "Singularity"
];
