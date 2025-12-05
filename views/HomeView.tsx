import React, { useRef, useEffect } from 'react';
import { View } from '../types';
import { MessageSquare, Eye, Mic, Video, ArrowRight, Brain, Globe, Sparkles, Zap } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: View) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Force scroll to top on mount
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
    }
  }, []);

  const cards = [
    {
      id: View.CHAT,
      title: 'Chat & Reasoning',
      description: 'Gemini 2.5/3.0 with Thinking & Search.',
      icon: MessageSquare,
      color: 'bg-blue-600',
      subIcons: [Brain, Globe]
    },
    {
      id: View.VISION,
      title: 'Vision Studio',
      description: 'Analyze images or generate visuals.',
      icon: Eye,
      color: 'bg-indigo-600',
      subIcons: [Sparkles, Zap]
    },
    {
      id: View.SPEECH,
      title: 'Speech Lab',
      description: 'Lifelike TTS with voice personas.',
      icon: Mic,
      color: 'bg-emerald-600',
      subIcons: []
    },
    {
      id: View.VIDEO,
      title: 'Veo Video Gen',
      description: 'Cinematic video generation model.',
      icon: Video,
      color: 'bg-pink-600',
      subIcons: []
    }
  ];

  return (
    <div ref={scrollRef} className="h-full w-full overflow-y-auto no-scrollbar">
      <div className="max-w-5xl mx-auto space-y-3 px-3 md:px-6 pt-[calc(3rem+env(safe-area-inset-top)+0.75rem)] pb-[calc(4.5rem+env(safe-area-inset-bottom)+0.75rem)] md:py-6">
        
        {/* Hero Section - Compact */}
        <div className="text-center space-y-1 md:space-y-4 mb-2 md:mb-6">
          <h1 className="text-xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            Gemini Explorer
          </h1>
          <p className="text-[10px] md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Google GenAI SDK Features
          </p>
        </div>

        {/* Feature Grid - Dense for Mobile */}
        <div className="grid grid-cols-2 gap-2 md:gap-6">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => onNavigate(card.id)}
              className="group relative bg-slate-900 border border-slate-800 rounded-lg md:rounded-xl p-3 md:p-4 hover:border-slate-600 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/50 text-left flex flex-col h-full overflow-hidden active:scale-[0.98]"
            >
              <div className={`absolute top-0 right-0 p-12 md:p-20 opacity-5 rounded-full blur-3xl transition-transform duration-500 group-hover:scale-150 ${card.color}`}></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                  <div className={`p-1.5 md:p-2 rounded-lg ${card.color} text-white shadow-lg`}>
                    <card.icon size={16} className="md:w-6 md:h-6" />
                  </div>
                  <div className="flex gap-1">
                    {card.subIcons.map((Icon, idx) => (
                      <div key={idx} className="p-0.5 bg-slate-800 rounded-full text-slate-400 border border-slate-700">
                        <Icon size={10} />
                      </div>
                    ))}
                  </div>
                </div>

                <h3 className="text-xs md:text-xl font-bold text-white mb-0.5 group-hover:text-blue-300 transition-colors">
                  {card.title}
                </h3>
                <p className="text-slate-400 text-[10px] md:text-sm leading-tight mb-2 flex-1">
                  {card.description}
                </p>

                <div className="flex items-center text-[9px] md:text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                  Open <ArrowRight size={10} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};