import React, { useState, useEffect, useRef } from 'react';
import { SchemeType, Message, Role, Source } from './types';
import { initializeChat, sendMessageStream } from './services/geminiService';
import EmergencyBanner from './components/EmergencyBanner';
import ChatMessage from './components/ChatMessage';
import { SendIcon, LoaderIcon, JanSathiLogo } from './components/Icons';

const App: React.FC = () => {
  // Default to GENERAL context; let RAG + Agent handle specific schemes based on query
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: Role.MODEL,
      text: "Namaste! I am **JanSathi AI**, your guide for **Mission Shakti**, **Mission Vatsalya**, and **Poshan 2.0**.\n\nHow can I assist you today? You can ask about eligibility, benefits, or application processes.",
      timestamp: Date.now()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Initialize chat with General context
    const resetChat = async () => {
      await initializeChat(SchemeType.GENERAL);
    };
    resetChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: userText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const streamResult = await sendMessageStream(userText);
      
      if (!streamResult) throw new Error("No response stream");

      let fullResponseText = '';
      const responseMsgId = (Date.now() + 1).toString();
      
      // Add placeholder message for streaming
      setMessages(prev => [...prev, {
        id: responseMsgId,
        role: Role.MODEL,
        text: '',
        timestamp: Date.now()
      }]);

      let sources: Source[] = [];

      for await (const chunk of streamResult) {
          const chunkText = chunk.text;
          
          // Check for grounding metadata (Google Search results)
          if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            const chunks = chunk.candidates[0].groundingMetadata.groundingChunks;
            chunks.forEach(c => {
              if (c.web?.uri && c.web?.title) {
                sources.push({
                  title: c.web.title,
                  uri: c.web.uri
                });
              }
            });
          }

          if (chunkText) {
              fullResponseText += chunkText;
              setMessages(prev => prev.map(msg => 
                  msg.id === responseMsgId 
                  ? { ...msg, text: fullResponseText, sources: sources.length > 0 ? sources : undefined }
                  : msg
              ));
          }
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: Role.MODEL,
        text: "I apologize, but I'm having trouble connecting to the service right now. Please check your internet or try again later.",
        isError: true,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <EmergencyBanner />

      {/* Main Layout */}
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 gap-4 h-[calc(100vh-48px)]">
        
        {/* Header Section */}
        <div className="flex-none py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <JanSathiLogo className="w-10 h-10 sm:w-12 sm:h-12" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                  JanSathi <span className="text-orange-500">AI</span>
                </h1>
                <p className="text-slate-500 text-xs font-bold tracking-wide uppercase mt-0.5">
                  A Government Welfare Chatbot
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-right">
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">Beta v1.2</span>
            </div>
          </div>
        </div>

        {/* Chat Area (Scrollable) */}
        <div className="flex-1 flex flex-col bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide">
            <div className="flex flex-col space-y-2">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && messages.length > 0 && messages[messages.length-1].role === Role.USER && (
                 <div className="flex justify-start w-full mb-6">
                     <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-2 text-slate-500 text-sm">
                        <LoaderIcon className="w-4 h-4 text-rose-500" />
                        <span>Consulting Knowledge Base & Web...</span>
                     </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="flex-none p-4 bg-white border-t border-slate-200">
            <div className="relative flex items-end bg-slate-50 border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-rose-100 focus-within:border-rose-400 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={adjustTextareaHeight}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Mission Shakti, Vatsalya, or Poshan 2.0..."
                className="w-full bg-transparent border-none focus:ring-0 p-3 max-h-[120px] resize-none text-slate-700 placeholder:text-slate-400"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className={`mb-2 mr-2 p-2 rounded-lg transition-colors
                  ${input.trim() && !isLoading 
                    ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }
                `}
              >
                <SendIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2 text-center">
               <p className="text-[10px] text-slate-400">
                  AI can make mistakes. Verify critical info with official WCD guidelines.
               </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;