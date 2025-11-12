import React, { useRef, useEffect, KeyboardEvent } from 'react';
import { SendIcon } from './icons';

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ prompt, setPrompt, onSend, isLoading }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [prompt]);

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading) {
      onSend();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative flex items-center">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          rows={1}
          className="w-full resize-none rounded-2xl border-none bg-gray-700 py-3 pl-4 pr-12 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={isLoading}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !prompt.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-white transition-colors duration-200 disabled:text-gray-500 disabled:hover:bg-transparent enabled:bg-gradient-to-r enabled:from-purple-500 enabled:to-pink-500 enabled:hover:opacity-90"
          aria-label="Send message"
        >
          <SendIcon className="h-5 w-5" />
        </button>
      </div>
       <div className="mt-2 px-2 text-center">
            <p className="text-xs text-gray-500">
                Every message helps your companion grow. Use <code className="rounded bg-gray-700 px-1 py-0.5 font-mono text-gray-400">/pet reflect</code> for insights.
            </p>
        </div>
    </div>
  );
};