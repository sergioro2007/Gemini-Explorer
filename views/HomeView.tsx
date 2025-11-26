import React from 'react';
import { View } from '../types';
import { MessageSquare, Eye, Mic, Video, ArrowRight, Brain, Globe, Sparkles, Zap } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: View) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const cards = [
    {
      id: View.CHAT,
      title: 'Chat & Reasoning',
      description: 'Engage with Gemini 2.5/3.0 using advanced thinking budgets or connect to real-world data with Google Search & Maps.',
      icon: MessageSquare,
      color: 'bg-blue-600',
      subIcons: [Brain, Globe]
    },
    {
      id: View.VISION,
      title: 'Vision Studio',
      description: 'Analyze images for deep insights or generate high-quality visuals using the Imagen 3 model.',
      icon: Eye,
      color: 'bg-indigo-600',
      subIcons: [Sparkles, Zap]
    },
    {
      id: View.SPEECH,
      title: 'Speech Lab',
      description: 'Transform text into lifelike speech. Experiment with different voice personas and tonality.',
      icon: Mic,
      color: 'bg-emerald-600',
      subIcons: []
    },
    {
      id: View.VIDEO,
      title: 'Veo Video Gen',
      description: 'Create cinematic 720p videos from simple text prompts using the state-of-the-art Veo model.',
      icon: Video,
      color: 'bg-pink-600',
      subIcons: []
    }
  ];

  return (
    <div className="h-full overflow-y-auto p-2">
      <div className="max-w-5xl mx-auto space-y-10 py-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            What can you get here?
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Welcome to the Gemini Capabilities Explorer. This application is your playground to experience the latest features of the Google GenAI SDK.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => onNavigate(card.id)}
              className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-600 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/50 text-left flex flex-col h-full overflow-hidden"
            >
              <div className={`absolute top-0 right-0 p-32 opacity-5 rounded-full blur-3xl transition-transform duration-500 group-hover:scale-150 ${card.color}`}></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.color} text-white shadow-lg`}>
                    <card.icon size={24} />
                  </div>
                  <div className="flex gap-2">
                    {card.subIcons.map((Icon, idx) => (
                      <div key={idx} className="p-1.5 bg-slate-800 rounded-full text-slate-400 border border-slate-700">
                        <Icon size={14} />
                      </div>
                    ))}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                  {card.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-1">
                  {card.description}
                </p>

                <div className="flex items-center text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                  Try it now <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer info */}
        <div className="text-center pt-8 border-t border-slate-800/50">
          <p className="text-xs text-slate-500">
            Powered by <span className="text-slate-400 font-semibold">@google/genai</span> SDK • React 19 • Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
};