import React from 'react';
import { ShieldAlertIcon } from './Icons';

interface TermsModalProps {
  onAccept: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onAccept }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md transition-all duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-white/20 animate-in zoom-in-95 fade-in duration-300 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex-none bg-white z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 border border-orange-200">
                <ShieldAlertIcon className="w-5 h-5 text-orange-600" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">Terms of Use</h2>
                <p className="text-xs text-slate-500 font-medium">JanSathi AI</p>
             </div>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto scrollbar-hide space-y-4">
          <p className="text-sm text-slate-600 font-medium">
            By using this chatbot, you agree to the following rules:
          </p>
          
          <div className="space-y-3">
            
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-1">1. AI Guide, Not an Officer</h3>
                <p className="text-xs text-slate-600 leading-relaxed">JanSathi (Asha Didi) is an artificial intelligence tool designed to explain government schemes. I am not a government official and this is not a legal government portal.</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-1">2. Information Only – No Form Filling</h3>
                <p className="text-xs text-slate-600 leading-relaxed">I can help you check if you are eligible for a scheme and tell you which documents are needed. However, I cannot fill out, submit, or process official application forms. You must visit a local office to apply.</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-1">3. Privacy First (No PII)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">Your privacy is important. Never share your Aadhaar Number, Bank Account details, or Passwords in this chat. I do not need your private data to answer questions.</p>
            </div>

             <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                <h3 className="font-bold text-red-800 text-xs uppercase tracking-wide mb-1">4. Safety Protocol</h3>
                <p className="text-xs text-red-700 leading-relaxed">I am here to provide information, not emergency help. If you mention violence, abuse, or suicide, I am programmed to stop the chat and provide police/helpline numbers (e.g., 181, 1098).</p>
            </div>

            <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                <h3 className="font-bold text-orange-800 text-xs uppercase tracking-wide mb-1">5. Liability Disclaimer</h3>
                <p className="text-xs text-orange-800/90 leading-relaxed">I try to be accurate by reading official government files, but rules can change. Always verify the information with your local Anganwadi worker or Block Officer before taking action. <strong>BITSoM</strong> is not responsible for any errors or decisions made based on this chat.</p>
            </div>

          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex-none backdrop-blur-sm">
            <button
              onClick={onAccept}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-lg shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center text-sm group"
            >
              I Agree & Continue
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;