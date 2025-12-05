import React, { useState, useEffect } from 'react';
import { View } from './types';
import { MessageSquare, Eye, Mic, Video as VideoIcon, LayoutGrid, LogOut, Home } from 'lucide-react';
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

    const isDevEnv = 
        !hostname || 
        hostname === 'localhost' || 
        hostname === '127.0.0.1' ||
        hostname.includes('idx.google') ||
        hostname.includes('-idx-') || 
        hostname.includes('cloudshell') ||
        hostname.includes('googleusercontent.com') || 
        hostname.includes('applicationpub.cloud.google.com') ||
        hostname.endsWith('.goog') || 
        port === '8080';

    if (isDevEnv) {
        setUser({
            uid: 'dev-user',
            email: 'developer@preview.env',
            displayName: 'Developer Mode',
            photoURL: null
        });
        setIsDevBypass(true);
        setLoading(false);
    } else {
        const unsubscribe = subscribeToAuthChanges((u) => {
            setUser(u);
            setLoading(false);
        });

        const safetyTimeout = setTimeout(() => {
            setLoading((currentLoading) => {
                if (currentLoading) {
                    return false;
                }
                return currentLoading;
            });
        }, 1500);

        return () => {
            unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }
  }, []);

  if (loading) {
    return (
        <div className="h-[100dvh] w-screen bg-slate-950 flex items-center justify-center">
             <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const NavItem = ({ view, icon: Icon, label, mobile = false }: { view: View; icon: any; label: string, mobile?: boolean }) => (
    <button
      onClick={() => setActiveView(view)}
      className={mobile 
        ? `flex flex-col items-center justify-center gap-0.5 p-1 rounded-xl transition-all w-full active:scale-95 ${activeView === view ? 'text-blue-500' : 'text-slate-500'}`
        : `flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200 group ${activeView === view ? 'bg-slate-800 text-white shadow-lg border border-slate-700/50' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`
      }
    >
      <div className={mobile ? '' : `p-2 rounded-lg ${activeView === view ? 'bg-blue-600' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
        <Icon size={mobile ? 18 : 20} strokeWidth={mobile && activeView === view ? 2.5 : 2} />
      </div>
      <span className={mobile ? "text-[9px] font-medium tracking-tight" : "font-medium"}>{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-slate-950 text-slate-200 overflow-hidden">
      
      {/* MOBILE HEADER - FIXED TOP */}
      {/* Height is fixed h-12 (3rem) plus the safe area top padding */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-50 pt-safe transition-all duration-200">
          <div className="h-12 flex items-center justify-between px-4">
              <div className="flex items-center gap-2" onClick={() => setActiveView(View.HOME)}>
                <div className="w-6 h-6 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-md flex items-center justify-center shadow-lg shadow-blue-900/20">
                    <LayoutGrid size={14} className="text-white" />
                </div>
                <span className="font-bold text-white tracking-tight text-sm">Gemini Explorer</span>
              </div>
              <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 overflow-hidden border border-slate-700">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            user.displayName?.[0]?.toUpperCase() || 'D'
                        )}
                  </div>
                  {!isDevBypass && (
                      <button onClick={() => signOut()} className="text-slate-400 hover:text-white active:scale-90 transition-transform">
                          <LogOut size={16} />
                      </button>
                  )}
              </div>
          </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex w-64 flex-col border-r border-slate-800 bg-slate-950 p-4 shrink-0 z-40">
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

        <nav className="space-y-1 flex-1">
            <NavItem view={View.HOME} icon={Home} label="Home" />
            <NavItem view={View.CHAT} icon={MessageSquare} label="Chat & Think" />
            <NavItem view={View.VISION} icon={Eye} label="Vision Studio" />
            <NavItem view={View.SPEECH} icon={Mic} label="Speech Lab" />
            <NavItem view={View.VIDEO} icon={VideoIcon} label="Veo Video" />
        </nav>

        <div className="border-t border-slate-800 pt-4 mt-4 space-y-4">
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

      {/* MAIN CONTENT AREA */}
      <div 
        className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950"
      >
         {/* Key prop forces remount on tab switch to reset scroll */}
         {activeView === View.HOME && <HomeView key="home" onNavigate={setActiveView} />}
         {activeView === View.CHAT && <ChatView key="chat" />}
         {activeView === View.VISION && <VisionView key="vision" />}
         {activeView === View.SPEECH && <SpeechView key="speech" />}
         {activeView === View.VIDEO && <VideoView key="video" />}
      </div>

      {/* MOBILE BOTTOM NAV - FIXED BOTTOM */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 flex justify-between px-2 pb-safe pt-1 z-50 shadow-2xl h-[calc(3.5rem+env(safe-area-inset-bottom))]">
           <NavItem view={View.HOME} icon={Home} label="Home" mobile />
           <NavItem view={View.CHAT} icon={MessageSquare} label="Chat" mobile />
           <NavItem view={View.VISION} icon={Eye} label="Vision" mobile />
           <NavItem view={View.SPEECH} icon={Mic} label="Speech" mobile />
           <NavItem view={View.VIDEO} icon={VideoIcon} label="Veo" mobile />
      </div>

    </div>
  );
};

export default App;