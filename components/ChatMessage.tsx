import React from 'react';
import { Message, Role } from '../types';
import { ShieldAlertIcon, InfoIcon } from './Icons';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  
  const formatText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bold handling
      const boldParts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = boldParts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.trim().startsWith('- ')) {
        return <li key={i} className="ml-4 list-disc">{formattedLine}</li>;
      }
      return <p key={i} className={line.trim() === '' ? 'h-2' : ''}>{formattedLine}</p>;
    });
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm text-sm sm:text-base leading-relaxed
          ${isUser 
            ? 'bg-blue-600 text-white rounded-br-none' 
            : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
          }
          ${message.isError ? 'border-red-300 bg-red-50 text-red-800' : ''}
        `}
      >
        {!isUser && (
          <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-100 opacity-70">
            <span className="text-xs font-bold uppercase tracking-wider">Seva-Setu Assistant</span>
          </div>
        )}
        <div className="space-y-1">
          {formatText(message.text)}
        </div>
        
        {/* Sources Section */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center">
              <InfoIcon className="w-3 h-3 mr-1" /> Sources found from web:
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, idx) => (
                <a 
                  key={idx} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs bg-slate-100 text-blue-600 px-2 py-1 rounded hover:bg-slate-200 transition-colors truncate max-w-full"
                  title={source.title}
                >
                  {source.title || 'Source'} ↗
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;