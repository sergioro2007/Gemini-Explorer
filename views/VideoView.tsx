
import React, { useState } from 'react';
import { Video, Film, AlertTriangle, Clock, Download, Image as ImageIcon, Sparkles, Upload, X } from 'lucide-react';
import { Button } from '../components/Button';
import { generateVideo, VideoResult } from '../services/geminiService';

export const VideoView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<'5s' | '10s' | '20s'>('5s');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<VideoResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Basic validation
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          alert("Please upload a PNG, JPEG, or WEBP image. HEIC and other formats are not supported by the browser preview.");
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
    if (!prompt && !selectedImage) return; // Need at least one input
    setIsLoading(true);
    setResult(null);
    setStatus('Initializing generation...');
    
    try {
        setStatus(`Generating ${duration} video... This may take a few minutes.`);
        // Pass the image if selected, otherwise undefined
        const res = await generateVideo(prompt || "A cinematic video", duration, selectedImage || undefined);
        if (res) {
            setResult(res);
            setStatus('Complete!');
        } else {
            setStatus('Failed to retrieve content.');
        }
    } catch (e) {
        console.error(e);
        // Error message is already cleaned by service
        setStatus((e as Error).message); 
    } finally {
        setIsLoading(false);
    }
  };

  const isError = status.toLowerCase().includes('error') || status.toLowerCase().includes('failed') || status.toLowerCase().includes('limit');

  return (
    <div className="h-full bg-slate-900 rounded-xl p-6 border border-slate-800 overflow-y-auto flex flex-col items-center">
         <div className="max-w-3xl w-full space-y-8">
             <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                 <div className="p-3 bg-pink-900/20 rounded-lg border border-pink-500/30">
                     <Film className="text-pink-500" size={32} />
                 </div>
                 <div>
                     <h2 className="text-2xl font-bold text-white">Veo Video Studio</h2>
                     <p className="text-pink-300/80">Generate high-quality 720p videos from text prompts or reference images.</p>
                 </div>
             </div>

             {/* Notice */}
             <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex gap-3 text-sm text-slate-400">
                <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
                <p>Veo generation requires a paid billing project. If quotas are exceeded, the app will automatically attempt to generate a high-quality preview image instead.</p>
             </div>

             <div className="space-y-4">
                 {/* Image Upload Area */}
                 <div className="relative group">
                    {selectedImage ? (
                        <div className="relative w-full h-48 bg-slate-950 border border-slate-700 rounded-xl flex items-center justify-center overflow-hidden">
                            <img src={selectedImage} alt="Reference" className="h-full object-contain" />
                            <button 
                                onClick={clearImage}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-600 rounded-full text-white transition-colors"
                                title="Remove Image"
                            >
                                <X size={16} />
                            </button>
                            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                                Reference Image Used
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
                             <div className="w-full h-32 bg-slate-950 border border-dashed border-slate-700 hover:border-pink-500 hover:bg-slate-900 rounded-xl flex flex-col items-center justify-center transition-all">
                                <Upload className="text-slate-500 mb-2 group-hover:text-pink-400" size={24} />
                                <span className="text-slate-500 text-sm group-hover:text-pink-300">Click to add a reference image (optional)</span>
                                <span className="text-slate-600 text-xs mt-1">Supports PNG, JPEG, WEBP</span>
                             </div>
                        </label>
                    )}
                 </div>

                 <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the video scene: A futuristic car driving through a neon city..."
                    className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-pink-500 outline-none placeholder-slate-600"
                 />
                 
                 {/* Duration Selector */}
                 <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2 px-2 text-slate-400">
                        <Clock size={16} />
                        <span className="text-sm font-medium">Target Duration</span>
                    </div>
                    <div className="flex bg-slate-900 rounded-md p-1">
                        {[
                            { id: '5s', label: 'Standard (~5s)' },
                            { id: '10s', label: 'Medium (~10s)' },
                            { id: '20s', label: 'Long (~20s)' }
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setDuration(opt.id as any)}
                                className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${
                                    duration === opt.id 
                                        ? 'bg-pink-600 text-white shadow-sm' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                 </div>

                 <Button 
                    onClick={handleGenerate} 
                    isLoading={isLoading} 
                    disabled={!prompt && !selectedImage}
                    className="w-full !bg-pink-600 hover:!bg-pink-500 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Generating (Auto-switching if needed)...' : 'Generate Video'}
                </Button>
             </div>

             {/* Status / Player */}
             <div className="bg-slate-950 rounded-xl border border-slate-800 min-h-[300px] flex items-center justify-center relative overflow-hidden flex-col">
                 {isLoading && (
                     <div className="text-center space-y-4 z-10 p-6">
                         <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                         <p className="text-pink-200 font-medium animate-pulse">{status}</p>
                     </div>
                 )}

                 {/* Error State */}
                 {!isLoading && !result && isError && (
                     <div className="text-center space-y-4 z-10 p-6 max-w-lg">
                         <AlertTriangle className="text-red-500 mx-auto" size={48} />
                         <p className="text-red-400 font-medium whitespace-pre-wrap">{status}</p>
                     </div>
                 )}
                 
                 {!isLoading && !result && !isError && (
                     <div className="text-slate-600 flex flex-col items-center">
                         <Video size={48} className="mb-2 opacity-50" />
                         <p>Video output will appear here</p>
                     </div>
                 )}

                 {result && (
                    <div className="w-full h-full flex flex-col">
                         {result.isFallback && (
                            <div className="bg-yellow-900/30 border-b border-yellow-700/30 p-2 flex items-center justify-center gap-2 text-yellow-500 text-sm font-medium">
                                <Sparkles size={16} />
                                Video quota reached. Generated high-quality image preview (Imagen 3).
                            </div>
                         )}

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
                             <div className="w-full h-full flex items-center justify-center bg-black py-4">
                                <img 
                                    src={result.url} 
                                    alt="Generated Fallback" 
                                    className="max-h-[400px] max-w-full object-contain rounded-lg shadow-2xl"
                                />
                             </div>
                         )}
                         
                         <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                            <span className="text-xs text-slate-500 font-mono">Model: {result.modelUsed}</span>
                            <a 
                                href={result.url} 
                                download={`generated_content.${result.contentType === 'video/mp4' ? 'mp4' : 'jpg'}`}
                            >
                                <Button variant="secondary" className="text-sm">
                                    <Download size={16} className="mr-2" /> 
                                    Download {result.contentType === 'video/mp4' ? 'Video' : 'Image'}
                                </Button>
                            </a>
                         </div>
                    </div>
                 )}
             </div>
         </div>
    </div>
  );
};
