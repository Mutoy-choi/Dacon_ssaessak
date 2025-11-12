import React, { useMemo } from 'react';
import { PET_EMOTIONS, type PetState, type EmotionSet, type Emotion, LogEntry, MajorEvent } from '../types';
import { LEVEL_NAMES, LEVEL_THRESHOLDS } from '../constants';
import { CloseIcon } from './icons';

interface PetDashboardProps {
  petState: PetState;
  onClose: () => void;
}

const calculateEmotionProfile = (history: LogEntry[]): { emotion: Emotion; score: number }[] => {
  if (history.length === 0) return [];
  
  const totals: EmotionSet = PET_EMOTIONS.reduce((acc, emotion) => ({ ...acc, [emotion]: 0 }), {} as EmotionSet);
  
  history.forEach(log => {
    PET_EMOTIONS.forEach(emotion => {
      totals[emotion] += log.emotions[emotion] || 0;
    });
  });
  
  const averages = PET_EMOTIONS.map(emotion => ({
    emotion,
    score: totals[emotion] / history.length,
  }));

  return averages.sort((a, b) => b.score - a.score);
};

type TimelineItem = (LogEntry & { type: 'log' }) | (MajorEvent & { type: 'event' });

export const PetDashboard: React.FC<PetDashboardProps> = ({ petState, onClose }) => {
  const { name, level, exp, imageUrl, type, majorEvents, logHistory } = petState;

  const emotionProfile = useMemo(() => calculateEmotionProfile(logHistory), [logHistory]);
  
  const timeline: TimelineItem[] = useMemo(() => {
    const logs: TimelineItem[] = logHistory.map(l => ({ ...l, type: 'log' }));
    const events: TimelineItem[] = majorEvents.map(e => ({ ...e, type: 'event' }));
    return [...logs, ...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logHistory, majorEvents]);


  const currentLevelExp = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextLevelExp = LEVEL_THRESHOLDS[level] || exp;
  const expInLevel = exp - currentLevelExp;
  const expForNextLevel = nextLevelExp - currentLevelExp;
  const progressPercentage = expForNextLevel > 0 ? Math.min((expInLevel / expForNextLevel) * 100, 100) : 100;
  const levelName = LEVEL_NAMES[level - 1] || "Companion";

  return (
    <div 
      className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl rounded-xl bg-gray-800 text-white shadow-2xl m-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
          <CloseIcon className="h-6 w-6" />
        </button>
        
        <div className="p-8 pb-0">
            <h1 className="text-3xl font-bold text-center mb-6">{name}'s Journey</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 pt-0 overflow-y-auto">
            {/* Left Column: Pet Status & Emotion Profile */}
            <div className="flex flex-col gap-6 sticky top-0">
                <div className="flex flex-col items-center rounded-lg bg-gray-900/50 p-6">
                    <div className="relative h-40 w-40 rounded-full bg-gray-700 shadow-lg mb-4">
                        {imageUrl ? (
                             <img src={imageUrl} alt={name} className="h-full w-full rounded-full object-cover" />
                        ) : (
                            <div className="h-full w-full rounded-full flex items-center justify-center">
                                <span className="animate-pulse text-6xl">?</span>
                            </div>
                        )}
                    </div>
                    <h2 className="text-2xl font-bold">{name}</h2>
                    <p className="text-md text-gray-400 capitalize">{levelName} {type}</p>
                    <span className="mt-1 text-sm font-semibold text-purple-300">Level {level}</span>

                    <div className="w-full mt-4">
                        <div className="h-3 w-full rounded-full bg-gray-700">
                            <div
                                className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                        <p className="mt-1 text-right text-xs text-gray-500">{exp} / {nextLevelExp} EXP</p>
                    </div>
                </div>
                <div className="rounded-lg bg-gray-900/50 p-6">
                    <h3 className="text-xl font-semibold mb-3">Overall Emotion Profile</h3>
                    <div className="space-y-2">
                        {emotionProfile.slice(0, 5).map(({ emotion, score }) => (
                            <div key={emotion}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="capitalize text-gray-300">{emotion}</span>
                                    <span className="text-gray-400">{score.toFixed(1)} / 10.0</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-gray-700">
                                    <div 
                                        className="h-2 rounded-full bg-pink-500"
                                        style={{ width: `${score * 10}%`}}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {emotionProfile.length === 0 && <p className="text-sm text-gray-500">Log your day to build an emotion profile!</p>}
                    </div>
                </div>
            </div>

            {/* Right Column: Journey Timeline */}
            <div className="rounded-lg bg-gray-900/50 p-6">
                <h3 className="text-xl font-semibold mb-4">Journey Timeline</h3>
                <ul className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                    {timeline.length > 0 ? timeline.map((item) => (
                        <li key={item.timestamp} className="text-sm">
                           {item.type === 'event' && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-1.5 h-3 w-3 rounded-full bg-purple-400 flex-shrink-0"></div>
                                    <div>
                                        <p className="font-semibold text-purple-300">{item.description}</p>
                                        <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                           )}
                           {item.type === 'log' && (
                                <div className="rounded-md border border-gray-700 bg-gray-800 p-3">
                                    <p className="font-medium text-gray-300 italic">"{item.summary}"</p>
                                    <p className="text-xs text-gray-500 mb-2">{new Date(item.timestamp).toLocaleString()}</p>
                                    <div className="space-y-1.5">
                                        {Object.entries(item.emotions).filter(([, score]) => score > 0.5).sort(([,a],[,b]) => b-a).slice(0,3).map(([emotion, score]) => (
                                             <div key={emotion}>
                                                <div className="flex justify-between text-xs mb-0.5">
                                                    <span className="capitalize font-medium text-gray-400">{emotion}</span>
                                                    <span className="text-gray-500">{score.toFixed(1)}</span>
                                                </div>
                                                <div className="h-1.5 w-full rounded-full bg-gray-700">
                                                    <div 
                                                        className="h-1.5 rounded-full bg-pink-600"
                                                        style={{ width: `${score * 10}%`}}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                           )}
                        </li>
                    )) : <p className="text-sm text-gray-500">No events or logs yet. Use `/pet log` to begin!</p>}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};