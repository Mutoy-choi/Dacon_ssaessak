import React from 'react';
import type { PetState } from '../types';
import { LEVEL_THRESHOLDS, LEVEL_NAMES } from '../constants';

interface PetStatusProps {
  petState: PetState;
}

export const PetStatus: React.FC<PetStatusProps> = ({ petState }) => {
  const { name, level, exp, imageUrl, type } = petState;

  const currentLevelExp = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextLevelExp = LEVEL_THRESHOLDS[level] || exp;
  const expInLevel = exp - currentLevelExp;
  const expForNextLevel = nextLevelExp - currentLevelExp;
  const progressPercentage = expForNextLevel > 0 ? (expInLevel / expForNextLevel) * 100 : 100;
  const levelName = LEVEL_NAMES[level-1] || "Companion";

  return (
    <div className="border-b border-t border-gray-700 bg-gray-800/50 p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-gray-700 shadow-inner">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span className="animate-pulse text-4xl">?</span>
          )}
        </div>
        <div className="w-full">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-bold text-white">{name}</h3>
            <span className="text-xs font-semibold text-purple-300">Lvl {level}</span>
          </div>
          <p className="text-xs text-gray-400 capitalize">{levelName} {type}</p>
          <div className="mt-2">
            <div className="h-2 w-full rounded-full bg-gray-700">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="mt-1 text-right text-xs text-gray-500">{exp} / {nextLevelExp} EXP</p>
          </div>
        </div>
      </div>
    </div>
  );
};
