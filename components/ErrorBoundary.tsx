import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Vibe System Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="relative mb-8 group">
             <div className="absolute inset-0 bg-red-600 blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
             <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-red-500 relative z-10 shadow-2xl">
               <ShieldAlert size={40} />
             </div>
          </div>
          
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2 leading-none">
            System <span className="text-red-500">Overload</span>
          </h1>
          <p className="text-slate-400 max-w-md mb-10 text-sm font-medium leading-relaxed">
            The vibe frequency was too high for your browser to handle safely. We caught the crash to protect your experience.
          </p>
          
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-full font-black uppercase tracking-widest hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/20"
          >
            <RefreshCw size={18} className="animate-spin-slow" /> Reboot System
          </button>
          
          <p className="mt-8 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            Error Code: VIBE_CRASH_PROTECTION_V1
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;