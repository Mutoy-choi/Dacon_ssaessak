import React from 'react';
import type { Message, LogAnalysis, Emotion } from '../types';
import { UserIcon, ModelIcon } from './icons';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MessageBubbleProps {
  message: Message;
}

const SystemMessage: React.FC<{ content: string }> = ({ content }) => (
    <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <div className="h-px flex-grow bg-gray-700"></div>
        <span className="flex-shrink-0">{content}</span>
        <div className="h-px flex-grow bg-gray-700"></div>
    </div>
);

const LogAnalysisMessage: React.FC<{ analysis: LogAnalysis }> = ({ analysis }) => {
    const topEmotions = Object.entries(analysis.emotions)
        .sort(([, a], [, b]) => b - a)
        .filter(([, score]) => score > 0)
        .slice(0, 4);

    return (
        <div className="mx-auto max-w-2xl rounded-lg border border-gray-700 bg-gray-800/50 p-4 shadow-lg">
            <h3 className="text-md font-semibold text-white">Log Analysis</h3>
            <p className="mt-1 text-sm text-gray-400 italic">"{analysis.query_summary}"</p>
            <p className="mt-3 text-lg font-bold text-purple-400">+{analysis.xp} EXP</p>

            <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-300">Top Emotions Detected:</h4>
                {topEmotions.map(([emotion, score]) => (
                     <div key={emotion}>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="capitalize font-semibold text-gray-300">{emotion}</span>
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
            </div>
        </div>
    );
};


export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isModel = message.role === 'model';
  
  if (message.role === 'system') {
    if (message.logAnalysis) {
        return <LogAnalysisMessage analysis={message.logAnalysis} />
    }
    return <SystemMessage content={message.content} />;
  }
  
  const renderedContent = isModel ? DOMPurify.sanitize(marked.parse(message.content) as string) : message.content;

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {isModel && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
          <ModelIcon className="h-5 w-5 text-white" />
        </div>
      )}
      {isUser && (
         <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-600">
          <UserIcon className="h-5 w-5 text-white" />
        </div>
      )}
      <div
        className={`max-w-xl rounded-2xl px-4 py-3 shadow-md ${
          isUser
            ? 'rounded-br-lg bg-blue-600 text-white'
            : 'rounded-bl-lg bg-gray-700 text-gray-200'
        }`}
      >
        {isModel ? (
            <div 
                className="prose prose-sm prose-p:my-2 prose-p:leading-relaxed prose-invert max-w-none break-words"
                dangerouslySetInnerHTML={{ __html: renderedContent || '<span class="animate-pulse">...</span>' }}
            />
        ) : (
            <div className="prose prose-sm prose-p:my-2 prose-p:leading-relaxed prose-invert max-w-none break-words">
                {message.content || <span className="animate-pulse">...</span>}
            </div>
        )}
      </div>
    </div>
  );
};