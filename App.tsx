import React, { useState, useEffect, useRef } from 'react';
import { SchemeType, Message, Role, Source } from './types';
import { initializeChat, sendMessageStream } from './services/geminiService';
import EmergencyBanner from './components/EmergencyBanner';
import ChatMessage from './components/ChatMessage';
import TermsModal from './components/TermsModal';
import { SendIcon, LoaderIcon, JanSathiLogo, MicIcon, SquareIcon } from './components/Icons';

// ----------------------------------------------------------------------
// 🔧 CUSTOM CONFIGURATION
// ----------------------------------------------------------------------

// Optional: Custom Logo URL
// If provided, this image will replace BOTH the icon and the "JanSathi AI" text heading.
const CUSTOM_LOGO_URL = ""; 
// ----------------------------------------------------------------------

const App: React.FC = () => {
  // Default to GENERAL context; let RAG + Agent handle specific schemes based on query
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: Role.MODEL,
      text: "Namaste! I am **Asha**, your digital community guide.\n\nI am here to help you understand government schemes like **Mission Shakti**, **Vatsalya**, and **Poshan 2.0**.\n\nI can speak multiple languages. Which language would you prefer?",
      timestamp: Date.now(),
      actions: ["English", "हिंदी (Hindi)", "मराठी (Marathi)", "தமிழ் (Tamil)"]
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showTerms, setShowTerms] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if terms have been accepted previously
    const termsAccepted = localStorage.getItem('jansathi_terms_accepted_v1');
    if (termsAccepted === 'true') {
      setShowTerms(false);
    }

    // Initialize chat with General context
    const resetChat = async () => {
      try {
        await initializeChat(SchemeType.GENERAL);
      } catch (e) {
        console.error("Init error:", e);
      }
    };
    resetChat();

    // Initialize Speech Recognition if supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // Default to Indian English

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    setInput(prev => {
                        // Avoid duplication if the previous input ends with the new transcript
                        const newText = event.results[i][0].transcript;
                        return prev + (prev.length > 0 && !prev.endsWith(' ') ? ' ' : '') + newText;
                    });
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAcceptTerms = () => {
    localStorage.setItem('jansathi_terms_accepted_v1', 'true');
    setShowTerms(false);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
        alert("Voice input is not supported in this browser. Please use Chrome, Edge or Safari.");
        return;
    }

    if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
    } else {
        recognitionRef.current.start();
        setIsListening(true);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input.trim();
    if (!textToSend || isLoading) return;

    if (!textOverride) {
      setInput('');
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
      }
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const streamResult = await sendMessageStream(textToSend);
      
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
      const actionTagRegex = /<actions>(.*?)<\/actions>/s;

      for await (const chunk of streamResult) {
          const chunkText = chunk.text;
          
          // Check for grounding metadata (Google Search results)
          if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            const chunks = chunk.candidates[0].groundingMetadata.groundingChunks;
            chunks.forEach(c => {
              if (c.web?.uri && c.web?.title) {
                // Strict Government Domain Filtering
                const lowerUri = c.web.uri.toLowerCase();
                const isGov = lowerUri.includes('.gov.in') || lowerUri.includes('.nic.in');
                
                // Avoid duplicates
                const isDuplicate = sources.some(s => s.uri === c.web.uri);

                if (isGov && !isDuplicate) {
                  sources.push({
                    title: c.web.title,
                    uri: c.web.uri
                  });
                }
              }
            });
          }

          if (chunkText) {
              fullResponseText += chunkText;

              // Parse actions if tag exists
              let displayText = fullResponseText;
              let actions: string[] | undefined;

              const match = fullResponseText.match(actionTagRegex);
              if (match) {
                try {
                  // Attempt to parse the JSON array inside the tags
                  actions = JSON.parse(match[1]);
                  // Remove the tag from the display text
                  displayText = fullResponseText.replace(actionTagRegex, '').trim();
                } catch (e) {
                  // If JSON is incomplete (streaming), we ignore it for now
                }
              }

              setMessages(prev => prev.map(msg => 
                  msg.id === responseMsgId 
                  ? { 
                      ...msg, 
                      text: displayText, 
                      sources: sources.length > 0 ? sources : undefined,
                      actions: actions
                    }
                  : msg
              ));
          }
      }

    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message || "Unknown error occurred.";
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: Role.MODEL,
        text: `Error: ${errorMsg}\n\nPlease ensure your API Key is configured correctly.`,
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
    <div className="flex flex-col h-screen w-full relative font-inter text-slate-900 overflow-hidden">
      
      {/* Terms and Conditions Modal */}
      {showTerms && <TermsModal onAccept={handleAcceptTerms} />}
          
      <EmergencyBanner />

      {/* Header - Fixed Top */}
      <header className="flex-none px-4 py-3 z-30 w-full flex items-center justify-between border-b border-black/5 bg-white/40 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
          {CUSTOM_LOGO_URL ? (
            <img 
              src={CUSTOM_LOGO_URL} 
              alt="Custom Logo" 
              className="h-10 sm:h-12 object-contain" 
            />
          ) : (
            <>
              <div className="p-2 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-white/40">
                <JanSathiLogo className="w-9 h-9 sm:w-11 sm:h-11" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none">
                  JanSathi <span className="text-orange-500">AI</span>
                </h1>
                <p className="text-slate-500 text-[10px] sm:text-xs font-bold tracking-wide uppercase mt-0.5">
                  Government Welfare Assistant
                </p>
              </div>
            </>
          )}
        </div>
        <div className="hidden sm:block">
          <span className="text-xs font-medium px-3 py-1 bg-white/60 border border-white/40 shadow-sm rounded-full text-slate-600 backdrop-blur-md">
            Beta v1.2
          </span>
        </div>
      </header>

      {/* Main Chat Area - Full width with centered max-width content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide w-full relative">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-48 space-y-6">
              {messages.map((msg) => (
                <ChatMessage 
                  key={msg.id} 
                  message={msg} 
                  onActionClick={(action) => handleSend(action)}
                />
              ))}
              {isLoading && messages.length > 0 && messages[messages.length-1].role === Role.USER && (
                  <div className="flex justify-start w-full animate-pulse">
                      <div className="bg-white/80 border border-slate-100 px-5 py-4 rounded-3xl rounded-bl-none shadow-sm flex items-center space-x-2 text-slate-500 text-sm backdrop-blur-sm">
                        <LoaderIcon className="w-4 h-4 text-rose-500" />
                        <span>Asha is thinking...</span>
                      </div>
                  </div>
              )}
              <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-20 pointer-events-none flex justify-center bg-gradient-to-t from-green-100/90 via-white/80 to-transparent pt-12">
          <div className="w-full max-w-3xl pointer-events-auto pb-2 sm:pb-4">
            <div className="relative flex items-end bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-2xl sm:rounded-3xl p-2 ring-1 ring-black/5 transition-all focus-within:shadow-[0_12px_48px_rgba(0,0,0,0.12)]">
              
              <textarea
                ref={textareaRef}
                value={input}
                onChange={adjustTextareaHeight}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Ask Asha about Mission Shakti, Vatsalya, or Poshan..."}
                className={`w-full bg-transparent border-none focus:ring-0 focus:outline-none outline-none p-3 sm:p-4 max-h-[150px] resize-none placeholder:text-slate-400 text-base sm:text-lg transition-colors duration-300
                  ${isListening ? 'text-rose-600 placeholder:text-rose-400' : 'text-slate-700'}
                `}
                rows={1}
                disabled={isLoading}
              />
              
              <div className="flex items-center pb-1 pr-1 space-x-2">
                <button
                  onClick={toggleListening}
                  disabled={isLoading}
                  className={`flex-none p-3 rounded-xl sm:rounded-2xl transition-all duration-300 ease-out border
                    ${isListening 
                      ? 'bg-rose-100 border-rose-200 text-rose-600 animate-pulse ring-2 ring-rose-200' 
                      : 'bg-white border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                    }
                  `}
                  title="Voice Input"
                >
                  {isListening ? <SquareIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>

                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || (!input.trim() && !isListening)}
                  className={`flex-none p-3 rounded-xl sm:rounded-2xl transition-all duration-300 ease-out
                    ${input.trim() && !isLoading 
                      ? 'bg-gradient-to-br from-rose-600 to-orange-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:scale-105 active:scale-95' 
                      : 'bg-slate-100/50 text-slate-300 cursor-not-allowed'
                    }
                  `}
                >
                  <SendIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

            </div>
            
            <div className="mt-3 text-center transition-opacity duration-300 hover:opacity-100 opacity-80">
                <p className="text-[10px] sm:text-xs font-medium text-slate-500 bg-white/40 backdrop-blur-md border border-white/40 shadow-sm inline-block px-3 py-1 rounded-full">
                  Asha can make mistakes. Please verify with official WCD guidelines.
                </p>
            </div>
          </div>
      </div>

    </div>
  );
};

export default App;