
import React, { useState } from 'react';
import { Lock, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { signIn, signUp, signInWithGoogle } from '../services/authService';
import { Button } from '../components/Button';
import { firebaseConfig } from '../config';

export const LoginView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{message: string, code?: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
        if (isLogin) {
            await signIn(email, password);
        } else {
            await signUp(email, password);
        }
    } catch (err: any) {
        let msg = "An error occurred.";
        if (err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
        if (err.code === 'auth/email-already-in-use') msg = "Email already in use.";
        if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
        setError({ message: msg, code: err.code });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
      setError(null);
      setIsLoading(true);
      try {
          await signInWithGoogle();
      } catch (err: any) {
          console.error(err);
          let msg = "Google Sign-In failed.";
          
          // Specific help for common deployment errors
          if (err.code === 'auth/unauthorized-domain') {
              msg = `Domain unauthorized: ${window.location.hostname}`;
          } else if (err.code === 'auth/popup-closed-by-user') {
              msg = "Sign-in cancelled.";
          }
          
          setError({ message: msg, code: err.code });
      } finally {
          setIsLoading(false);
      }
  };

  if (!isConfigured) {
      return (
          <div className="flex h-screen items-center justify-center bg-slate-950 text-white p-4">
              <div className="max-w-md bg-slate-900 border border-red-500/50 rounded-xl p-8 text-center space-y-4">
                  <AlertCircle size={48} className="text-red-500 mx-auto" />
                  <h2 className="text-2xl font-bold">Configuration Required</h2>
                  <p className="text-slate-400">
                      You need to configure Firebase Authentication to use this app.
                  </p>
                  <p className="text-sm bg-slate-950 p-4 rounded text-left font-mono text-slate-300">
                      1. Open `config.ts`<br/>
                      2. Replace the placeholder `firebaseConfig`<br/>
                      3. Redeploy
                  </p>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-900/40">
                <Lock className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
                {isLogin ? 'Welcome Back' : 'Get Started'}
            </h1>
            <p className="text-slate-400">
                Sign in to access the Gemini Explorer
            </p>
        </div>

        <div className="space-y-4">
            {error && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-200 text-sm p-4 rounded-lg">
                    <div className="flex items-center gap-2 font-bold mb-1">
                         <AlertCircle size={16} /> Error:
                    </div>
                    <div>{error.message}</div>
                    {error.code && (
                        <div className="mt-2 text-xs font-mono bg-black/30 p-2 rounded">
                            Code: {error.code}
                            {error.code === 'auth/unauthorized-domain' && (
                                <div className="mt-1 text-yellow-300">
                                    Action: Add <strong>{window.location.hostname}</strong> to Firebase Console &gt; Auth &gt; Settings &gt; Authorized Domains.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Google Button */}
            <button 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                )}
                Sign in with Google
            </button>
            
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">Or continue with email</span>
                <div className="flex-grow border-t border-slate-700"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Email Address</label>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="you@company.com"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Password</label>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="••••••••"
                    />
                </div>

                <Button 
                    type="submit" 
                    isLoading={isLoading} 
                    className="w-full py-3 text-lg mt-4 bg-slate-800 hover:bg-slate-700 border border-slate-700"
                >
                    {isLogin ? (
                        <><LogIn className="mr-2" size={20} /> Sign In with Email</>
                    ) : (
                        <><UserPlus className="mr-2" size={20} /> Create Account</>
                    )}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <button 
                    onClick={() => { setIsLogin(!isLogin); setError(null); }}
                    className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
            </div>
        </div>

        {/* Debug Info Footer */}
        <div className="absolute bottom-2 left-0 right-0 text-center">
             <span className="text-[10px] text-slate-700 font-mono">
                Env: {window.location.hostname} ({window.location.port || '80/443'})
             </span>
        </div>
      </div>
    </div>
  );
};
