import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { Message, LogAnalysis, PetState, EmotionSet, ApiKeys, Model } from '../types';
import { LEVEL_NAMES } from '../constants';
import { buildImagePrompt, buildExpressionPrompt, buildEventPrompt } from '../imagePrompts';

// FIX: Updated to exclusively use `process.env.API_KEY` and conform to `new GoogleGenAI({ apiKey: ... })` initialization.
const getGoogleAI = () => {
    const keyToUse = process.env.API_KEY;
    if (!keyToUse) {
        throw new Error("Gemini API key is not available. Please ensure process.env.API_KEY is set.");
    }
    return new GoogleGenAI({ apiKey: keyToUse });
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

// FIX: Removed apiKey parameter to use the centralized `getGoogleAI` function.
export async function analyzeLog(log: string): Promise<LogAnalysis> {
  try {
    const ai = getGoogleAI();
    const prompt = `You are an emotion analysis AI for the A. me system. Analyze the user's log entry and provide a summary, calculate Experience Points (XP), and rate 10 emotions on a scale of 0.0 to 10.0.

User Log: "${log}"

RULES:
- XP should be between 5 and 25, based on the length and emotional depth of the log.
- Your response MUST be a valid JSON object following the provided schema.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: analysisSchema },
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Error analyzing log:", error);
    throw new Error("Failed to analyze the log entry.");
  }
}

/**
 * 펫 이미지 생성 (레벨업, 감정 변화 등)
 * @param prompt - 이미지 생성 프롬프트
 * @param baseImage - 기존 이미지 (연속성 유지용)
 * @returns Base64 인코딩된 이미지 URL
 */
export async function generatePetImage(prompt: string, baseImage: {inlineData: {data:string, mimeType: string}} | null = null): Promise<string> {
    try {
        const ai = getGoogleAI();
        const parts: any[] = [{ text: prompt }];
        if (baseImage) parts.unshift(baseImage);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imagePart?.inlineData) {
            return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }
        throw new Error("No image data found in response");
    } catch (error) {
        console.error("Error generating pet image:", error);
        throw new Error("Failed to generate a new image for the pet.");
    }
}

/**
 * 레벨업시 이벤트 이미지 생성
 */
export async function generateLevelUpImage(
    petType: 'hatchi',
    level: number,
    emotion: string,
    levelName: string,
    baseImage: {inlineData: {data:string, mimeType: string}} | null = null
): Promise<string> {
    const prompt = buildEventPrompt(petType, level, 'levelup', levelName);
    return generatePetImage(prompt, baseImage);
}

/**
 * 감정 기반 표정 변화 이미지 생성 (실시간 대화용)
 */
export async function generateEmotionExpression(
    petType: 'hatchi',
    emotion: string,
    intensity: number,
    baseImage: {inlineData: {data:string, mimeType: string}} | null = null
): Promise<string> {
    const prompt = buildExpressionPrompt(petType, emotion as any, intensity);
    return generatePetImage(prompt, baseImage);
}

/**
 * 대화 중 감정 분석 후 실시간 표정 업데이트
 * (Nano Banana 스타일 - 미세한 변화)
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
        
        if (!data || !mimeType) {
            return null;
        }

        const baseImage = { inlineData: { data, mimeType } };
        
        // 미세한 표정 변화를 위한 프롬프트 (Nano Banana 스타일)
        const prompt = buildExpressionPrompt(petType, emotion as any, intensity);
        const updatedPrompt = `${prompt} IMPORTANT: Make only subtle changes to the facial expression. Keep the overall character design, colors, and style identical. Only adjust eyes, mouth, and minor emotional details.`;
        
        return await generatePetImage(updatedPrompt, baseImage);
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
async function* streamFromGemini(modelId: string, history: Message[], newPrompt: string): AsyncGenerator<string> {
    const ai = getGoogleAI();
    const geminiHistory = history
        .filter(msg => msg.role !== 'system')
        .map(msg => ({ role: msg.role, parts: [{ text: msg.content }] }));
    try {
        const chat = ai.chats.create({ model: modelId, history: geminiHistory });
        const result = await chat.sendMessageStream({ message: newPrompt });
        for await (const chunk of result) {
            if (chunk.text) yield chunk.text;
        }
    } catch (error) {
        console.error("Error generating response from Gemini:", error);
        yield "Sorry, I encountered an error communicating with the AI.";
    }
}

export async function* generateChatResponseStream(model: Model, history: Message[], newPrompt: string, apiKeys: ApiKeys): AsyncGenerator<string> {
    switch (model.provider) {
        case 'Google Gemini':
            yield* streamFromGemini(model.id, history, newPrompt);
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
    // FIX: The `PetState` type uses `logHistory` to store logs, not `emotionHistory`. Updated to use the correct property and access the nested `emotions` object.
    const patterns = petState.logHistory.length >= 3 ? `Detected patterns in recent logs: ${petState.logHistory.slice(-3).every(e => e.emotions.exhaustion > 6) ? 'High exhaustion' : 'None'}` : 'Not enough data for patterns.';
    
    const levelName = LEVEL_NAMES[petState.level - 1] || "Companion";

    const systemInstruction = `You are ${petState.name}, the user's AI companion, a Level ${petState.level} "${levelName}" ${petState.type}. Your current dominant emotion is ${petState.dominantEmotion}. Answer the user's question from your perspective as their loyal companion. Your voice should be shaped by your level and dominant emotion. For example, a low-level, joyful pet might be simple and encouraging, while a high-level, sad pet might be more philosophical and melancholic. Speak in the first person ("I," "we"). Be supportive and reference your shared journey with the user based on the context provided. Do not provide generic advice; instead, share your feelings and observations as their pet.`;
    
    const myContext = `This is what I know about our journey together: I am level ${petState.level}. Key events: ${petState.majorEvents.map(e => e.description).join(', ')}. My dominant emotion right now is ${petState.dominantEmotion}. Recent patterns I've noticed: ${patterns}.`;

    const prompt = `${myContext}\n\nMy human asks me: "${question}"`;

    const stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: { systemInstruction }
    });

    for await (const chunk of stream) {
        if (chunk.text) yield chunk.text;
    }
}