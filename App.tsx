
import React, { useState, useEffect } from 'react';
import { View } from './types';
import { MessageSquare, Eye, Mic, Video as VideoIcon, LayoutGrid, LogOut } from 'lucide-react';
import { ChatView } from './views/ChatView';
import { VisionView } from './views/VisionView';
import { SpeechView } from './views/SpeechView';
import { VideoView } from './views/VideoView';
import { HomeView } from './views/HomeView';
import { LoginView } from './views/LoginView';
import { subscribeToAuthChanges, signOut } from './services/authService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.HOME);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDevBypass, setIsDevBypass] = useState(false);

  useEffect(() => {
    // Environment Detection Logic
    const hostname = window.location.hostname;
    const port = window.location.port;

    console.log("Current Hostname:", hostname, "Port:", port);

    // Broader detection for AI Studio / IDX / Cloud Shell / Localhost
    // !hostname checks for empty string, which handles the specific AI Studio preview case
    const isDevEnv = 
        !hostname || 
        hostname === 'localhost' || 
        hostname === '127.0.0.1' ||
        hostname.includes('idx.google') ||
        hostname.includes('-idx-') || // Common in IDX previews
        hostname.includes('cloudshell') ||
        hostname.includes('googleusercontent.com') || 
        hostname.includes('applicationpub.cloud.google.com') ||
        hostname.endsWith('.goog') || // Internal Google domains
        port === '8080'; // Explicit 8080 usually implies a container preview, not prod

    if (isDevEnv) {
        console.log("Development Environment Detected: Bypassing Authentication.");
        setUser({
            uid: 'dev-user',
            email: 'developer@preview.env',
            displayName: 'Developer Mode',
            photoURL: null
        });
        setIsDevBypass(true);
        setLoading(false);
    } else {
        // Production: Enforce Firebase Auth
        const unsubscribe = subscribeToAuthChanges((u) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsubscribe();
    }
  }, []);

  // Loading Screen
  if (loading) {
    return (
        <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
             <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  // Auth Gate: Not Logged In
  if (!user) {
    return <LoginView />;
  }

  // Main App (Authorized)
  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 group ${
        activeView === view 
          ? 'bg-slate-800 text-white shadow-lg border border-slate-700/50' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
      }`}
    >
      <div className={`p-2 rounded-lg ${activeView === view ? 'bg-blue-600' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
        <Icon size={20} />
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <div className="w-64 flex flex-col border-r border-slate-800 bg-slate-950 p-4">
        <button 
          onClick={() => setActiveView(View.HOME)}
          className="flex items-center gap-3 px-2 mb-8 mt-2 group hover:opacity-80 transition-opacity text-left"
        >
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform">
                <LayoutGrid size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Gemini Explorer</h1>
              <p className="text-[10px] text-slate-500 font-medium">CAPABILITIES DEMO</p>
            </div>
        </button>

        <nav className="space-y-2 flex-1">
            <NavItem view={View.CHAT} icon={MessageSquare} label="Chat & Think" />
            <NavItem view={View.VISION} icon={Eye} label="Vision Studio" />
            <NavItem view={View.SPEECH} icon={Mic} label="Speech Lab" />
            <NavItem view={View.VIDEO} icon={VideoIcon} label="Veo Video" />
        </nav>

        <div className="border-t border-slate-800 pt-4 mt-4 space-y-4">
             {isDevBypass && (
                 <div className="px-2 py-1 bg-yellow-900/20 border border-yellow-700/50 rounded text-yellow-500 text-xs text-center font-mono mb-2">
                     PREVIEW MODE ENABLED
                 </div>
             )}
             <div className="flex items-center gap-3 px-2">
                 <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 overflow-hidden">
                     {user.photoURL ? (
                         <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                     ) : (
                         user.displayName?.[0]?.toUpperCase() || 'D'
                     )}
                 </div>
                 <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium text-white truncate">{user.displayName || user.email}</p>
                 </div>
             </div>
             
             {!isDevBypass && (
                 <button 
                    onClick={() => signOut()}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors text-sm"
                 >
                     <LogOut size={16} /> Sign Out
                 </button>
             )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-hidden relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950">
        {activeView === View.HOME && <HomeView onNavigate={setActiveView} />}
        {activeView === View.CHAT && <ChatView />}
        {activeView === View.VISION && <VisionView />}
        {activeView === View.SPEECH && <SpeechView />}
        {activeView === View.VIDEO && <VideoView />}
      </div>
    </div>
  );
};

export default App;
