
export enum View {
  HOME = 'HOME',
  CHAT = 'CHAT',
  VISION = 'VISION',
  SPEECH = 'SPEECH',
  VIDEO = 'VIDEO'
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
  IMAGEN = 'imagen-4.0-generate-001',
  FLASH_IMAGE = 'gemini-2.5-flash-image',
  TTS = 'gemini-2.5-flash-preview-tts',
  VEO = 'veo-3.1-fast-generate-preview',
  VEO_STD = 'veo-3.1-generate-preview'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  audio?: string; // Base64 audio
  groundingMetadata?: GroundingMetadata;
  isThinking?: boolean;
}

export interface GroundingMetadata {
  searchChunks?: {
    web?: { uri: string; title: string };
  }[];
  mapChunks?: {
    maps?: { uri: string; title: string; placeAnswerSources?: unknown[] };
  }[];
}

export interface ChatConfig {
  useGrounding: 'none' | 'search' | 'maps';
  useThinking: boolean;
  thinkingBudget: number;
}
