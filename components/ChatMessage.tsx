import React from 'react';
import { Message, Role } from '../types';
import { InfoIcon, ShieldAlertIcon } from './Icons';

// ----------------------------------------------------------------------
// 🔧 CUSTOM CONFIGURATION
// ----------------------------------------------------------------------
// Replace this URL with your custom image for Asha's avatar
const ASHA_AVATAR_URL = "https://api.dicebear.com/9.x/avataaars/svg?seed=Asha&backgroundColor=ffdfbf";
// ----------------------------------------------------------------------

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
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start gap-2 sm:gap-3'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      
      {/* Avatar for Asha (Model) */}
      {!isUser && !isEmergency && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-100 border border-orange-200 overflow-hidden shadow-sm">
            <img 
              src={ASHA_AVATAR_URL} 
              alt="Asha Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <div className={`flex flex-col max-w-[85%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div 
          className={`rounded-3xl px-5 py-4 shadow-sm text-sm sm:text-base leading-relaxed backdrop-blur-sm transition-all duration-300 w-full
            ${isUser 
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none shadow-blue-500/10' 
              : isEmergency
                ? 'bg-red-50 border-2 border-red-500 text-slate-900 rounded-bl-none shadow-red-100'
                : 'bg-white/90 border border-white/50 text-slate-800 rounded-tl-none shadow-slate-200/50'
            }
            ${message.isError ? 'border-red-300 bg-red-50 text-red-800' : ''}
          `}
        >
          {/* Internal Name Tag - Optional, can keep for accessibility or redundancy */}
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
          <div className="flex flex-wrap gap-2 mt-3 ml-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
    </div>
  );
};

export default ChatMessage;