
import React, { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Globe, Brain, Info } from 'lucide-react';
import { Message, ChatConfig } from '../types';
import { generateChatMessage } from '../services/geminiService';
import { Button } from '../components/Button';

export const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', text: 'Hello! I am ready to help. I have access to Google Search to answer current questions.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ChatConfig>({
    useGrounding: 'search', // Default to 'search' so the model can answer questions about the world immediately
    useThinking: false,
    thinkingBudget: 2048
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Format history: exclude welcome message, map to API format
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const { text, grounding } = await generateChatMessage(history, userMsg.text, config);
      
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text,
        groundingMetadata: grounding,
        isThinking: config.useThinking
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Header / Config Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Gemini Chat</h2>
            {config.useThinking && <span className="text-xs bg-purple-900 text-purple-200 px-2 py-0.5 rounded-full border border-purple-700">Thinking Mode</span>}
        </div>
        
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
           <button 
             onClick={() => setConfig(prev => ({ ...prev, useThinking: !prev.useThinking, useGrounding: 'none' }))}
             className={`p-2 rounded-md transition-all ${config.useThinking ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
             title="Enable Reasoning/Thinking (Gemini Pro)"
           >
             <Brain size={18} />
           </button>
           <div className="w-px h-6 bg-slate-800 mx-1"></div>
           <button 
             onClick={() => setConfig(prev => ({ ...prev, useGrounding: prev.useGrounding === 'search' ? 'none' : 'search', useThinking: false }))}
             className={`p-2 rounded-md transition-all ${config.useGrounding === 'search' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
             title="Enable Google Search"
           >
             <Globe size={18} />
           </button>
           <button 
             onClick={() => setConfig(prev => ({ ...prev, useGrounding: prev.useGrounding === 'maps' ? 'none' : 'maps', useThinking: false }))}
             className={`p-2 rounded-md transition-all ${config.useGrounding === 'maps' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'}`}
             title="Enable Google Maps"
           >
             <MapPin size={18} />
           </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
            }`}>
              {msg.isThinking && (
                <div className="flex items-center gap-2 mb-2 text-xs text-purple-400 uppercase tracking-wider font-bold">
                    <Brain size={12} /> Thought Process Complete
                </div>
              )}
              
              <div className="whitespace-pre-wrap leading-relaxed">
                {msg.text}
              </div>

              {/* Grounding Results */}
              {msg.groundingMetadata?.searchChunks && (
                <div className="mt-4 pt-3 border-t border-slate-700">
                  <p className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1"><Globe size={12}/> Sources</p>
                  <ul className="space-y-1">
                    {msg.groundingMetadata.searchChunks.map((chunk, idx) => (
                      chunk.web && (
                        <li key={idx}>
                          <a href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate block">
                            {chunk.web.title}
                          </a>
                        </li>
                      )
                    ))}
                  </ul>
                </div>
              )}
               {msg.groundingMetadata?.mapChunks && (
                <div className="mt-4 pt-3 border-t border-slate-700">
                  <p className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1"><MapPin size={12}/> Locations</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingMetadata.mapChunks.map((chunk, idx) => (
                      chunk.maps && (
                        <a key={idx} href={chunk.maps.uri} target="_blank" rel="noreferrer" className="text-xs bg-slate-900 border border-slate-600 px-2 py-1 rounded text-green-400 hover:border-green-400 transition-colors">
                            {chunk.maps.title}
                        </a>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-start animate-pulse">
             <div className="bg-slate-800 p-4 rounded-2xl rounded-bl-none border border-slate-700">
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        {config.useThinking && (
             <div className="mb-2 px-2 flex items-center justify-between text-xs text-slate-400">
                <span>Thinking Budget: {config.thinkingBudget} tokens</span>
                <input 
                  type="range" 
                  min="1024" 
                  max="32768" 
                  step="1024" 
                  value={config.thinkingBudget}
                  onChange={(e) => setConfig(p => ({...p, thinkingBudget: parseInt(e.target.value)}))}
                  className="w-32 accent-purple-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
             </div>
        )}
        <div className="flex gap-2">
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={config.useThinking ? "Ask a complex question requiring reasoning..." : "Type your message..."}
                className="flex-1 bg-slate-900 text-white placeholder-slate-500 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading} className="w-14">
                <Send size={20} />
            </Button>
        </div>
      </div>
    </div>
  );
};
