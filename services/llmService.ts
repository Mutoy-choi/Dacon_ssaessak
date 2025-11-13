import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { Message, LogAnalysis, PetState, EmotionSet, ApiKeys, Model, PetPersona } from '../types';
import { LEVEL_NAMES } from '../constants';
import { buildImagePrompt, buildExpressionPrompt, buildEventPrompt } from '../imagePrompts';
import { imageCache } from '../utils/imageCache';
import { conversationCache } from '../utils/conversationCache';
import { petSkinGenerator, skinSettings, type SkinTheme } from '../utils/petSkins';
import { trackAPICall } from '../components/PerformanceMonitor';
import { 
  buildSystemPrompt, 
  buildReflectionPrompt,
  buildPersonaSummaryPrompt,
  calculateAverageEmotions,
  getRecentLogs,
  buildRecentContext
} from '../utils/personaManager';
import { getPromptSettings, applyLogTemplate } from '../utils/promptSettings';

// FIX: Updated to exclusively use `process.env.API_KEY` and conform to `new GoogleGenAI({ apiKey: ... })` initialization.
const getGoogleAI = () => {
    const keyToUse = process.env.API_KEY;
    if (!keyToUse) {
        throw new Error("Gemini API key is not available. Please ensure process.env.API_KEY is set.");
    }
    return new GoogleGenAI({ apiKey: keyToUse });
};

const extractResponseText = (response: any): string | null => {
    if (!response) return null;

    const resolveText = (source: any) => {
        const value = source?.text;
        if (typeof value === 'function') {
            try {
                const result = value.call(source);
                return typeof result === 'string' ? result : null;
            } catch (error) {
                console.warn('Failed to invoke response.text():', error);
                return null;
            }
        }
        return typeof value === 'string' ? value : null;
    };

    const directText = resolveText(response) || resolveText(response?.response);
    if (directText && directText.trim()) {
        return directText;
    }

    const candidates = response?.candidates || response?.response?.candidates;
    const parts = candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
        const aggregated = parts
            .map((part: any) => {
                if (typeof part?.text === 'string') return part.text;
                if (part?.json !== undefined) return JSON.stringify(part.json);
                if (typeof part?.functionCall?.args === 'object') {
                    return JSON.stringify(part.functionCall.args);
                }
                return '';
            })
            .join('');
        if (aggregated.trim()) {
            return aggregated;
        }
    }

    const outputText = response?.output || response?.response?.output;
    if (typeof outputText === 'string' && outputText.trim()) {
        return outputText;
    }

    return null;
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        query_summary: { type: Type.STRING, description: "A 1-2 sentence objective summary of the user's log." },
        emotions: {
            type: Type.OBJECT,
            properties: {
                joy: { type: Type.NUMBER }, sadness: { type: Type.NUMBER }, outburst: { type: Type.NUMBER },
                irritable: { type: Type.NUMBER }, timid: { type: Type.NUMBER }, anxiety: { type: Type.NUMBER },
                flustered: { type: Type.NUMBER }, envy: { type: Type.NUMBER }, boredom: { type: Type.NUMBER },
                exhaustion: { type: Type.NUMBER },
            },
            required: ['joy', 'sadness', 'outburst', 'irritable', 'timid', 'anxiety', 'flustered', 'envy', 'boredom', 'exhaustion'],
        },
        xp: { type: Type.NUMBER, description: "Experience Points (XP) between 5 and 25." },
    },
    required: ['query_summary', 'emotions', 'xp'],
};

const normalizeBase64 = (payload: string | null | undefined): string | null => {
    if (!payload) return null;

    // Remove all whitespace, newlines, and other non-base64 characters
    const cleaned = payload
        .replace(/\s+/g, '')  // Remove all whitespace
        .replace(/[^A-Za-z0-9+/=]/g, '');  // Remove non-base64 chars

    if (!cleaned.length) return null;

    // Validate base64 format
    if (!/^[A-Za-z0-9+/]+=*$/.test(cleaned)) {
        console.warn('⚠️ Invalid Base64 format detected');
        return null;
    }

    return cleaned;
};

