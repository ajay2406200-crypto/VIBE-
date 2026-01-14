
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "h-8" }) => {
  return (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      {/* Logo Icon */}
      <div className="relative w-8 h-8 flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg transform rotate-6 opacity-70 group-hover:rotate-12 transition-transform duration-300"></div>
        <div className="absolute inset-0 bg-[#0f172a] border border-white/10 rounded-lg flex items-center justify-center z-10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6l8 12 8-12" />
            </svg>
        </div>
      </div>
      
      {/* Logo Text */}
      <span className="text-xl font-black tracking-[0.2em] text-white group-hover:text-blue-500 transition-colors duration-300">
        VIBE
      </span>
    </div>
  );
};

export default Logo;
