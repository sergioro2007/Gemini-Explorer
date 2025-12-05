import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Sparkles, Upload, Zap } from 'lucide-react';
import { Button } from '../components/Button';
import { generateImage, analyzeImage } from '../services/geminiService';

export const VisionView: React.FC = () => {
  const [mode, setMode] = useState<'generate' | 'analyze'>('generate');
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [analysisText, setAnalysisText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Force scroll to top on mount
  useEffect(() => {
    const timer = setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
       if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          alert("Please upload a PNG, JPEG, or WEBP image.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Strip prefix for API
        setSelectedImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setResultImage(null);
    setAnalysisText('');

    try {
        if (mode === 'generate') {
            const imageBytes = await generateImage(prompt);
            setResultImage(`data:image/jpeg;base64,${imageBytes}`);
        } else {
            if (!selectedImage) return;
            // Need just base64 data without header
            const cleanBase64 = selectedImage.split(',')[1];
            const text = await analyzeImage(cleanBase64, prompt || "Describe this image in detail.");
            setAnalysisText(text);
        }
    } catch (e) {
        alert("Operation failed. See console.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div ref={scrollRef} className="h-full bg-slate-900 md:rounded-xl md:border border-slate-800 overflow-y-auto no-scrollbar">
       <div className="max-w-4xl mx-auto space-y-4 md:space-y-8 px-3 md:px-6 pt-[calc(3rem+env(safe-area-inset-top)+0.75rem)] pb-[calc(4.5rem+env(safe-area-inset-bottom)+0.75rem)] md:py-6">
            <div className="grid grid-cols-2 gap-2 md:flex md:justify-center md:gap-4">
                <button 
                  onClick={() => setMode('generate')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs md:text-sm font-medium transition-all ${mode === 'generate' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-indigo-900'}`}
                >
                    <Sparkles size={14} /> Generate
                </button>
                <button 
                  onClick={() => setMode('analyze')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs md:text-sm font-medium transition-all ${mode === 'analyze' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-indigo-900'}`}
                >
                    <ImageIcon size={14} /> Analyze
                </button>
            </div>

            <div className="bg-slate-950 p-3 md:p-6 rounded-xl border border-slate-800 shadow-xl">
                {mode === 'analyze' && (
                    <div className="mb-3 md:mb-4">
                        <label className="block w-full cursor-pointer group">
                             <input 
                                type="file" 
                                className="hidden" 
                                accept="image/png, image/jpeg, image/webp" 
                                onChange={handleFileChange} 
                             />
                             <div className={`border-2 border-dashed rounded-xl h-20 md:h-48 flex flex-col items-center justify-center transition-colors ${selectedImage ? 'border-indigo-500 bg-slate-900' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-900'}`}>
                                {selectedImage ? (
                                    <img src={selectedImage} alt="Preview" className="h-full object-contain rounded-lg" />
                                ) : (
                                    <>
                                        <Upload className="text-slate-500 mb-1 group-hover:text-slate-300" size={20} />
                                        <span className="text-slate-500 text-xs group-hover:text-slate-300">Upload Image</span>
                                    </>
                                )}
                             </div>
                        </label>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                    <input 
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={mode === 'generate' ? "A cyberpunk cat..." : "Describe image..."}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                    <Button 
                        onClick={handleSubmit} 
                        isLoading={isLoading} 
                        disabled={mode === 'analyze' && !selectedImage}
                        className="w-full md:w-auto h-10 md:h-auto"
                    >
                        {mode === 'generate' ? 'Create' : 'See'}
                    </Button>
                </div>
            </div>

            {/* Results Area */}
            {(resultImage || analysisText) && (
                <div className="animate-fade-in pb-10 md:pb-0">
                    <h3 className="text-base md:text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Zap className="text-yellow-400" size={16} /> Result
                    </h3>
                    <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                        {resultImage && (
                            <img src={resultImage} alt="Generated" className="w-full max-w-lg mx-auto rounded-lg shadow-2xl" />
                        )}
                        {analysisText && (
                            <div className="prose prose-invert prose-sm max-w-none text-xs md:text-sm">
                                <p>{analysisText}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
       </div>
    </div>
  );
};