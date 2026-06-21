import { User, Bot } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isCEO = message.role === 'ceo';

  return (
    <div className={`flex gap-3 ${isCEO ? '' : 'bg-gray-800/30'} p-3 rounded-lg`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isCEO ? 'bg-purple-600' : 'bg-emerald-600'
        }`}
      >
        {isCEO ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold ${isCEO ? 'text-purple-300' : 'text-emerald-300'}`}>
            {isCEO ? 'CEO' : (message.department || 'Agent')}
          </span>
          {message.agentName && (
            <span className="text-xs text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">
              {message.agentName}
            </span>
          )}
          <span className="text-xs text-gray-600 ml-auto">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <MarkdownRenderer content={message.content} />
      </div>
    </div>
  );
}
