import React, { useState, useRef, useEffect } from 'react';
import { Volume2, PlayCircle, Square, AlertCircle, Download, FileAudio } from 'lucide-react';
import { Button } from '../components/Button';
import { generateSpeech } from '../services/geminiService';

declare global {
  interface Window {
    lamejs: any;
  }
}

// Helper: Decode Base64 to Uint8Array
const base64ToUint8Array = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Helper: Convert Raw PCM (Int16) to AudioBuffer
const pcmToAudioBuffer = (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000
): AudioBuffer => {
  // Create an Int16 view of the byte buffer
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  
  // Create an AudioBuffer (1 channel, correct length, specific sample rate)
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  // Normalize Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
};

// Helper: Write String to DataView
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

// Helper: Create WAV Blob from PCM Data
const createWavBlob = (pcmData: Uint8Array, sampleRate: number): Blob => {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF chunk
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  const payload = new Uint8Array(buffer, 44);
  payload.set(pcmData);

  return new Blob([buffer], { type: 'audio/wav' });
};

// Helper: Create MP3 Blob from PCM Data (Int16) using global lamejs
const createMp3Blob = (pcmData: Int16Array, sampleRate: number): Blob => {
  if (!window.lamejs) {
    throw new Error("lamejs library not loaded");
  }

  const encoder = new window.lamejs.Mp3Encoder(1, sampleRate, 128); // 1 channel, rate, 128kbps
  const mp3Data = [];
  
  // Encode in chunks to prevent blocking UI too much
  const sampleBlockSize = 1152;
  for (let i = 0; i < pcmData.length; i += sampleBlockSize) {
    const chunk = pcmData.subarray(i, i + sampleBlockSize);
    const mp3buf = encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }
  
  // Flush
  const mp3buf = encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }
  
  return new Blob(mp3Data, { type: 'audio/mp3' });
};

export const SpeechView: React.FC = () => {
  const [text, setText] = useState('Welcome to the Gemini API capability showcase. I can speak naturally in many voices.');
  const [voice, setVoice] = useState('Kore');
  const [format, setFormat] = useState<'wav' | 'mp3'>('mp3');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, []);

  // Revoke URL when format changes to force regeneration of the link logic if we were to auto-update
  const [rawAudioBytes, setRawAudioBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (rawAudioBytes) {
       updateDownloadLink(rawAudioBytes, format);
    }
  }, [format, rawAudioBytes]);

  const updateDownloadLink = (bytes: Uint8Array, fmt: 'wav' | 'mp3') => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      
      let blob: Blob;
      try {
        if (fmt === 'wav') {
            blob = createWavBlob(bytes, 24000);
        } else {
            // Create Int16 view for lamejs
            const int16 = new Int16Array(bytes.buffer);
            blob = createMp3Blob(int16, 24000);
        }
        
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
      } catch (e) {
        console.error("Encoding error:", e);
        setError("Failed to encode audio. Ensure libraries are loaded.");
      }
  }

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
        try {
            sourceNodeRef.current.stop();
        } catch (e) {
            // Ignore errors if already stopped
        }
        sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleGenerateAndPlay = async () => {
    stopPlayback();
    setIsLoading(true);
    setError(null);
    setRawAudioBytes(null); // Clear previous

    try {
        const base64 = await generateSpeech(text, voice);
        const rawBytes = base64ToUint8Array(base64);
        setRawAudioBytes(rawBytes); // Save for format switching

        // Initialize AudioContext if needed (must be 24000Hz for Gemini Flash TTS)
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
             audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        // Decode Raw PCM for playback
        const audioBuffer = pcmToAudioBuffer(rawBytes, ctx, 24000);

        // Play
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsPlaying(false);
        
        sourceNodeRef.current = source;
        source.start(0);
        setIsPlaying(true);
        
    } catch (e) {
        console.error(e);
        setError("Failed to generate or play speech. Please check your connection.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="h-full bg-slate-900 rounded-xl p-8 border border-slate-800 flex flex-col items-center justify-center overflow-y-auto">
        <div className="w-full max-w-2xl space-y-6">
            <div className="text-center space-y-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border transition-all duration-500 ${isPlaying ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)] scale-110' : 'bg-emerald-900/30 border-emerald-500/30'}`}>
                    {isPlaying ? (
                        <div className="flex gap-1 h-6 items-center">
                            <div className="w-1 bg-white animate-[bounce_1s_infinite] h-3"></div>
                            <div className="w-1 bg-white animate-[bounce_1.2s_infinite] h-6"></div>
                            <div className="w-1 bg-white animate-[bounce_0.8s_infinite] h-4"></div>
                        </div>
                    ) : (
                        <Volume2 className="text-emerald-400" size={32} />
                    )}
                </div>
                <h2 className="text-2xl font-bold text-white">Text to Speech</h2>
                <p className="text-slate-400">Convert any text into human-like spoken audio using Gemini.</p>
            </div>

            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                {error && (
                    <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-center gap-2 text-red-200 text-sm">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Voice Model</label>
                    <div className="grid grid-cols-5 gap-2">
                        {['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].map(v => (
                            <button
                                key={v}
                                onClick={() => setVoice(v)}
                                className={`py-2 px-1 rounded-md text-sm border transition-colors ${voice === v ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                     <label className="block text-sm font-medium text-slate-400 mb-2">Input Text</label>
                     <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none placeholder-slate-600"
                        placeholder="Type something for Gemini to say..."
                     />
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-slate-800/50">
                    <div className="flex-1">
                        <label className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1 block">Output Format</label>
                        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 w-fit">
                            <button 
                                onClick={() => setFormat('mp3')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${format === 'mp3' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-emerald-400'}`}
                            >
                                MP3
                            </button>
                            <button 
                                onClick={() => setFormat('wav')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${format === 'wav' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-emerald-400'}`}
                            >
                                WAV
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    {isPlaying ? (
                        <Button onClick={stopPlayback} variant="danger" className="w-full py-4 text-lg">
                            <Square className="mr-2 fill-current" size={18} /> Stop
                        </Button>
                    ) : (
                        <Button onClick={handleGenerateAndPlay} isLoading={isLoading} className="w-full py-4 text-lg !bg-emerald-600 hover:!bg-emerald-500 border-t border-emerald-400/20">
                            <PlayCircle className="mr-2" /> Generate & Speak
                        </Button>
                    )}
                    
                    {downloadUrl && !isLoading && (
                        <a 
                            href={downloadUrl} 
                            download={`gemini_speech_${voice}.${format}`}
                            className="flex-shrink-0"
                        >
                             <Button variant="secondary" className="h-full px-4 border-slate-600 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/50" title={`Download ${format.toUpperCase()}`}>
                                <Download size={24} />
                             </Button>
                        </a>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};