import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../stores/useAppStore';

export const TutorChat: React.FC = () => {
  const { 
    chatMessages, 
    isChatOpen, 
    isChatLoading, 
    setIsChatOpen, 
    sendMessage, 
    clearChat 
  } = useAppStore();
  
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim() || isChatLoading) return;
    sendMessage(input);
    setInput('');
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  return (
    <>
      {/* Trigger Button */}
      <AnimatePresence>
        {!isChatOpen && (
          <motion.button
            key="chat-trigger"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-neon-blue text-slate-950 rounded-full shadow-lg shadow-blue-500/20 flex items-center justify-center z-40 hover:scale-110 transition-transform"
          >
            <MessageSquare size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-96 h-[600px] glass-panel border-slate-700/50 shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Bot className="text-neon-blue" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">AI 编程导师</h3>
                  <p className="text-[10px] text-emerald-500 font-mono">在线中...</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={clearChat}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  title="清空对话"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-1.5 text-slate-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4 text-slate-600">
                    <MessageSquare size={32} />
                  </div>
                  <h4 className="text-slate-300 font-medium mb-2">有什么我可以帮你的吗？</h4>
                  <p className="text-xs text-slate-500">你可以问我关于代码错误的原因，或者请求一个改进建议。</p>
                </div>
              )}

              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-emerald-500/10 text-emerald-50 border border-emerald-500/20 rounded-tr-none' : 'bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-tl-none'}`}>
                      {msg.parts[0].text}
                    </div>
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-2xl rounded-tl-none border border-slate-700/50">
                      <Loader2 className="animate-spin text-slate-500" size={16} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-slate-900/50 border-t border-slate-800">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="向导师提问..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-neon-blue transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isChatLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-neon-blue text-slate-950 rounded-lg flex items-center justify-center hover:bg-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
