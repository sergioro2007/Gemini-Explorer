import * as firebaseApp from 'firebase/app';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut as firebaseSignOut, 
    onAuthStateChanged, 
    User
} from 'firebase/auth';
import { firebaseConfig } from '../config';

// Initialize Firebase safely (prevents "Firebase App named '[DEFAULT]' already exists" error)
let auth: any;
try {
    // Cast to any to bypass TypeScript resolution issues with firebase/app exports in some environments
    const safeApp = firebaseApp as any;
    const app = safeApp.getApps().length === 0 ? safeApp.initializeApp(firebaseConfig) : safeApp.getApp();
    auth = getAuth(app);
} catch (e) {
    console.error("Firebase initialization failed:", e);
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