// FIX: Removed apiKey parameter to use the centralized `getGoogleAI` function.
export async function analyzeLog(log: string): Promise<LogAnalysis> {
  // 캐시 확인
  const cached = conversationCache.get(log);
  if (cached) {
    console.log('✅ Using cached conversation analysis');
    return {
      query_summary: cached.summary,
      emotions: cached.emotions as any,
      xp: cached.xp
    };
  }

  try {
    const startTime = performance.now();

    // API 키 체크
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is missing. Please check your environment configuration.');
    }

    const ai = getGoogleAI();
    const promptSettings = getPromptSettings();
    const prompt = applyLogTemplate(promptSettings.analysisTemplate, log);

    console.log(`📝 Analyzing log: "${log.slice(0, 50)}${log.length > 50 ? '...' : ''}"`);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: analysisSchema },
    });

    const responseText = extractResponseText(response);
    if (!responseText) {
        console.error('❌ Gemini returned empty response');
        throw new Error('Gemini returned an empty analysis response.');
    }

    let result: LogAnalysis;
    try {
        result = JSON.parse(responseText.trim());
    } catch (parseError) {
        console.error('❌ JSON parsing failed. Response was:', responseText.slice(0, 200));
        throw new Error(`Failed to parse analysis response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    // 결과 검증
    if (!result.query_summary || !result.emotions || typeof result.xp !== 'number') {
        console.error('❌ Invalid analysis result structure:', result);
        throw new Error('Analysis result is missing required fields');
    }

    // 캐시 저장
    conversationCache.set(log, result.query_summary, result.emotions, result.xp);

    // 성능 추적
    const duration = performance.now() - startTime;
    console.log(`✅ Analysis completed in ${duration.toFixed(0)}ms`);

    return result;
  } catch (error) {
    console.error("❌ Error analyzing log:", error);

    // 더 구체적인 에러 메시지
    if (error instanceof Error) {
      // API 에러인 경우
      if (error.message.includes('API key')) {
        throw new Error('API key error: ' + error.message);
      }
      // 네트워크 에러인 경우
      if (error.message.includes('fetch') || error.message.includes('network')) {
        throw new Error('Network error: Unable to connect to Gemini API. Please check your internet connection.');
      }
      // 파싱 에러인 경우
      if (error.message.includes('parse') || error.message.includes('JSON')) {
        throw new Error('Response parsing error: ' + error.message);
      }
      // 기타 에러
      throw new Error(`Failed to analyze log: ${error.message}`);
    }

    throw new Error("Failed to analyze the log entry. Please check the console for details.");
  }
}

/**
 * 펫 이미지 생성 (레벨업, 감정 변화 등)
 * @param prompt - 이미지 생성 프롬프트
 * @param baseImage - 기존 이미지 (연속성 유지용)
 * @param emotion - 감정 (캐싱용)
 * @param level - 레벨 (캐싱용)
 * @param useCache - 캐시 사용 여부
 * @returns Base64 인코딩된 이미지 URL
 */
export async function generatePetImage(
    prompt: string,
    baseImage: {inlineData: {data:string, mimeType: string}} | null = null,
    emotion?: string,
    level?: number,
    useCache: boolean = true
): Promise<string> {
    // 테마 가져오기
    const theme = skinSettings.getSettings().theme;

    // 캐시 확인 (레벨업 이미지만 캐싱)
    if (useCache && emotion && level) {
        const cached = await imageCache.get(emotion, level, theme);
        if (cached) {
            console.log('✅ Using cached image');
            return cached;
        }
    }

    try {
        const startTime = performance.now();
        const ai = getGoogleAI();
        const parts: any[] = [{ text: prompt }];
        if (baseImage) {
            const cleanData = normalizeBase64(baseImage.inlineData?.data);
            // 크기 체크: Base64 문자열이 1MB (약 750KB 이미지) 이상이면 제외
            const MAX_BASE64_SIZE = 1000000; // 1MB
            if (cleanData && baseImage.inlineData?.mimeType) {
                if (cleanData.length > MAX_BASE64_SIZE) {
                    console.warn(`🖼️ Base image too large (${(cleanData.length / 1024).toFixed(0)}KB), generating new image without reference`);
                } else {
                    console.log(`✅ Using base image for continuity (${(cleanData.length / 1024).toFixed(0)}KB)`);
                    parts.unshift({ inlineData: { data: cleanData, mimeType: baseImage.inlineData.mimeType } });
                }
            } else {
                console.warn('🖼️ Base image payload rejected: invalid base64 data or missing mime type.');
                if (!cleanData) console.warn('  - Clean data is null/empty');
                if (!baseImage.inlineData?.mimeType) console.warn('  - Mime type is missing');
            }
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imagePart?.inlineData) {
            const sanitizedData = normalizeBase64(imagePart.inlineData.data);
            if (!sanitizedData) {
                console.error('❌ Received malformed image payload from Gemini');
                console.error('  - Original data length:', imagePart.inlineData.data?.length || 0);
                throw new Error('Received malformed image payload from Gemini.');
            }

            console.log(`✅ Generated image data validated (${(sanitizedData.length / 1024).toFixed(0)}KB)`);
            const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${sanitizedData}`;

            // 캐시 저장
            if (useCache && emotion && level) {
                await imageCache.set(emotion, level, imageUrl, theme);
            }

            const duration = performance.now() - startTime;
            console.log(`🎨 Image generation took ${duration.toFixed(0)}ms`);

            return imageUrl;
        }
        throw new Error("No image data found in response");
    } catch (error) {
        console.error("Error generating pet image:", error);
        throw new Error("Failed to generate a new image for the pet.");
    }
}

