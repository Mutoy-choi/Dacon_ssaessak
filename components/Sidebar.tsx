import React, { useState } from 'react';
import type { Model, PetState, Provider } from '../types';
import { PROVIDERS } from '../constants';
import { CloseIcon, ChartBarIcon, CogIcon } from './icons';
import { PetStatus } from './PetStatus';

interface SidebarProps {
  selectedModel: Model;
  setSelectedModel: (model: Model) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  petState: PetState | null;
  onDashboardOpen: () => void;
  onSettingsOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedModel,
  setSelectedModel,
  isSidebarOpen,
  setSidebarOpen,
  petState,
  onDashboardOpen,
  onSettingsOpen,
}) => {
  const [openProvider, setOpenProvider] = useState<string | null>(PROVIDERS[0].id);
  const [customModelId, setCustomModelId] = useState('');
  const [customModelProvider, setCustomModelProvider] = useState<string>(PROVIDERS[0].name);

  const handleModelSelect = (model: Model) => {
    setSelectedModel(model);
    setSidebarOpen(false);
  };

  const handleCustomModel = () => {
    if (customModelId.trim()) {
        const newModel: Model = {
            id: customModelId.trim(),
            name: `${customModelId.trim().split('/').pop()} (Custom)`,
            provider: customModelProvider,
        };
        handleModelSelect(newModel);
        setCustomModelId('');
    }
  };


  return (
    <aside
      className={`absolute inset-y-0 left-0 z-30 flex w-72 transform flex-col border-r border-gray-700 bg-gray-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between border-b border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-white">R.I.M.</h2>
        <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white lg:hidden">
          <CloseIcon className="h-6 w-6" />
        </button>
      </div>
      
      {petState && <PetStatus petState={petState} />}
      
      <div className="grid grid-cols-2 gap-2 p-4">
        <button 
            onClick={onDashboardOpen}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-600"
        >
            <ChartBarIcon className="h-5 w-5" />
            Dashboard
        </button>
        <button 
            onClick={onSettingsOpen}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-600"
        >
            <CogIcon className="h-5 w-5" />
            Settings
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 pt-0">
        <p className="px-2 pb-2 text-sm font-semibold text-gray-400">Select Model</p>
        <nav className="space-y-4">
          {PROVIDERS.map((provider) => (
            <div key={provider.id}>
              <button
                onClick={() => setOpenProvider(openProvider === provider.id ? null : provider.id)}
                className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium text-gray-300 hover:bg-gray-700"
              >
                <span>{provider.name}</span>
                <svg
                  className={`h-5 w-5 transform transition-transform ${
                    openProvider === provider.id ? 'rotate-90' : ''
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {openProvider === provider.id && (
                <div className="mt-2 space-y-1 pl-4">
                  {provider.models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleModelSelect(model)}
                      className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
                        selectedModel.id === model.id
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="mt-6">
            <p className="px-2 pb-2 text-sm font-semibold text-gray-400">Custom Model</p>
            <div className="space-y-3 px-2">
                <input
                    type="text"
                    placeholder="Enter Model ID"
                    value={customModelId}
                    onChange={(e) => setCustomModelId(e.target.value)}
                    className="w-full rounded-md border-none bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500"
                />
                <select 
                    value={customModelProvider} 
                    onChange={e => setCustomModelProvider(e.target.value)}
                    className="w-full rounded-md border-none bg-gray-700 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500"
                >
                    {PROVIDERS.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
                <button
                    onClick={handleCustomModel}
                    className="w-full rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                    disabled={!customModelId.trim()}
                >
                    Use Custom Model
                </button>
            </div>
        </div>
      </div>

      <div className="border-t border-gray-700 p-4 text-xs text-gray-400">
        <p>This interface is a frontend demonstration of the <b>A. me</b> concept.</p>
      </div>
    </aside>
  );
};