import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from '../types';

/**
 * A pulsing dots animation for the "thinking" state
 */
const ThinkingIndicator: React.FC = () => (
  <div className="flex gap-1.5 py-2 px-1">
    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></div>
  </div>
);

/**
 * A lightweight, zero-dependency Markdown renderer 
 * that handles code blocks, bolding, and inline code.
 */
const MarkdownLite: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return <ThinkingIndicator />;
  
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const content = part.replace(/```(\w+)?\n?/, '').replace(/```$/, '');
          return (
            <pre key={i} className="bg-black border border-white/10 p-4 rounded-xl overflow-x-auto my-3">
              <code className="text-gray-300 text-xs font-mono">{content.trim()}</code>
            </pre>
          );
        }

        // Handle inline formatting: bold (**), inline code (`), and newlines
        const inlineFormatted = part.split(/(\*\*.*?\*\*|`.*?`|\n)/g).map((subPart, j) => {
          if (subPart.startsWith('**') && subPart.endsWith('**')) {
            return <strong key={j} className="text-white font-bold">{subPart.slice(2, -2)}</strong>;
          }
          if (subPart.startsWith('`') && subPart.endsWith('`')) {
            return <code key={j} className="bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-mono text-[0.9em]">{subPart.slice(1, -1)}</code>;
          }
          if (subPart === '\n') {
            return <br key={j} />;
          }
          return subPart;
        });

        return <p key={i} className="leading-relaxed">{inlineFormatted}</p>;
      })}
    </div>
  );
};

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: query, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `You are a DSA tutor. 
          1. Format complexity as **O(N)**.
          2. Use \`code blocks\` for logic.
          3. Be concise and professional. 
          4. NEVER use LaTeX symbols like $.`,
        }
      });

      const result = await chat.sendMessageStream({ message: query });
      let fullText = '';
      
      const botMsg: ChatMessage = { role: 'model', text: '', timestamp: Date.now() };
      setMessages(prev => [...prev, botMsg]);

      for await (const chunk of result) {
        fullText += chunk.text;
        setMessages(prev => {
          const next = [...prev];
          const lastMsg = next[next.length - 1];
          if (lastMsg && lastMsg.role === 'model') {
            lastMsg.text = fullText;
          }
          return next;
        });
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "I encountered a connection issue. Please try your question again.", 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-[#A91D3A] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all border-2 border-white/20"
          aria-label="Open AI Tutor"
        >
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      ) : (
        <div className="w-[380px] md:w-[400px] h-[520px] bg-[#0A0A0A] border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-[10px] text-white">TUF</div>
              <div>
                <span className="block font-bold text-xs text-white uppercase tracking-wider">AI DSA TUTOR</span>
                <span className="block text-[9px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span> Online
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-white transition-all border border-white/5"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <div className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center mb-3">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Ask about Logic or Complexity</p>
              </div>
            )}
            
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-5 py-4 rounded-[1.5rem] text-sm leading-relaxed shadow-lg ${
                  m.role === 'user' 
                    ? 'bg-[#A91D3A] text-white rounded-tr-none' 
                    : 'bg-[#1a1a1a] text-gray-300 border border-white/5 rounded-tl-none'
                }`}>
                  <MarkdownLite text={m.text} />
                </div>
              </div>
            ))}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a1a] border border-white/5 px-5 py-3 rounded-[1.5rem] rounded-tl-none">
                  <ThinkingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/5 bg-black">
            <form onSubmit={handleSendMessage} className="relative group">
              <input
                type="text"
                placeholder="Type your question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-2xl px-5 py-3.5 pr-12 text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 outline-none transition-all text-white placeholder-gray-600"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-500 disabled:opacity-20 transition-all p-1"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;