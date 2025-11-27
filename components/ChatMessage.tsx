import React from 'react';
import { Message, Role } from '../types';
import { InfoIcon, ShieldAlertIcon } from './Icons';

interface ChatMessageProps {
  message: Message;
  onActionClick?: (action: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onActionClick }) => {
  const isUser = message.role === Role.USER;
  const isEmergency = !isUser && message.text.includes("Emergency Help Needed");
  
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
        return <li key={i} className="ml-4 list-disc marker:text-slate-400">{formattedLine}</li>;
      }
      return <p key={i} className={line.trim() === '' ? 'h-3' : ''}>{formattedLine}</p>;
    });
  };

  return (
    <div className={`flex flex-col w-full mb-6 ${isUser ? 'items-end' : 'items-start'} group`}>
      <div 
        className={`max-w-[90%] sm:max-w-[80%] rounded-3xl px-6 py-4 shadow-sm text-sm sm:text-base leading-relaxed backdrop-blur-sm transition-all duration-300
          ${isUser 
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm shadow-blue-500/10' 
            : isEmergency
              ? 'bg-red-50 border-2 border-red-500 text-slate-900 rounded-bl-sm shadow-red-100'
              : 'bg-white/90 border border-white/50 text-slate-800 rounded-bl-sm shadow-slate-200/50'
          }
          ${message.isError ? 'border-red-300 bg-red-50 text-red-800' : ''}
        `}
      >
        {!isUser && !isEmergency && (
          <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-100/50 opacity-70">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Asha</span>
          </div>
        )}
        
        {isEmergency && (
           <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-red-200">
            <ShieldAlertIcon className="w-5 h-5 text-red-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">Crisis Intervention</span>
          </div>
        )}

        <div className={`space-y-1 ${isEmergency ? 'font-medium text-slate-900' : ''}`}>
          {formatText(message.text)}
        </div>
        
        {/* Sources Section - Hide for emergency messages */}
        {!isEmergency && message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100/50">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center">
              <InfoIcon className="w-3 h-3 mr-1" /> Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, idx) => (
                <a 
                  key={idx} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs bg-slate-50 border border-slate-100 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-100 transition-colors truncate max-w-full flex items-center shadow-sm"
                  title={source.title}
                >
                  <span className="truncate max-w-[150px]">{source.title || 'Source'}</span>
                  <span className="ml-1 opacity-50">↗</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggested Actions (Chips) - Hide for emergency */}
      {!isUser && !isEmergency && message.actions && message.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 ml-2 max-w-[95%] animate-in fade-in slide-in-from-bottom-2 duration-500">
          {message.actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => onActionClick?.(action)}
              className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-rose-100 text-rose-600 text-xs sm:text-sm font-semibold rounded-2xl shadow-sm hover:bg-rose-50 hover:border-rose-200 hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95 whitespace-nowrap"
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;