/**
 * 레벨업시 이벤트 이미지 생성 (테마 적용)
 */
export async function generateLevelUpImage(
    petType: 'hatchi',
    level: number,
    emotion: string,
    levelName: string,
    baseImage: {inlineData: {data:string, mimeType: string}} | null = null
): Promise<string> {
    const theme = skinSettings.getSettings().theme;
    const prompt = petSkinGenerator.generateLevelUpPrompt(level, theme);
    return generatePetImage(prompt, baseImage, emotion, level, true);
}

/**
 * 감정 기반 표정 변화 이미지 생성 (실시간 대화용, 테마 적용)
 */
export async function generateEmotionExpression(
    petType: 'hatchi',
    emotion: string,
    intensity: number,
    baseImage: {inlineData: {data:string, mimeType: string}} | null = null
): Promise<string> {
    const theme = skinSettings.getSettings().theme;
    const prompt = petSkinGenerator.generateExpressionPrompt(emotion, intensity, theme);
    return generatePetImage(prompt, baseImage, emotion, undefined, false); // 실시간 표정은 캐싱 안함
}

/**
 * 대화 중 감정 분석 후 실시간 표정 업데이트
 * (Nano Banana 스타일 - 미세한 변화, 테마 적용)
 */
export async function updateLiveExpression(
    currentImageUrl: string | null,
    emotion: string,
    intensity: number,
    petType: 'hatchi' = 'hatchi'
): Promise<string | null> {
    try {
        if (!currentImageUrl || !currentImageUrl.startsWith('data:image')) {
            return null;
        }

        const [header, data] = currentImageUrl.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1];
        const cleanData = normalizeBase64(data);

        // 크기 체크: 1MB 이상이면 표정 업데이트 건너뛰기
        const MAX_BASE64_SIZE = 1000000;
        if (!cleanData || !mimeType) {
            console.warn('Skipping live expression update: invalid cached image data.');
            return null;
        }

        if (cleanData.length > MAX_BASE64_SIZE) {
            console.warn(`Skipping live expression update: image too large (${(cleanData.length / 1024).toFixed(0)}KB)`);
            return null;
        }

        const baseImage = { inlineData: { data: cleanData, mimeType } };
        
        // 테마 적용 프롬프트
        const theme = skinSettings.getSettings().theme;
        const prompt = petSkinGenerator.generateExpressionPrompt(emotion, intensity, theme);
        const updatedPrompt = `${prompt}\n\nIMPORTANT: Make only subtle changes to the facial expression. Keep the overall character design, colors, and style identical. Only adjust eyes, mouth, and minor emotional details.`;
        
        return await generatePetImage(updatedPrompt, baseImage, undefined, undefined, false);
    } catch (error) {
        console.error('Failed to update live expression:', error);
        return null; // 실패시 기존 이미지 유지
    }
}

