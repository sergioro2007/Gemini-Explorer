
import * as firebaseApp from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { firebaseConfig } from '../config';

// Destructure required members from firebase/auth namespace and cast to any to avoid TypeScript missing export errors
const { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut: firebaseSignOut, 
    onAuthStateChanged 
} = firebaseAuth as any;

// Export User type as any since the named export might be missing in some type definitions
export type User = any;

// Initialize Firebase safely
let auth: any;

// Only attempt to initialize if an API key is present.
// This prevents "auth/invalid-api-key" errors when the app is running without env vars.
if (firebaseConfig && firebaseConfig.apiKey) {
    try {
        // Cast to any to bypass TypeScript resolution issues with firebase/app exports in some environments
        const safeApp = firebaseApp as any;
        // Check for existing apps to avoid duplicate initialization
        const app = safeApp.getApps().length === 0 ? safeApp.initializeApp(firebaseConfig) : safeApp.getApp();
        auth = getAuth(app);
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
} else {
    // Config is missing. Auth will be undefined.
    // The UI (LoginView) checks for this and shows a "Configuration Required" message.
    console.debug("Firebase API Key missing. Auth service skipped.");
}

export const signIn = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase not configured");
    return signInWithEmailAndPassword(auth, email, pass);
};

export const signUp = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase not configured");
    return createUserWithEmailAndPassword(auth, email, pass);
};

export const signInWithGoogle = async () => {
    if (!auth) throw new Error("Firebase not configured");
    const provider = new GoogleAuthProvider();
    // Force account selection prompt
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
        return await signInWithPopup(auth, provider);
    } catch (error: any) {
        // Detailed logging for debugging
        console.error("Google Sign-In Error Code:", error.code);
        console.error("Google Sign-In Error Message:", error.message);
        throw error;
    }
};

export const signOut = async () => {
    if (!auth) return;
    return firebaseSignOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    if (!auth) {
        callback(null);
        return () => {};
    }
    return onAuthStateChanged(auth, callback);
};
