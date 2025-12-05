import { GoogleGenAI, Modality, Type } from "@google/genai";
import { GroundingMetadata, ModelType } from "../types";

// Declare process to avoid TS errors as per environment assumptions
declare const process: any;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper to parse raw API errors into user-friendly messages
 */
const parseGeminiError = (error: any): Error => {
    console.error("Original Gemini Error:", error);
    let msg = error.message || "Unknown error occurred";
    
    if (typeof msg === 'string' && msg.includes('{')) {
        try {
            const match = msg.match(/\{.*\}/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                if (parsed.error && parsed.error.message) {
                    msg = parsed.error.message;
                }
            }
        } catch (e) {
            // Failed to parse, use original string
        }
    }

    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
        return new Error("Usage limit exceeded (429). Please check your Google Cloud billing or quota limits.");
    }

    return new Error(msg);
};

const isQuotaError = (error: any): boolean => {
    const msg = error.message || JSON.stringify(error);
    return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");
};

/**
 * Handles Text Chat, Thinking, and Grounding
 */
export const generateChatMessage = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  config: { useGrounding: 'none' | 'search' | 'maps'; useThinking: boolean; thinkingBudget: number }
): Promise<{ text: string; grounding?: GroundingMetadata }> => {
  
  let modelName = ModelType.FLASH;
  let tools: any[] = [];
  let thinkingConfig: any = undefined;

  const now = new Date();
  const dateTimeString = now.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short'
  });
  
  const systemInstruction = `Current date and time: ${dateTimeString}. You have access to real-time tools. Use them when necessary to answer questions accurately.`;

  if (config.useThinking) {
    modelName = ModelType.PRO; 
    thinkingConfig = { thinkingBudget: config.thinkingBudget || 1024 }; 
  } else if (config.useGrounding !== 'none') {
    modelName = ModelType.FLASH; 
    if (config.useGrounding === 'search') {
      tools = [{ googleSearch: {} }];
    } else if (config.useGrounding === 'maps') {
      tools = [{ googleMaps: {} }];
    }
  }
  
  try {
    const contents = [
      ...history,
      { role: 'user', parts: [{ text: newMessage }] }
    ];

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents, 
      config: {
        tools: tools.length > 0 ? tools : undefined,
        thinkingConfig: thinkingConfig,
        systemInstruction: systemInstruction,
      },
    });

    const text = response.text || "No text response generated.";
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as any;
    
    let grounding: GroundingMetadata | undefined;
    if (groundingChunks) {
        if (config.useGrounding === 'search') {
            grounding = { searchChunks: groundingChunks };
        } else if (config.useGrounding === 'maps') {
            grounding = { mapChunks: groundingChunks };
        }
    }

    return { text, grounding };

  } catch (error: any) {
    throw parseGeminiError(error);
  }
};

/**
 * Handles Text-to-Speech
 */
export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: ModelType.TTS,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");
    return base64Audio;
  } catch (error: any) {
    throw parseGeminiError(error);
  }
};

/**
 * Handles Image Generation (Imagen) and Analysis
 */
export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: ModelType.IMAGEN,
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            }
        });
        return response.generatedImages[0].image.imageBytes;
    } catch (e: any) {
        throw parseGeminiError(e);
    }
}

export const analyzeImage = async (base64Image: string, prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: ModelType.FLASH_IMAGE, 
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/png', data: base64Image } },
                    { text: prompt }
                ]
            }
        });
        return response.text || "No analysis returned.";
    } catch (e: any) {
        throw parseGeminiError(e);
    }
}

/**
 * Handles Video Generation
 */
export interface VideoResult {
    url: string;
    contentType: 'video/mp4' | 'image/jpeg';
    isFallback: boolean;
    modelUsed: string;
}

export const generateVideo = async (
    prompt: string, 
    useVeo: boolean,
    imageBase64?: string
): Promise<VideoResult> => {
    
    if (useVeo) {
        try {
            // NOTE: For Veo, we MUST use the key from the environment/dialog, not the pre-configured one.
            const veoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const config = {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            };
            
            let operation;

            if (imageBase64) {
                 // Clean base64 if needed
                 const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
                 operation = await veoAi.models.generateVideos({
                    model: ModelType.VEO, // 'veo-3.1-fast-generate-preview'
                    prompt: prompt,
                    image: {
                        imageBytes: cleanBase64,
                        mimeType: 'image/png' 
                    },
                    config
                });
            } else {
                operation = await veoAi.models.generateVideos({
                    model: ModelType.VEO,
                    prompt: prompt,
                    config
                });
            }

            // Poll for completion
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await veoAi.operations.getVideosOperation({operation: operation});
            }
            
            const video = operation.response?.generatedVideos?.[0]?.video;
            if (!video || !video.uri) throw new Error("Video generation failed or returned no URI.");
            
            const downloadLink = video.uri;
            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            return {
                url,
                contentType: 'video/mp4',
                isFallback: false,
                modelUsed: 'Veo 3.1 (Video)'
            };

        } catch (error: any) {
             throw parseGeminiError(error);
        }
    }

    // Fallback: Low Cost Mode (Imagen 3)
    let finalPrompt = prompt;
    finalPrompt += ", cinematic shot, 8k resolution, photorealistic, highly detailed, dramatic lighting, movie still";

    console.log("Using Low-Cost Mode: Generating Cinematic Image instead of Video.");

    try {
        const imageBytes = await generateImage(finalPrompt);
        const imageUrl = `data:image/jpeg;base64,${imageBytes}`;
        
        return { 
            url: imageUrl, 
            contentType: 'image/jpeg', 
            isFallback: true, 
            modelUsed: 'Imagen 3 (Storyboard)' 
        };
    } catch (error: any) {
        throw parseGeminiError(error);
    }
}