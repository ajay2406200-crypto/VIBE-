
import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Heart, MoreHorizontal } from 'lucide-react';
import { Song, Page } from '../types';

interface PlayerProps {
  song: Song | null;
  isPlaying: boolean;
  progress: number;
  onTogglePlay: (e: React.MouseEvent) => void;
  onNavigate: (page: Page) => void;
}

const Player: React.FC<PlayerProps> = ({ song, isPlaying, progress, onTogglePlay, onNavigate }) => {
  if (!song) return null;

  return (
    <div 
      className="glass-morphism h-16 px-4 flex items-center justify-between border-t border-white/10 shadow-[0_-8px_20px_rgba(0,0,0,0.6)] cursor-pointer"
      onClick={() => onNavigate(Page.Player)}
    >
      {/* Song Info */}
      <div className="flex items-center gap-3 w-1/3 min-w-0">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
          <img src={song.cover} alt={song.title} className="w-full h-full object-cover" />
          {song.isUnderground && (
            <div className="absolute top-0 right-0 bg-red-600 text-[7px] px-1 font-black">RAW</div>
          )}
        </div>
        <div className="overflow-hidden">
          <h4 className="text-[11px] font-black truncate text-white uppercase tracking-tight leading-none mb-0.5">{song.title}</h4>
          <p className="text-[9px] text-slate-400 truncate leading-none">{song.artist}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-1 w-1/3">
        <div className="flex items-center gap-6">
          <button className="text-slate-400 hover:text-white transition-colors" onClick={(e) => e.stopPropagation()}><SkipBack size={16} /></button>
          <button 
            onClick={onTogglePlay}
            className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-white shadow-lg"
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </button>
          <button className="text-slate-400 hover:text-white transition-colors" onClick={(e) => e.stopPropagation()}><SkipForward size={16} /></button>
        </div>
        <div className="w-full max-w-[100px] md:max-w-[180px] h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_5px_rgba(59,130,246,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end w-1/3">
        <button className="text-slate-400 hover:text-red-500 transition-colors" onClick={(e) => e.stopPropagation()}><Heart size={18} /></button>
        <button className="text-slate-400 hover:text-white" onClick={(e) => e.stopPropagation()}><MoreHorizontal size={18} /></button>
      </div>
    </div>
  );
};

export default Player;
