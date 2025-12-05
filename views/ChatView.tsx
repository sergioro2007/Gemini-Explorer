import React, { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Globe, Brain, ChevronDown, ChevronRight } from 'lucide-react';
import { Message, ChatConfig } from '../types';
import { generateChatMessage } from '../services/geminiService';
import { Button } from '../components/Button';
// @ts-ignore
import { marked } from 'marked';

// Sub-component for individual messages
const ChatMessageItem: React.FC<{ msg: Message }> = ({ msg }) => {
    const [isSourcesOpen, setIsSourcesOpen] = useState(false);
    
    // Parse Markdown safely
    const getHtml = (text: string) => {
        try {
            return marked.parse(text);
        } catch (e) {
            return text;
        }
    };

    const hasGrounding = (msg.groundingMetadata?.searchChunks && msg.groundingMetadata.searchChunks.length > 0) || 
                         (msg.groundingMetadata?.mapChunks && msg.groundingMetadata.mapChunks.length > 0);

    return (
        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[95%] md:max-w-[85%] p-2 md:p-4 rounded-xl md:rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
            }`}>
              {msg.isThinking && (
                <div className="flex items-center gap-1.5 mb-1 text-[9px] text-purple-400 uppercase tracking-wider font-bold bg-purple-900/20 p-0.5 px-1 rounded w-fit">
                    <Brain size={8} /> Thinking
                </div>
              )}
              
              {/* Markdown Content */}
              <div 
                  className={`prose prose-sm prose-p:my-0.5 prose-headings:my-1 prose-ul:my-0.5 max-w-none text-[13px] md:text-sm leading-snug ${msg.role === 'user' ? 'prose-invert text-white' : 'prose-invert text-slate-200'}`}
                  dangerouslySetInnerHTML={{ __html: getHtml(msg.text) }} 
              />

              {/* Collapsible Grounding Results */}
              {hasGrounding && (
                <div className="mt-1.5 pt-1 border-t border-slate-700/50">
                   <button 
                        onClick={() => setIsSourcesOpen(!isSourcesOpen)}
                        className="flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-white transition-colors py-0.5"
                   >
                       {isSourcesOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                       <Globe size={10}/> Sources
                   </button>
                   
                   {isSourcesOpen && (
                       <div className="mt-1 pl-1 space-y-0.5 animate-fade-in">
                            {msg.groundingMetadata?.searchChunks && msg.groundingMetadata.searchChunks.length > 0 && (
                                <ul className="space-y-0.5">
                                    {msg.groundingMetadata.searchChunks.map((chunk, idx) => (
                                    chunk.web && (
                                        <li key={idx}>
                                        <a href={chunk.web.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[9px] text-blue-400 hover:text-blue-300 hover:underline truncate group">
                                            <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                                            {chunk.web.title}
                                        </a>
                                        </li>
                                    )
                                    ))}
                                </ul>
                            )}
                       </div>
                   )}
                </div>
              )}
            </div>
        </div>
    );
};

export const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', text: 'Hello! I am ready to help. I have access to Google Search to answer current questions.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ChatConfig>({
    useGrounding: 'search', 
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
      // Format history
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
    <div className="flex flex-col h-full bg-slate-900 md:rounded-xl overflow-hidden md:border border-slate-800 md:shadow-2xl pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pt-0 md:pb-0">
      {/* Header / Config Bar - Compact */}
      <div className="p-2 md:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
             <h2 className="text-sm md:text-lg font-semibold text-white">Gemini Chat</h2>
             {config.useThinking && <span className="text-[9px] bg-purple-900 text-purple-200 px-1 py-0.5 rounded border border-purple-700">Thinking</span>}
        </div>
        
        <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
           <button 
             onClick={() => setConfig(prev => ({ ...prev, useThinking: !prev.useThinking, useGrounding: 'none' }))}
             className={`p-1.5 rounded-md transition-all ${config.useThinking ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
             title="Reasoning"
           >
             <Brain size={14} />
           </button>
           <div className="w-px h-3 bg-slate-800 mx-0.5"></div>
           <button 
             onClick={() => setConfig(prev => ({ ...prev, useGrounding: prev.useGrounding === 'search' ? 'none' : 'search', useThinking: false }))}
             className={`p-1.5 rounded-md transition-all ${config.useGrounding === 'search' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
             title="Search"
           >
             <Globe size={14} />
           </button>
           <button 
             onClick={() => setConfig(prev => ({ ...prev, useGrounding: prev.useGrounding === 'maps' ? 'none' : 'maps', useThinking: false }))}
             className={`p-1.5 rounded-md transition-all ${config.useGrounding === 'maps' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'}`}
             title="Maps"
           >
             <MapPin size={14} />
           </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-4">
        {messages.map((msg) => (
            <ChatMessageItem key={msg.id} msg={msg} />
        ))}
        {isLoading && (
           <div className="flex justify-start animate-pulse">
             <div className="bg-slate-800 p-2.5 rounded-xl rounded-bl-none border border-slate-700">
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Compact */}
      <div className="p-2 md:p-4 bg-slate-950 border-t border-slate-800 shrink-0">
        {config.useThinking && (
             <div className="mb-2 px-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>Budget: {config.thinkingBudget}</span>
                <input 
                  type="range" 
                  min="1024" 
                  max="32768" 
                  step="1024" 
                  value={config.thinkingBudget}
                  onChange={(e) => setConfig(p => ({...p, thinkingBudget: parseInt(e.target.value)}))}
                  className="w-24 accent-purple-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
             </div>
        )}
        <div className="flex gap-2">
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 bg-slate-900 text-white placeholder-slate-500 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading} className="w-10 h-10 px-0 md:w-12">
                <Send size={16} />
            </Button>
        </div>
      </div>
    </div>
  );
};