async function* streamFromApi(endpoint: string, options: RequestInit, responseParser: (json: any) => string | null): AsyncGenerator<string> {
    try {
        const response = await fetch(endpoint, options);
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API error (${response.status}): ${errorBody}`);
        }
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim().startsWith('data: ')) {
                    const jsonStr = line.substring(6);
                    if (jsonStr.trim() === '[DONE]') return;
                    try {
                        const parsed = JSON.parse(jsonStr);
                        const content = responseParser(parsed);
                        if (content) yield content;
                    } catch (e) {
                        console.error("Error parsing stream chunk:", jsonStr, e);
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error streaming from ${endpoint}:`, error);
        yield `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
}

async function* streamFromOpenRouter(modelId: string, history: Message[], newPrompt: string, apiKey: string): AsyncGenerator<string> {
    const messages = history
        .filter(msg => msg.role === 'user' || msg.role === 'model')
        .map(msg => ({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.content }));
    messages.push({ role: 'user', content: newPrompt });

    yield* streamFromApi(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: modelId.replace('openrouter/', ''), messages, stream: true }),
        },
        (p) => p.choices?.[0]?.delta?.content
    );
}

async function* streamFromOpenAI(modelId: string, history: Message[], newPrompt: string, apiKey: string): AsyncGenerator<string> {
    const messages = history
        .filter(msg => msg.role === 'user' || msg.role === 'model')
        .map(msg => ({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.content }));
    messages.push({ role: 'user', content: newPrompt });
    
    yield* streamFromApi(
        "https://api.openai.com/v1/chat/completions",
        {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: modelId, messages, stream: true }),
        },
        (p) => p.choices?.[0]?.delta?.content
    );
}

async function* streamFromAnthropic(modelId: string, history: Message[], newPrompt: string, apiKey: string): AsyncGenerator<string> {
    const messages = history
        .filter(msg => msg.role === 'user' || msg.role === 'model')
        .map(msg => ({ role: msg.role, content: msg.content }));
    messages.push({ role: 'user', content: newPrompt });

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
            body: JSON.stringify({ model: modelId, messages, max_tokens: 4096, stream: true }),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API error (${response.status}): ${errorBody}`);
        }
        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.substring(6);
                    const parsed = JSON.parse(jsonStr);
                    if (parsed.type === 'content_block_delta') {
                        yield parsed.delta.text;
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error streaming from Anthropic:", error);
        yield `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
}

// FIX: Removed apiKey parameter to use the centralized `getGoogleAI` function.
async function* streamFromGemini(
  modelId: string, 
  history: Message[], 
  newPrompt: string,
  systemInstruction?: string
): AsyncGenerator<string> {
    const ai = getGoogleAI();
    const geminiHistory = history
        .filter(msg => msg.role !== 'system')
        .map(msg => ({ role: msg.role, parts: [{ text: msg.content }] }));
    try {
        const config: any = { model: modelId, history: geminiHistory };
        if (systemInstruction) {
          config.systemInstruction = systemInstruction;
        }
        
        const chat = ai.chats.create(config);
        const result = await chat.sendMessageStream({ message: newPrompt });
        for await (const chunk of result) {
            if (chunk.text) yield chunk.text;
        }
    } catch (error) {
        console.error("Error generating response from Gemini:", error);
        yield "Sorry, I encountered an error communicating with the AI.";
    }
}

export async function* generateChatResponseStream(
  model: Model, 
  history: Message[], 
  newPrompt: string, 
  apiKeys: ApiKeys,
  petState?: PetState
): AsyncGenerator<string> {
        const promptSettings = getPromptSettings();
    // 페르소나 시스템 프롬프트 생성
    let systemPrompt: string | undefined;
    if (petState?.persona && model.provider === 'Google Gemini') {
      const recentContext = buildRecentContext(petState.logHistory);
      systemPrompt = buildSystemPrompt(petState.persona, recentContext);
            if (promptSettings.systemAppendix.trim()) {
                systemPrompt = `${systemPrompt}\n\n${promptSettings.systemAppendix.trim()}`;
            }
      console.log('🧠 Persona System Prompt 적용:', systemPrompt.slice(0, 100) + '...');
    }

    switch (model.provider) {
        case 'Google Gemini':
            yield* streamFromGemini(model.id, history, newPrompt, systemPrompt);
            break;
        case 'OpenRouter':
            if (!apiKeys.openrouter) { yield "OpenRouter API key is missing."; return; }
            yield* streamFromOpenRouter(model.id, history, newPrompt, apiKeys.openrouter);
            break;
        case 'OpenAI':
            if (!apiKeys.openai) { yield "OpenAI API key is missing."; return; }
            yield* streamFromOpenAI(model.id, history, newPrompt, apiKeys.openai);
            break;
        case 'Anthropic':
            if (!apiKeys.anthropic) { yield "Anthropic API key is missing."; return; }
            yield* streamFromAnthropic(model.id, history, newPrompt, apiKeys.anthropic);
            break;
        default:
            yield `Provider "${model.provider}" is not supported.`;
    }
}

// FIX: Removed apiKey parameter to use the centralized `getGoogleAI` function.
export async function* generateReflection(petState: PetState, question: string): AsyncGenerator<string> {
    const ai = getGoogleAI();
    
    // 페르소나 기반 성찰 프롬프트 생성
    const systemInstruction = buildReflectionPrompt(petState.persona, petState);
    console.log('🧘 Reflection Prompt 생성 완료');
    
    const myContext = `최근 우리의 대화를 돌아보면서 당신께 이야기하고 싶어요.`;
    const prompt = `${myContext}\n\n당신이 묻는 것: "${question}"`;

    const stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: { systemInstruction }
    });

    for await (const chunk of stream) {
        if (chunk.text) yield chunk.text;
    }
}

/**
 * 페르소나 업데이트 함수 - 10회 대화마다 LLM에게 페르소나 분석 요청
 */
export async function updatePersona(petState: PetState): Promise<PetPersona> {
    const ai = getGoogleAI();
    const recentLogs = getRecentLogs(petState.logHistory, 10);
    const prompt = buildPersonaSummaryPrompt(recentLogs, petState.persona);
    
    console.log('🔄 페르소나 업데이트 시작... (최근 10개 대화 분석)');
    
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                temperature: 0.7
            }
        });
        
        const responseText = result.text.trim();
        console.log('📊 LLM 응답:', responseText.slice(0, 200) + '...');
        
        // JSON 파싱
        const summary = JSON.parse(responseText);
        
        // 페르소나 업데이트
        const updatedPersona: PetPersona = {
            ...petState.persona,
            growthSummary: summary.growthSummary || petState.persona.growthSummary,
            userInsight: summary.userInsight || petState.persona.userInsight,
            coreTraits: summary.newTraits && summary.newTraits.length > 0 
                ? summary.newTraits 
                : petState.persona.coreTraits,
            emotionalProfile: calculateAverageEmotions(recentLogs),
            conversationCount: petState.persona.conversationCount,
            lastUpdated: new Date().toISOString()
        };
        
        console.log('✅ 페르소나 업데이트 완료');
        console.log('  - 새 특성:', updatedPersona.coreTraits);
        console.log('  - 성장 요약:', updatedPersona.growthSummary.slice(0, 50) + '...');
        
        return updatedPersona;
    } catch (error) {
        console.error('❌ 페르소나 업데이트 실패:', error);
        // 실패시 기존 페르소나 유지 (단, 감정 프로필과 타임스탬프는 업데이트)
        return {
            ...petState.persona,
            emotionalProfile: calculateAverageEmotions(recentLogs),
            lastUpdated: new Date().toISOString()
        };
    }
}