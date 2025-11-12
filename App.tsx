
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { PromptInput } from './components/PromptInput';
import { PetSetup } from './components/PetSetup';
import { PetDashboard } from './components/PetDashboard';
import { SettingsModal } from './components/SettingsModal';
import { ThemeToggle } from './components/ThemeToggle';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { MenuIcon } from './components/icons';
import type { Message, Model, PetState, PetType, Emotion, ApiKeys, LogAnalysis } from './types';
import { generateChatResponseStream, analyzeLog, generateLevelUpImage, generateReflection, updateLiveExpression, updatePersona } from './services/llmService';
import { PROVIDERS, LEVEL_THRESHOLDS, LEVEL_NAMES } from './constants';
import { HATCHI_IMAGE } from './assets/petImages';
import { buildImagePrompt } from './imagePrompts';
import { getTheme, setTheme, initTheme, toggleTheme as toggleThemeUtil } from './utils/theme';
import { triggerLevelUpAnimation, triggerExpGainAnimation, fadeTransition, createParticles } from './utils/animations';
import { imageCache } from './utils/imageCache';
import { conversationCache } from './utils/conversationCache';
import { createInitialPersona, shouldUpdatePersona, incrementPersonaCounter } from './utils/personaManager';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>(PROVIDERS[0].models[0]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDashboardOpen, setDashboardOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isPerformanceOpen, setPerformanceOpen] = useState(false);
  const [petState, setPetState] = useState<PetState | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');
  
  // Refs for animations
  const petImageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize theme
  useEffect(() => {
    initTheme();
    setThemeState(getTheme());
  }, []);

  // Toggle theme handler
  const handleThemeToggle = useCallback(() => {
    const newTheme = toggleThemeUtil();
    setThemeState(newTheme);
  }, []);

  useEffect(() => {
    try {
      const savedPet = localStorage.getItem('ame-pet-state');
      if (savedPet) {
        const parsed = JSON.parse(savedPet);
        // 페르소나 마이그레이션: 기존 데이터에 persona 없으면 생성
        if (!parsed.persona) {
          console.log('🔄 기존 펫 데이터 마이그레이션: 페르소나 추가');
          parsed.persona = createInitialPersona(parsed.name || '해치');
        }
        setPetState(parsed);
      }

      const savedKeys = localStorage.getItem('ame-api-keys');
      if (savedKeys) setApiKeys(JSON.parse(savedKeys));
    } catch (error) {
      console.error("Failed to parse state from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (petState) {
      localStorage.setItem('ame-pet-state', JSON.stringify(petState));
    }
  }, [petState]);

  useEffect(() => {
    localStorage.setItem('ame-api-keys', JSON.stringify(apiKeys));
  }, [apiKeys]);


  const addSystemMessage = (content: string, logAnalysis?: LogAnalysis) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content, logAnalysis }]);
    
    // Trigger EXP animation if XP is gained
    if (logAnalysis?.xp && containerRef.current) {
      triggerExpGainAnimation(containerRef.current, logAnalysis.xp);
    }
  };

  const handlePetSetup = useCallback(async () => {
    const initialState: PetState = {
        type: 'hatchi',
        name: '해치',
        level: 1, 
        exp: 0,
        dominantEmotion: 'joy',
        imageUrl: HATCHI_IMAGE,
        logHistory: [],
        majorEvents: [{ timestamp: new Date().toISOString(), description: `The journey with 해치 begins!` }],
        persona: createInitialPersona('해치')
    };
    setPetState(initialState);
    console.log('🎉 해치 탄생! 초기 페르소나 생성 완료');
  }, []);
  
  const handlePetLog = async (log: string) => {
    if (!petState) return;
    try {
        // 1. Analyze Log
        const analysis = await analyzeLog(log);
        addSystemMessage(`Log analyzed... You gained ${analysis.xp} EXP!`, analysis);

        // 2. Update Pet State
        const oldLevel = petState.level;
        const currentImageUrl = petState.imageUrl;
        const newExp = petState.exp + analysis.xp;
        let newLevel = oldLevel;
        let leveledUp = false;
        
        if (newLevel < LEVEL_THRESHOLDS.length && newExp >= LEVEL_THRESHOLDS[newLevel]) {
            newLevel++;
            leveledUp = true;
        }
        
        const dominantEmotion = Object.entries(analysis.emotions).reduce((a, b) => a[1] > b[1] ? a : b)[0] as Emotion;
        
        setPetState(prev => {
            if (!prev) return null;
            
            // 페르소나 카운터 증가
            const updatedPersona = incrementPersonaCounter(prev.persona);
            
            const updatedState = {
                ...prev, 
                exp: newExp, 
                level: newLevel, 
                dominantEmotion,
                persona: updatedPersona,
                logHistory: [...prev.logHistory, {
                  timestamp: new Date().toISOString(),
                  summary: analysis.query_summary,
                  emotions: analysis.emotions,
                }],
            };
            if(leveledUp) {
                updatedState.majorEvents.push({
                    timestamp: new Date().toISOString(),
                    description: `Evolved to Level ${newLevel}: ${LEVEL_NAMES[newLevel-1]}`
                });
            }
            
            // 10회마다 페르소나 업데이트 체크
            if (shouldUpdatePersona(updatedPersona)) {
                console.log('🔔 10회 대화 도달! 페르소나 업데이트 예정');
                // 비동기 업데이트는 별도 처리
                setTimeout(async () => {
                    try {
                        const newPersona = await updatePersona(updatedState);
                        setPetState(current => current ? { ...current, persona: newPersona } : null);
                        addSystemMessage('💫 해치가 당신과의 대화를 통해 조금 더 성장했어요!');
                    } catch (error) {
                        console.error('페르소나 업데이트 실패:', error);
                    }
                }, 1000);
            }
            
            return updatedState;
        });
        
        // 3. Handle Level Up & Image Generation
        if (leveledUp) {
            addSystemMessage(`✨ Your companion is evolving! ✨`);
            const levelName = LEVEL_NAMES[newLevel - 1] || "Companion";
            
            let baseImage = null;
            if (currentImageUrl && currentImageUrl.startsWith('data:image')) {
                const [header, data] = currentImageUrl.split(',');
                const mimeType = header.match(/:(.*?);/)?.[1];
                if (data && mimeType) {
                    baseImage = { inlineData: { data, mimeType } };
                }
            }
            
            // Use improved image generation with event prompt
            const newImageUrl = await generateLevelUpImage(
                petState.type,
                newLevel,
                dominantEmotion,
                levelName,
                baseImage
            );
            
            // Animate level up
            if (petImageRef.current && containerRef.current) {
                triggerLevelUpAnimation(petImageRef.current);
                createParticles(containerRef.current, 30);
            }
            
            // Fade transition to new image
            if (petImageRef.current && newImageUrl) {
                await fadeTransition(petImageRef.current, newImageUrl, 800);
            }
            
            setPetState(prev => prev ? ({ ...prev, imageUrl: newImageUrl }) : null);
            addSystemMessage(`🎉 Congratulations! ${petState.name} reached Level ${newLevel}: ${levelName}!`);
        }
        
        // 4. Real-time expression update (subtle changes)
        if (!leveledUp && petState.imageUrl) {
            try {
                const updatedImage = await updateLiveExpression(
                    petState.imageUrl,
                    dominantEmotion,
                    analysis.emotions[dominantEmotion]
                );
                
                if (updatedImage && petImageRef.current) {
                    await fadeTransition(petImageRef.current, updatedImage, 400);
                    setPetState(prev => prev ? ({ ...prev, imageUrl: updatedImage }) : null);
                }
            } catch (error) {
                console.log('Skipping expression update:', error);
            }
        }
    } catch (error) {
      console.error('Error in handlePetLog:', error);
      const errorId = (Date.now() + 1).toString();
      const errorMessage: Message = { id: errorId, role: 'model', content: `An error occurred during pet interaction: ${error instanceof Error ? error.message : "Please try again."}` };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handlePetReflection = async (question: string) => {
    const modelMessageId = (Date.now() + 1).toString();
    const modelMessage: Message = { id: modelMessageId, role: 'model', content: '' };
    setMessages(prev => [...prev, modelMessage]);

    const stream = generateReflection(petState!, question);
    for await (const chunk of stream) {
        setMessages(prev =>
            prev.map(msg =>
                msg.id === modelMessageId ? { ...msg, content: msg.content + chunk } : msg
            )
        );
    }
  };

  const streamStandardResponse = async (prompt: string, currentHistory: Message[]) => {
    const modelMessageId = (Date.now() + 1).toString();
    const modelMessage: Message = { id: modelMessageId, role: 'model', content: '' };
    setMessages(prev => [...prev, modelMessage]);
    
    // Pass the full history to the stream function
    const fullHistory = [...messages, ...currentHistory];

    // 페르소나 포함하여 스트림 생성
    const stream = generateChatResponseStream(selectedModel, fullHistory, prompt, apiKeys, petState);
    for await (const chunk of stream) {
        setMessages(prev =>
        prev.map(msg =>
            msg.id === modelMessageId ? { ...msg, content: msg.content + chunk } : msg
        )
        );
    }
  }

  const isApiKeyMissing = (model: Model, keys: ApiKeys): boolean => {
    switch (model.provider) {
        case 'OpenRouter': return !keys.openrouter;
        case 'OpenAI': return !keys.openai;
        case 'Anthropic': return !keys.anthropic;
        case 'Google Gemini': return !process.env.API_KEY; 
        default: return false;
    }
  };

  const handleSend = useCallback(async () => {
    if (!prompt.trim() || !petState) return;

    const userPrompt = prompt;
    setIsLoading(true);
    setPrompt(''); // Clear prompt immediately

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: userPrompt };
    setMessages(prev => [...prev, userMessage]);
    
    const trimmedPrompt = userPrompt.trim().toLowerCase();

    // Handle reflection command separately
    if (trimmedPrompt.startsWith('/pet reflect ')) {
        const question = userPrompt.substring('/pet reflect '.length);
        if (question) {
            await handlePetReflection(question);
        } else {
            addSystemMessage("Please provide a question for reflection. e.g., /pet reflect How have I been feeling lately?");
        }
    } else {
        // All other messages are for standard chat AND pet logging
        
        // 1. Get standard chat response
        if (isApiKeyMissing(selectedModel, apiKeys)) {
            addSystemMessage(`Please set your ${selectedModel.provider} API key in Settings to use this model.`);
        } else {
            await streamStandardResponse(userPrompt, [userMessage]);
        }
        
        // 2. Perform pet logging in the background after the response is complete
        await handlePetLog(userPrompt);
    }

    setIsLoading(false);

  }, [prompt, messages, petState, selectedModel, apiKeys]);

  if (!petState) {
    return <PetSetup onSetupComplete={handlePetSetup} isGenerating={isLoading} />;
  }

  return (
    <div ref={containerRef} className="flex h-screen overflow-hidden bg-gray-900 dark:bg-gray-900 text-gray-100 dark:text-gray-100 font-sans transition-colors duration-300">
      {isDashboardOpen && <PetDashboard petState={petState} onClose={() => setDashboardOpen(false)} />}
      {isSettingsOpen && <SettingsModal apiKeys={apiKeys} setApiKeys={setApiKeys} onClose={() => setSettingsOpen(false)} />}
      {isPerformanceOpen && <PerformanceMonitor isOpen={isPerformanceOpen} onClose={() => setPerformanceOpen(false)} />}
      <div
        className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden ${
          isSidebarOpen ? 'block' : 'hidden'
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      <Sidebar
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        petState={petState}
        onDashboardOpen={() => setDashboardOpen(true)}
        onSettingsOpen={() => setSettingsOpen(true)}
      />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 w-full items-center justify-between border-b border-gray-700 dark:border-gray-700 bg-gray-800 dark:bg-gray-800 px-4 lg:justify-center transition-colors duration-300">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-300 hover:text-white lg:hidden transition-smooth"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-white">{selectedModel.name}</h1>
            <p className="text-xs text-gray-400">Provider: {selectedModel.provider}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPerformanceOpen(true)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              title="성능 모니터"
            >
              📊
            </button>
            <ThemeToggle theme={theme} onToggle={handleThemeToggle} />
            <div className="w-6 lg:hidden"></div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <ChatWindow messages={messages} />
        </main>
        <footer className="border-t border-gray-700 dark:border-gray-700 bg-gray-800 dark:bg-gray-800 p-4 transition-colors duration-300">
          <PromptInput 
            prompt={prompt}
            setPrompt={setPrompt}
            onSend={handleSend} 
            isLoading={isLoading} 
          />
        </footer>
      </div>
    </div>
  );
};

export default App;
