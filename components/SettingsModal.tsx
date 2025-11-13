import React, { useState, useRef, useEffect } from 'react';
import type { ApiKeys, PromptSettings } from '../types';
import { CloseIcon } from './icons';
import { downloadBackup, uploadBackup, clearAllData } from '../utils/storage';
import { imageCache, cacheUtils } from '../utils/imageCache';
import { conversationCache, conversationCacheUtils } from '../utils/conversationCache';
import { skinSettings, skinUtils, type SkinTheme } from '../utils/petSkins';
import { getPromptSettings, savePromptSettings, DEFAULT_PROMPT_SETTINGS } from '../utils/promptSettings';

interface SettingsModalProps {
  apiKeys: ApiKeys;
  setApiKeys: (keys: ApiKeys) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ apiKeys, setApiKeys, onClose }) => {
  const [keys, setKeys] = useState<ApiKeys>(apiKeys);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'api' | 'data' | 'cache' | 'skin'>('api');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [promptSettingsState, setPromptSettingsState] = useState<PromptSettings>(() => getPromptSettings());

  // Load cache stats
  useEffect(() => {
    const loadStats = async () => {
      const imgStats = await imageCache.getStats();
      const convStats = conversationCache.getStats();
      setCacheStats({ image: imgStats, conversation: convStats });
    };
    loadStats();
    const interval = setInterval(loadStats, 5000); // Update every 5s
    return () => clearInterval(interval);
  }, []);

  const handleSave = () => {
    setApiKeys(keys);
    savePromptSettings(promptSettingsState);
    onClose();
  };

  const handleKeyChange = (provider: keyof ApiKeys, value: string) => {
    setKeys(prev => ({ ...prev, [provider]: value }));
  };

  const handleExport = () => {
    try {
      downloadBackup();
      alert('✅ 백업 파일이 다운로드되었습니다!');
    } catch (error) {
      alert('❌ 백업 파일 다운로드에 실패했습니다.');
    }
  };

  const handleImport = async () => {
    if (fileInputRef.current?.files?.[0]) {
      try {
        const backup = await uploadBackup(fileInputRef.current.files[0]);
        alert(`✅ 백업이 복원되었습니다!\n날짜: ${new Date(backup.timestamp).toLocaleString()}`);
        window.location.reload();
      } catch (error) {
        alert('❌ 백업 파일 복원에 실패했습니다. 파일 형식을 확인해주세요.');
      }
    }
  };

  const handleReset = () => {
    clearAllData();
  };

  const handleClearImageCache = async () => {
    if (confirm('이미지 캐시를 전부 삭제하시겠습니까?')) {
      await imageCache.clear();
      alert('✅ 이미지 캐시가 삭제되었습니다.');
      const imgStats = await imageCache.getStats();
      const convStats = conversationCache.getStats();
      setCacheStats({ image: imgStats, conversation: convStats });
    }
  };

  const handleClearConversationCache = () => {
    if (confirm('대화 캐시를 전부 삭제하시겠습니까?')) {
      conversationCache.clear();
      alert('✅ 대화 캐시가 삭제되었습니다.');
      const convStats = conversationCache.getStats();
      setCacheStats((prev: any) => ({ ...prev, conversation: convStats }));
    }
  };

  const handleCleanExpiredCache = async () => {
    const imgRemoved = await imageCache.cleanExpired();
    const convRemoved = conversationCache.cleanExpired();
    alert(`✅ 만료된 캐시 삭제 완료!\n이미지: ${imgRemoved}개, 대화: ${convRemoved}개`);
    
    const imgStats = await imageCache.getStats();
    const convStats = conversationCache.getStats();
    setCacheStats({ image: imgStats, conversation: convStats });
  };

  const handleThemeChange = (theme: SkinTheme) => {
    skinSettings.updateTheme(theme);
    alert(`✅ 테마가 ${skinUtils.formatThemeName(theme)}로 변경되었습니다.\n펫 이미지는 다음 생성부터 적용됩니다.`);
  };

  const handleToggleAutoSwitch = () => {
    const newValue = skinSettings.toggleAutoSwitch();
    alert(`✅ 시스템 테마 자동 전환이 ${newValue ? '활성화' : '비활성화'}되었습니다.`);
  };

  const handleToggleEnhancedEffects = () => {
    const newValue = skinSettings.toggleEnhancedEffects();
    alert(`✅ 강화된 이펙트가 ${newValue ? '활성화' : '비활성화'}되었습니다.`);
  };

  const handlePromptChange = (field: keyof PromptSettings, value: string) => {
    setPromptSettingsState(prev => ({ ...prev, [field]: value }));
  };

  const handleRestorePromptDefaults = () => {
    setPromptSettingsState({ ...DEFAULT_PROMPT_SETTINGS });
  };

  // FIX: Removed Google Gemini from the list of providers to prevent users from adding their own key,
  // in compliance with the guideline to exclusively use `process.env.API_KEY`.
  const providers: { id: keyof ApiKeys; name: string; url: string; placeholder: string }[] = [
    { id: 'openai', name: 'OpenAI', url: 'https://platform.openai.com/api-keys', placeholder: 'sk-...' },
    { id: 'anthropic', name: 'Anthropic', url: 'https://console.anthropic.com/settings/keys', placeholder: 'sk-ant-...' },
    { id: 'openrouter', name: 'OpenRouter', url: 'https://openrouter.ai/keys', placeholder: 'sk-or-...' },
  ];

  const currentSkinSettings = skinSettings.getSettings();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] rounded-xl bg-gray-800 text-white shadow-2xl m-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
          <CloseIcon className="h-6 w-6" />
        </button>

        <div className="p-8 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-4">⚙️ Settings</h1>
          <p className="text-sm text-gray-400 mb-6">
            API keys are stored securely in your browser's local storage and are never sent to our servers. Your Google Gemini key is configured via environment variables and used for pet-related features.
          </p>

          {/* API Keys Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-purple-300">🔑 API Keys</h2>
            <div className="space-y-4">
              {providers.map(({ id, name, url, placeholder }) => (
                <div key={id}>
                  <label htmlFor={`${id}-key`} className="block text-sm font-medium text-gray-300">
                    {name} API Key
                  </label>
                  <input
                    id={`${id}-key`}
                    type="password"
                    value={keys[id] || ''}
                    onChange={(e) => handleKeyChange(id, e.target.value)}
                    placeholder={placeholder}
                    className="mt-1 block w-full rounded-md border-none bg-gray-700 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Get your key at{' '}
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:underline"
                    >
                      {name}
                    </a>
                    .
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Data Management Section */}
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h2 className="text-lg font-semibold mb-3 text-purple-300">🧠 Prompt Settings</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="analysis-template" className="block text-sm font-medium text-gray-300">
                  Log Analysis Prompt Template
                </label>
                <textarea
                  id="analysis-template"
                  value={promptSettingsState.analysisTemplate}
                  onChange={(e) => handlePromptChange('analysisTemplate', e.target.value)}
                  rows={6}
                  className="mt-1 block w-full rounded-md border-none bg-gray-700 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Use <code className="bg-gray-800 px-1 py-0.5 rounded">{'{{log}}'}</code> where the user entry should be inserted.
                </p>
              </div>
              <div>
                <label htmlFor="system-appendix" className="block text-sm font-medium text-gray-300">
                  Extra System Instructions
                </label>
                <textarea
                  id="system-appendix"
                  value={promptSettingsState.systemAppendix}
                  onChange={(e) => handlePromptChange('systemAppendix', e.target.value)}
                  rows={4}
                  placeholder="Optional instructions appended to the persona system prompt."
                  className="mt-1 block w-full rounded-md border-none bg-gray-700 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  These instructions are appended to 해치's system prompt when using Gemini models.
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleRestorePromptDefaults}
                  className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600"
                >
                  Restore Defaults
                </button>
              </div>
            </div>
          </div>

          {/* Data Management Section */}
          <div className="mb-6 border-t border-gray-700 pt-6">
            <h2 className="text-lg font-semibold mb-3 text-purple-300">💾 Data Management</h2>
            <div className="space-y-3">
              <button
                onClick={handleExport}
                className="w-full rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 flex items-center justify-center gap-2"
              >
                <span>📥</span> Export Backup (Download)
              </button>
              
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className="w-full rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>📤</span> Import Backup (Upload)
                </label>
              </div>

              <button
                onClick={handleReset}
                className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <span>🗑️</span> Reset All Data
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              ⚠️ Reset will permanently delete all pet data and API keys. Make sure to export a backup first!
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-700 pt-6">
             <button
                onClick={onClose}
                className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600"
            >
                Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-md bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              💾 Save Keys
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
