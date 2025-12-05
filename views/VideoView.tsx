import React, { useState, useRef, useEffect } from 'react';
import { Video, Film, AlertTriangle, Download, Sparkles, Upload, X, CreditCard, CheckCircle, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { generateVideo, VideoResult } from '../services/geminiService';

export const VideoView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<VideoResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  
  // Mode: 'storyboard' (Free) or 'veo' (Paid)
  const [mode, setMode] = useState<'storyboard' | 'veo'>('storyboard');
  const [hasPaidKey, setHasPaidKey] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Force scroll to top on mount
  useEffect(() => {
    const timer = setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Check for paid key availability
  useEffect(() => {
      const checkKey = async () => {
          if ((window as any).aistudio) {
              const hasKey = await (window as any).aistudio.hasSelectedApiKey();
              setHasPaidKey(hasKey);
          }
      };
      checkKey();
      const interval = setInterval(checkKey, 2000);
      return () => clearInterval(interval);
  }, []);

  const handleSelectKey = async () => {
      if ((window as any).aistudio) {
          try {
              await (window as any).aistudio.openSelectKey();
              const hasKey = await (window as any).aistudio.hasSelectedApiKey();
              setHasPaidKey(hasKey);
          } catch (e) {
              console.error("Failed to open key selector", e);
          }
      } else {
          alert("Key selection is only available in the preview environment.");
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          alert("Please upload a PNG, JPEG, or WEBP image.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
  };

  const handleGenerate = async () => {
    if (!prompt && !selectedImage) return; 
    
    // Veo Requirement Check
    if (mode === 'veo' && !hasPaidKey) {
        handleSelectKey();
        return;
    }

    setIsLoading(true);
    setResult(null);
    setStatus('Initializing...');
    
    try {
        setStatus(mode === 'veo' ? `Generating video (this may take a minute)...` : `Generating cinematic storyboard...`);
        const res = await generateVideo(
            prompt || "A cinematic scene", 
            mode === 'veo', 
            selectedImage || undefined
        );
        if (res) {
            setResult(res);
            setStatus('Complete!');
        } else {
            setStatus('Failed.');
        }
    } catch (e) {
        console.error(e);
        setStatus((e as Error).message); 
    } finally {
        setIsLoading(false);
    }
  };

  const isError = status.toLowerCase().includes('error') || status.toLowerCase().includes('failed') || status.toLowerCase().includes('limit');

  return (
    <div ref={scrollRef} className="h-full bg-slate-900 md:rounded-xl md:border border-slate-800 overflow-y-auto no-scrollbar">
         <div className="min-h-full flex flex-col items-center px-3 md:px-6 pt-[calc(3rem+env(safe-area-inset-top)+0.75rem)] pb-[calc(4.5rem+env(safe-area-inset-bottom)+0.75rem)] md:py-6">
             <div className="max-w-3xl w-full space-y-4 md:space-y-6">
                 
                 {/* Header */}
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-pink-900/20 rounded-lg border border-pink-500/30">
                             <Film className="text-pink-500" size={20} />
                         </div>
                         <div>
                             <h2 className="text-lg md:text-xl font-bold text-white">Video Studio</h2>
                             <p className="text-pink-300/80 text-[10px] md:text-sm">Create cinematic content with Veo.</p>
                         </div>
                     </div>
                 </div>

                 {/* Mode Tabs */}
                 <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setMode('storyboard')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                            mode === 'storyboard' 
                            ? 'bg-slate-800 text-white shadow-lg shadow-black/20 ring-1 ring-slate-700' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                        }`}
                    >
                        <ImageIcon size={16} className={mode === 'storyboard' ? 'text-indigo-400' : ''} />
                        <div className="flex flex-col items-start leading-none">
                            <span>Storyboard</span>
                            <span className="text-[10px] opacity-60 mt-0.5 font-normal">Free Version</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setMode('veo')}
                        className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                            mode === 'veo' 
                            ? 'bg-gradient-to-br from-pink-900/50 to-purple-900/50 text-white shadow-lg shadow-pink-900/10 ring-1 ring-pink-500/50' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                        }`}
                    >
                        <Video size={16} className={mode === 'veo' ? 'text-pink-400' : ''} />
                        <div className="flex flex-col items-start leading-none">
                            <span>Veo Video</span>
                            <span className="text-[10px] opacity-60 mt-0.5 font-normal">Paid Feature</span>
                        </div>
                    </button>
                 </div>

                 {/* Veo Pricing Info */}
                 {mode === 'veo' && (
                     <div className="bg-slate-950 border border-pink-900/30 rounded-xl p-4 animate-fade-in space-y-4 shadow-lg shadow-pink-900/10 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                         
                         <div className="flex items-start gap-3 relative z-10">
                            <div className="p-2.5 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-lg border border-pink-500/20 shrink-0">
                                <CreditCard className="text-pink-400" size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-base font-bold text-white mb-1">Veo 3.1 Generation</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed mb-3">
                                            High-fidelity video generation requires a paid Google Cloud project.
                                        </p>
                                    </div>
                                    <div className="bg-pink-950/30 px-3 py-1.5 rounded-lg border border-pink-500/20 text-right">
                                        <span className="block text-pink-300 font-mono text-sm font-bold">$0.40</span>
                                        <span className="block text-[10px] text-pink-400/60 uppercase tracking-wider">Per Second</span>
                                    </div>
                                </div>
                                
                                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-pink-400 underline underline-offset-2 transition-colors">
                                    View Billing Documentation <ExternalLink size={10} />
                                </a>
                            </div>
                         </div>
                         
                         <div className="bg-slate-900 rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-3 border border-slate-800 relative z-10">
                             <div className="flex items-center gap-2 w-full md:w-auto">
                                 {hasPaidKey ? (
                                     <CheckCircle className="text-emerald-500 shrink-0" size={18} />
                                 ) : (
                                     <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                                 )}
                                 <span className={`text-sm font-medium ${hasPaidKey ? 'text-emerald-400' : 'text-amber-400'}`}>
                                     {hasPaidKey ? 'Paid API Key Active' : 'Paid API Key Required'}
                                 </span>
                             </div>
                             <Button 
                                variant={hasPaidKey ? "secondary" : "primary"} 
                                onClick={handleSelectKey}
                                className="text-xs h-9 px-4 font-semibold w-full md:w-auto whitespace-nowrap"
                             >
                                 {hasPaidKey ? 'Change Key' : 'Select Paid API Key'}
                             </Button>
                         </div>
                     </div>
                 )}

                 <div className="space-y-3">
                     <div className="relative group">
                        {selectedImage ? (
                            <div className="relative w-full h-16 md:h-48 bg-slate-950 border border-slate-700 rounded-xl flex items-center justify-center overflow-hidden">
                                <img src={selectedImage} alt="Reference" className="h-full object-contain" />
                                <button 
                                    onClick={clearImage}
                                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-600 rounded-full text-white transition-colors"
                                >
                                    <X size={12} />
                                </button>
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-[10px] text-white backdrop-blur-sm">
                                    Reference Image
                                </div>
                            </div>
                        ) : (
                            <label className="block w-full cursor-pointer">
                                 <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/png, image/jpeg, image/webp" 
                                    onChange={handleFileChange} 
                                 />
                                 <div className="w-full h-16 md:h-32 bg-slate-950 border border-dashed border-slate-700 hover:border-pink-500 hover:bg-slate-900 rounded-xl flex flex-col items-center justify-center transition-all group">
                                    <Upload className="text-slate-500 mb-2 group-hover:text-pink-400 transition-colors" size={20} />
                                    <span className="text-slate-500 text-xs font-medium group-hover:text-pink-300">
                                        Upload Reference Image (Optional)
                                    </span>
                                 </div>
                            </label>
                        )}
                     </div>

                     <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={mode === 'veo' ? "Describe the video: A cybernetic tiger running through neon rain..." : "Describe the scene: A futuristic car driving through a neon city..."}
                        className="w-full h-24 md:h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-pink-500 outline-none placeholder-slate-600 text-sm resize-none"
                     />
                     
                     {mode === 'storyboard' ? (
                        <div className="p-3 bg-indigo-950/30 rounded-lg border border-indigo-500/20 text-xs text-indigo-300 flex gap-2 items-center">
                            <Sparkles size={14} className="text-indigo-400 shrink-0" />
                            <span><strong>Free Mode:</strong> Generates a high-quality static storyboard image using Imagen.</span>
                        </div>
                     ) : (
                        <div className="p-3 bg-pink-950/30 rounded-lg border border-pink-500/20 text-xs text-pink-300 flex gap-2 items-center">
                            <Video size={14} className="text-pink-400 shrink-0" />
                            <span><strong>Paid Mode:</strong> Generates a 5s video using Veo 3.1 (~$2.00 cost).</span>
                        </div>
                     )}

                     <Button 
                        onClick={handleGenerate} 
                        isLoading={isLoading} 
                        disabled={(!prompt && !selectedImage) || (mode === 'veo' && !hasPaidKey && isLoading)} 
                        className={`w-full py-3 md:py-4 text-sm md:text-lg font-bold shadow-xl transition-all ${
                            mode === 'veo' 
                            ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-pink-900/20' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
                        }`}
                    >
                        {isLoading ? 'Generating...' : mode === 'veo' ? 'Generate Video (~$2.00)' : 'Generate Storyboard (Free)'}
                    </Button>
                 </div>

                 {/* Output Area */}
                 <div className="bg-slate-950 rounded-xl border border-slate-800 min-h-[250px] flex items-center justify-center relative overflow-hidden flex-col">
                     {isLoading && (
                         <div className="text-center space-y-4 z-10 p-6">
                             <div className={`w-12 h-12 border-4 ${mode === 'veo' ? 'border-pink-500' : 'border-indigo-500'} border-t-transparent rounded-full animate-spin mx-auto`}></div>
                             <p className={`${mode === 'veo' ? 'text-pink-200' : 'text-indigo-200'} text-sm font-medium animate-pulse`}>{status}</p>
                         </div>
                     )}

                     {!isLoading && !result && isError && (
                         <div className="text-center space-y-4 z-10 p-6 max-w-lg">
                             <AlertTriangle className="text-red-500 mx-auto" size={48} />
                             <p className="text-red-400 font-medium whitespace-pre-wrap">{status}</p>
                         </div>
                     )}
                     
                     {!isLoading && !result && !isError && (
                         <div className="text-slate-700 flex flex-col items-center">
                             <Film size={64} className="mb-4 opacity-20" />
                             <p className="text-sm">Output will appear here</p>
                         </div>
                     )}

                     {result && (
                        <div className="w-full h-full flex flex-col animate-fade-in">
                             {result.contentType === 'video/mp4' ? (
                                 <video 
                                    key={result.url} 
                                    controls 
                                    autoPlay 
                                    loop 
                                    className="w-full max-h-[400px] object-contain bg-black"
                                    src={result.url}
                                 >
                                     Your browser does not support the video tag.
                                 </video>
                             ) : (
                                 <img src={result.url} className="max-h-[400px] w-full object-contain bg-black" alt="Generated Scene" />
                             )}
                             <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Model</span>
                                    <span className="text-xs text-slate-300 font-mono">{result.modelUsed}</span>
                                </div>
                                <a href={result.url} download={`generated_${mode === 'veo' ? 'video.mp4' : 'storyboard.jpg'}`}>
                                    <Button variant="secondary" className="text-xs h-8 px-3"><Download size={14} className="mr-1"/> Save</Button>
                                </a>
                             </div>
                        </div>
                     )}
                 </div>
             </div>
         </div>
    </div>
  );
};