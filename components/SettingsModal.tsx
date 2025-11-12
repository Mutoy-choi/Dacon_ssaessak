import React, { useState, useRef } from 'react';
import type { ApiKeys } from '../types';
import { CloseIcon } from './icons';
import { downloadBackup, uploadBackup, clearAllData } from '../utils/storage';

interface SettingsModalProps {
  apiKeys: ApiKeys;
  setApiKeys: (keys: ApiKeys) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ apiKeys, setApiKeys, onClose }) => {
  const [keys, setKeys] = useState<ApiKeys>(apiKeys);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setApiKeys(keys);
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

  // FIX: Removed Google Gemini from the list of providers to prevent users from adding their own key,
  // in compliance with the guideline to exclusively use `process.env.API_KEY`.
  const providers: { id: keyof ApiKeys; name: string; url: string; placeholder: string }[] = [
    { id: 'openai', name: 'OpenAI', url: 'https://platform.openai.com/api-keys', placeholder: 'sk-...' },
    { id: 'anthropic', name: 'Anthropic', url: 'https://console.anthropic.com/settings/keys', placeholder: 'sk-ant-...' },
    { id: 'openrouter', name: 'OpenRouter', url: 'https://openrouter.ai/keys', placeholder: 'sk-or-...' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-xl bg-gray-800 text-white shadow-2xl m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <CloseIcon className="h-6 w-6" />
        </button>

        <div className="p-8">
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
