/// <reference types="vite/client" />

// Declare process for TypeScript (Vite define will replace process.env.API_KEY with the string literal)
declare const process: any;

// Configuration using environment variables
// The API Key is injected by Vite's define plugin from VITE_GOOGLE_API_KEY in .env
const ENV_KEY = process.env.API_KEY;

// Fallback: Read from LocalStorage (manual config override if ever needed)
const getStoredConfig = () => {
    if (typeof window === 'undefined') return null;
    try {
        const item = window.localStorage.getItem('gemini_explorer_config');
        return item ? JSON.parse(item) : null;
    } catch (e) { return null; }
};

const stored = getStoredConfig();

export const getStoredGeminiKey = () => stored?.geminiApiKey;

// Export the key helper for the service layer
export const getEnvGeminiKey = () => {
    if (ENV_KEY) return ENV_KEY;
    return getStoredGeminiKey();
};

export const firebaseConfig = {
  apiKey: ENV_KEY, 
  authDomain: "gen-lang-client-0865075597.firebaseapp.com",
  projectId: "gen-lang-client-0865075597",
  storageBucket: "gen-lang-client-0865075597.firebasestorage.app",
  messagingSenderId: "441309312094",
  appId: "1:441309312094:web:09c1d6d95c440cd75eb0cf",
  measurementId: "G-XWKVV74LSB"
};