
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { GroundingMetadata, ModelType } from "../types";

// Initialize API Client
// Note: API key is injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper to parse raw API errors into user-friendly messages
 */
const parseGeminiError = (error: any): Error => {
    console.error("Original Gemini Error:", error);
    let msg = error.message || "Unknown error occurred";
    
    // Attempt to extract message from JSON string if present
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

  // System Instruction with Date/Time Awareness
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

  // Configuration Logic
  if (config.useThinking) {
    modelName = ModelType.PRO; // Thinking requires Pro
    // Ensure thinking budget is valid for the model
    thinkingConfig = { thinkingBudget: config.thinkingBudget || 1024 }; 
  } else if (config.useGrounding !== 'none') {
    modelName = ModelType.FLASH; // Grounding works well with Flash
    if (config.useGrounding === 'search') {
      tools = [{ googleSearch: {} }];
    } else if (config.useGrounding === 'maps') {
      tools = [{ googleMaps: {} }];
    }
  }
  
  try {
    // Construct full content history for multi-turn chat
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
    
    // Extract Grounding Metadata
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

  } catch (error) {
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
  } catch (error) {
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
                aspectRatio: '1:1',
            }
        });
        return response.generatedImages[0].image.imageBytes;
    } catch (e) {
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
    } catch (e) {
        throw parseGeminiError(e);
    }
}

/**
 * Helper to run a specific Veo model generation
 */
const attemptVeoGeneration = async (model: string, prompt: string, imageBase64?: string): Promise<string> => {
    // Ensure API Key is clean
    const apiKey = process.env.API_KEY?.trim();
    if (!apiKey) throw new Error("API Key is missing or invalid.");

    const veoAi = new GoogleGenAI({ apiKey: apiKey }); 
    console.log(`Starting Veo generation with model: ${model}`);
    
    const payload: any = {
        model: model,
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p', 
            aspectRatio: '16:9'
        }
    };

    // If an image is provided, parse and add it to the payload
    if (imageBase64) {
        // Extract raw base64 and mimeType from data URL
        const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
             const mimeType = matches[1];
             const data = matches[2];
             payload.image = {
                 imageBytes: data,
                 mimeType: mimeType
             };
        } else {
            console.warn("Invalid image format provided to Veo, proceeding with text only.");
        }
    }
    
    let operation = await veoAi.models.generateVideos(payload);

    // Polling loop
    let pollCount = 0;
    const maxPolls = 60; // 10 mins
    
    while (!operation.done) {
        pollCount++;
        if (pollCount > maxPolls) {
            throw new Error("Video generation timed out.");
        }
        
        console.log(`Veo (${model}) in progress... (Attempt ${pollCount})`);
        await new Promise(resolve => setTimeout(resolve, 10000)); 
        
        try {
            operation = await veoAi.operations.getVideosOperation({ operation: operation });
        } catch (pollError) {
            console.warn("Transient polling error:", pollError);
        }
    }

    if (operation.error) {
        throw new Error(operation.error.message || JSON.stringify(operation.error));
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("No video URI found in response");

    // Strategy 1: Fetch via Header (Most Robust)
    // This avoids putting the API key in the URL and handles special chars better
    try {
        const response = await fetch(videoUri, {
            headers: {
                'x-goog-api-key': apiKey
            }
        });
        
        if (!response.ok) {
             console.warn(`Header fetch failed: ${response.status} ${response.statusText}`);
             // Throw to trigger fallback to URL method
             throw new Error("Header fetch failed");
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'video/mp4' });
        return URL.createObjectURL(blob);
    } catch (e) {
        console.warn("Secure header fetch failed, falling back to signed URL parameter.", e);
        
        // Strategy 2: URL Parameter (Fallback)
        // Must STRICTLY encode the API key to prevent "API Key Invalid" errors
        const separator = videoUri.includes('?') ? '&' : '?';
        const signedUrl = `${videoUri}${separator}key=${encodeURIComponent(apiKey)}`;
        return signedUrl;
    }
};

/**
 * Handles Video Generation (Veo) with Multi-Model Fallback
 */
export interface VideoResult {
    url: string;
    contentType: 'video/mp4' | 'image/jpeg';
    isFallback: boolean;
    modelUsed: string;
}

export const generateVideo = async (prompt: string, durationPreference: '5s' | '10s' | '20s' = '5s', imageBase64?: string): Promise<VideoResult> => {
    // Check for API Key selection (Only for AI Studio environment)
    try {
        const win = window as any;
        if (win.aistudio && win.aistudio.hasSelectedApiKey && !await win.aistudio.hasSelectedApiKey()) {
            await win.aistudio.openSelectKey();
        }
    } catch (e) {
        console.warn("AIStudio Key Selection Check Failed:", e);
    }
    
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing. Please ensure you have selected a key.");
    }

    let finalPrompt = prompt;
    if (durationPreference !== '5s') {
        finalPrompt = `${prompt} (Create a video that is approximately ${durationPreference} long)`;
    }

    // Attempt 1: Veo Fast
    try {
        const url = await attemptVeoGeneration(ModelType.VEO, finalPrompt, imageBase64);
        return { url, contentType: 'video/mp4', isFallback: false, modelUsed: 'Veo Fast' };
    } catch (error: any) {
        if (isQuotaError(error)) {
            console.warn("Veo Fast quota exceeded. Trying Standard Veo...");
        } else {
            throw parseGeminiError(error);
        }
    }

    // Attempt 2: Veo Standard (Fallback)
    try {
        const url = await attemptVeoGeneration(ModelType.VEO_STD, finalPrompt, imageBase64);
        return { url, contentType: 'video/mp4', isFallback: false, modelUsed: 'Veo Standard' };
    } catch (error: any) {
        if (isQuotaError(error)) {
            console.warn("Veo Standard quota exceeded. Falling back to Image Generation...");
        } else {
            // If it wasn't a quota error, throw it (e.g. Safety filter)
            throw parseGeminiError(error);
        }
    }

    // Attempt 3: Imagen 3 (Final Fallback)
    try {
        // Fallback ignores the image input since generateImage currently is text-to-image only in this app
        const imageBytes = await generateImage(finalPrompt + ", cinematic, photorealistic, 8k, video frame");
        const imageUrl = `data:image/jpeg;base64,${imageBytes}`;
        return { url: imageUrl, contentType: 'image/jpeg', isFallback: true, modelUsed: 'Imagen 3 (Fallback)' };
    } catch (error) {
        throw new Error("All generation attempts failed (Video & Image quotas exceeded).");
    }
}
