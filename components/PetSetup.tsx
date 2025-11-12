
import React from 'react';
import { HATCHI_IMAGE } from '../assets/petImages';

interface PetSetupProps {
  onSetupComplete: () => void;
  isGenerating: boolean;
}

export const PetSetup: React.FC<PetSetupProps> = ({ onSetupComplete, isGenerating }) => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-900">
      <div className="w-full max-w-md rounded-xl bg-gray-800 p-8 text-center text-white shadow-2xl">
        <h1 className="text-3xl font-bold">Welcome to A. me</h1>
        <p className="mt-2 text-gray-400">Your new AI companion is ready to begin its journey.</p>
    
        <div className="my-8 flex flex-col items-center">
          <div className="flex h-48 w-48 items-center justify-center rounded-full bg-gray-700 shadow-inner mb-4 p-4">
              <img src={HATCHI_IMAGE} alt="Hatchi" className="h-full w-full object-contain" />
          </div>
          <h2 className="text-2xl font-semibold text-white">해치</h2>
           <p className="text-gray-400">Your new friend!</p>
        </div>

        <button
          onClick={onSetupComplete}
          disabled={isGenerating}
          className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? 'Loading...' : 'Begin Journey with 해치'}
        </button>
      </div>
    </div>
  );
};
