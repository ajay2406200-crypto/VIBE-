
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Home as HomeIcon, 
  Search, 
  Library, 
  PlusCircle, 
  Crown, 
  Bell, 
  Heart, 
  TrendingUp, 
  ArrowLeft, 
  Play, 
  MoreHorizontal, 
  SkipBack, 
  Pause, 
  SkipForward, 
  CheckCircle2, 
  Music, 
  Disc, 
  History, 
  Clock, 
  CheckCircle, 
  Coins, 
  X, 
  Calendar, 
  BookOpen, 
  PenLine, 
  Quote,
  Hash,
  Settings,
  LogOut,
  BarChart3,
  User as UserIcon,
  Globe,
  Radio,
  Shuffle,
  Save,
  ShieldCheck,
  HeartPulse,
  Star,
  Users,
  MapPin,
  Shield,
  Upload,
  Mic,
  Tag,
  ListMusic,
  Activity,
  QrCode,
  Share2,
  MessageCircle,
  ArrowRight,
  Info,
  Youtube,
  Zap,
  CreditCard,
  Smartphone,
  Download,
  Menu
} from 'lucide-react';
import Logo from './components/Logo';
import Player from './components/Player';
import { Page, Song, MoodType, User } from './types';
import { MOCK_SONGS, MOODS, REACTIONS, GENRES, LANGUAGES, COUNTRIES, INDIAN_STATES } from './constants';
import { getMoodQuote } from './services/geminiService';

// --- GLOBAL INSTALL PROMPT CAPTURE ---
// We capture this outside the component to ensure we never miss the event.
let globalDeferredPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    globalDeferredPrompt = e;
    console.log("Global Install Prompt Captured!");
  });
}

const PRESET_YEARS = ['All Years', '2024', '2023', '2022', 'Retro'];

// Updated to Real Artist for Authenticity
const ARTIST_OF_THE_WEEK = {
  name: 'The Weeknd',
  bio: 'Abel Makkonen Tesfaye, known as The Weeknd, is defining a new era of pop with his dark, lyricism and retro-futuristic production.',
  genre: 'R&B / Pop',
  followers: '78.5M',
  cover: 'https://upload.wikimedia.org/wikipedia/en/3/39/The_Weeknd_-_Starboy.png',
  featuredTrackId: '1' // Links to Starboy in MOCK_SONGS
};

const MOCK_COMMENTS = [
  { id: 1, user: 'NeonKid', text: 'This bass hits different at 3 AM.', time: '2m' },
  { id: 2, user: 'VibeSeeker', text: 'Raw emotions. Exactly what I needed.', time: '15m' },
  { id: 3, user: 'IndieSoul', text: 'Does anyone know the sample used here?', time: '1h' },
];

const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Vibe Guest',
    price: 'Free',
    period: 'Forever',
    color: 'bg-slate-800',
    features: ['Ad-free Music Streaming', 'Standard Audio Quality', 'Online Listening', 'Community Access'],
    buttonText: 'Current Plan',
    active: true
  },
  {
    id: 'care',
    name: 'Vibe Care',
    price: '₹49',
    period: '/ month',
    color: 'bg-pink-600',
    popular: true,
    features: ['❤️ ₹10 Donated to Cancer Patients', 'High Fidelity Audio (Lossless)', 'Offline Downloads', 'Supporter Badge', 'Priority Artist Access'],
    buttonText: 'Subscribe & Donate',
    active: false
  }
];

// Fallback Image for safety
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";

const App: React.FC = () => {
  // Auth State
  const [hasOnboarded, setHasOnboarded] = useState(false);
  
  const [activePage, setActivePage] = useState<Page>(Page.Home);
  const [currentSong, setCurrentSong] = useState<Song | null>(MOCK_SONGS[0]);
  
  // Search & Filter States (Multi-select)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoods, setSelectedMoods] = useState<MoodType[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  
  // Custom states
  const [customYear, setCustomYear] = useState<string>('');
  const [showCustomYear, setShowCustomYear] = useState(false);
  const [customGenre, setCustomGenre] = useState<string>('');
  const [showCustomGenre, setShowCustomGenre] = useState(false);
  const [customLanguage, setCustomLanguage] = useState<string>('');
  const [showCustomLanguage, setShowCustomLanguage] = useState(false);
  const [customCountry, setCustomCountry] = useState<string>('');
  const [showCustomCountry, setShowCustomCountry] = useState(false);
  const [customState, setCustomState] = useState<string>('');
  const [showCustomState, setShowCustomState] = useState(false);

  const [moodQuote, setMoodQuote] = useState<string>("Shor ke liye nahi, sukoon ke liye.");
  const [showTipModal, setShowTipModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>('20');
  const [songMemories, setSongMemories] = useState<Record<string, string>>({
    '4': 'This track reminds me of that rainy Tuesday in Mumbai. Peace in chaos.'
  });
  const [currentMemory, setCurrentMemory] = useState("");
  const [user] = useState<User>({
    id: 'user1',
    name: 'Rohan',
    isPremium: false,
    avatar: 'https://i.pravatar.cc/150?u=vibe-rohan',
    role: 'Listener',
    isAdmin: true 
  });

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // PWA Install State
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if already running in standalone mode (installed)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isInStandaloneMode);

    // Listen for future events (Just to ensure we capture the prompt if it fires late)
    const handler = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      console.log("Install prompt captured (in component)");
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (globalDeferredPrompt) {
      // 1. Try Native Installation
      globalDeferredPrompt.prompt();
      const { outcome } = await globalDeferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      if (outcome === 'accepted') {
        globalDeferredPrompt = null;
      }
    } else {
      // 2. Fallback: If prompt is not ready (e.g., WebView or criteria not met)
      // We removed the complex modal. Just a simple alert if needed, 
      // but the button remains visible regardless.
      alert("Installation is not ready yet. Please open in Chrome or Edge to install.");
    }
  };
  
  // Refs for Players
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const youtubePlayerRef = useRef<HTMLIFrameElement | null>(null);

  const mockLyrics = [
    "Shadows dancing on the pavement,",
    "Lost in echoes of a city dream.",
    "Whispers of a quiet rebellion,",
    "Nothing is exactly as it seems.",
    "Neon bleeding through the rain,",
    "Raw emotions, heavy heart."
  ];

  // Optimization: Image Error Handler
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = FALLBACK_IMAGE;
  }, []);

  // HTML5 Audio Effects
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
       const dur = audio.duration || 0;
       const curr = audio.currentTime || 0;
       setCurrentTime(curr);
       setDuration(dur);
       setProgress(dur > 0 ? (curr / dur) * 100 : 0);
    };

    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    return () => {
       audio.removeEventListener('timeupdate', updateProgress);
       audio.removeEventListener('ended', handleEnded);
    }
  }, []);

  // Combined Player Control Logic (HTML5 + YouTube)
  useEffect(() => {
    const audio = audioRef.current;
    
    // 1. Handle HTML5 Audio
    if (currentSong?.audioUrl && audio) {
        if (audio.src !== currentSong.audioUrl) {
            audio.src = currentSong.audioUrl;
        }

        if (isPlaying) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Auto-play policy error handling
                    if (error.name !== 'AbortError') {
                        console.warn("Playback prevented (Safety Check):", error);
                        setIsPlaying(false);
                    }
                });
            }
        } else {
            audio.pause();
        }
    } else if (audio) {
        audio.pause();
    }

    // 2. Handle YouTube Phantom Player (via postMessage)
    if (currentSong?.youtubeId && youtubePlayerRef.current && youtubePlayerRef.current.contentWindow) {
        const command = isPlaying ? 'playVideo' : 'pauseVideo';
        try {
            youtubePlayerRef.current.contentWindow.postMessage(
                JSON.stringify({ event: 'command', func: command, args: '' }), 
                '*'
            );
        } catch (e) {
            console.warn("YouTube control safety catch", e);
        }
    }

  }, [currentSong, isPlaying]);

  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlaying(prev => !prev);
  }, []);

  const playSong = useCallback((song: Song) => {
    setCurrentSong(prev => {
        if (prev?.id === song.id) {
            setIsPlaying(p => !p);
            return prev;
        }
        setIsPlaying(true);
        return song;
    });
  }, []);

  // ---

  useEffect(() => {
    if (currentSong) {
      setCurrentMemory(songMemories[currentSong.id] || "");
    }
  }, [currentSong]);

  const toggleMood = async (mood: MoodType) => {
    if (selectedMoods.includes(mood)) {
      setSelectedMoods(selectedMoods.filter(m => m !== mood));
    } else {
      setSelectedMoods([...selectedMoods, mood]);
      const quote = await getMoodQuote(mood);
      setMoodQuote(quote);
    }
  };

  const toggleFilter = (item: string, list: string[], setList: (items: string[]) => void) => {
    if (item.startsWith('All ')) {
      setList([]);
      return;
    }
    
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleTip = () => {
    alert(`Thank you for tipping ₹${tipAmount} to ${currentSong?.artist}!`);
    setShowTipModal(false);
  };

  const saveMemory = () => {
    if (currentSong) {
      setSongMemories(prev => ({ ...prev, [currentSong.id]: currentMemory }));
      alert("Moment saved to your diary.");
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedMoods([]);
    setSelectedYears([]);
    setSelectedGenres([]);
    setSelectedLanguages([]);
    setSelectedCountries([]);
    setSelectedStates([]);
    setShowCustomYear(false);
    setShowCustomGenre(false);
    setShowCustomLanguage(false);
    setShowCustomCountry(false);
    setShowCustomState(false);
    setCustomYear('');
    setCustomGenre('');
    setCustomLanguage('');
    setCustomCountry('');
    setCustomState('');
  };

  // SAFETY: Memoize filtering to prevent UI freeze on inputs
  const filteredSongs = useMemo(() => {
     return MOCK_SONGS.filter(song => {
      // 1. Text Search Filter
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        song.title.toLowerCase().includes(query) || 
        song.artist.toLowerCase().includes(query) ||
        song.genre.toLowerCase().includes(query) ||
        song.mood.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // 2. Multi-select Filters (OR logic within category)
      const moodMatch = selectedMoods.length === 0 || selectedMoods.includes(song.mood);
      const genreMatch = selectedGenres.length === 0 || selectedGenres.some(g => g.toLowerCase() === song.genre.toLowerCase());
      const langMatch = selectedLanguages.length === 0 || selectedLanguages.some(l => l.toLowerCase() === song.language.toLowerCase());
      const countryMatch = selectedCountries.length === 0 || selectedCountries.some(c => c.toLowerCase() === song.country.toLowerCase());
      const stateMatch = selectedStates.length === 0 || (song.state && selectedStates.some(s => s.toLowerCase() === song.state!.toLowerCase()));
      
      // 3. Year Filter (Special logic for Retro)
      const yearMatch = selectedYears.length === 0 || selectedYears.some(y => {
        if (y === 'Retro') return song.year < 2022;
        return song.year.toString() === y;
      });
      
      return moodMatch && yearMatch && genreMatch && langMatch && countryMatch && stateMatch;
    });
  }, [searchQuery, selectedMoods, selectedGenres, selectedLanguages, selectedCountries, selectedStates, selectedYears]);

  // Derived state from memoized result
  const filteredUndergroundSongs = useMemo(() => filteredSongs.filter(s => s.isUnderground), [filteredSongs]);
  const filteredMainstreamSongs = useMemo(() => filteredSongs.filter(s => !s.isUnderground), [filteredSongs]);

  const playlistTitle = selectedMoods.length > 0 ? `${selectedMoods.join(' + ')} Mix` : "Your Personalized Mix";
  const isFilterActive = searchQuery || selectedMoods.length > 0 || selectedYears.length > 0 || selectedGenres.length > 0 || selectedLanguages.length > 0 || selectedCountries.length > 0 || selectedStates.length > 0;

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Memoize sub-components for lists
  const CustomFilterRow = useCallback(({ 
    title, 
    icon: Icon, 
    items, 
    activeItems, 
    onToggle, 
    color,
    showCustom,
    setShowCustom,
    customValue,
    setCustomValue,
    placeholder
  }: any) => (
    <section>
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-white">
        <Icon className={color} size={18} /> {title}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {items.map((item: string) => {
          // "All X" logic: Active if list is empty AND item starts with All, OR if item is in list
          const isAll = item.startsWith('All ');
          const isActive = activeItems.includes(item) || (activeItems.length === 0 && isAll);
          
          return (
            <button
              key={item}
              onClick={() => { onToggle(item); setShowCustom(false); }}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                isActive
                  ? 'bg-white text-black border-white shadow-lg shadow-white/10' 
                  : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/30 hover:text-white'
              }`}
            >
              {item}
            </button>
          )
        })}
        
        <div className="flex-shrink-0 flex items-center gap-2">
          {!showCustom ? (
            <button
              onClick={() => setShowCustom(true)}
              className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                showCustom || (activeItems.length > 0 && !items.some((i: string) => activeItems.includes(i)))
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-blue-500/30'
              }`}
            >
              <Hash size={12} /> Custom
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-white/5 border border-blue-500/50 rounded-full px-3 py-1 animate-in slide-in-from-right-2 duration-300">
              <input 
                type="text" 
                placeholder={placeholder}
                className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-white w-24 px-1"
                autoFocus
                value={customValue}
                onChange={(e) => {
                  setCustomValue(e.target.value);
                  if (e.target.value.length > 2) onToggle(e.target.value);
                }}
              />
              <button onClick={() => setShowCustom(false)} className="text-slate-500 hover:text-white"><X size={14}/></button>
            </div>
          )}
        </div>
      </div>
    </section>
  ), []);

  const renderContent = () => {
    switch (activePage) {
      case Page.Subscription:
        return (
          <div className="space-y-10 pb-40 pt-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
               <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Support & Vibe</h2>
               <p className="text-slate-400 font-medium">Join our mission to support music and health.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-12 max-w-4xl mx-auto">
               {SUBSCRIPTION_PLANS.map((plan) => (
                 <div key={plan.id} className={`relative p-8 rounded-[40px] border ${plan.popular ? 'border-pink-500/50 bg-slate-900/80 scale-105 z-10 shadow-2xl shadow-pink-500/20' : 'border-white/5 bg-white/5'} flex flex-col h-full transition-transform`}>
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-pink-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-2">
                        <HeartPulse size={12} fill="currentColor" /> Care Plan
                      </div>
                    )}
                    <div className="mb-8">
                       <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">{plan.name}</h3>
                       <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black text-white tracking-tighter">{plan.price}</span>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{plan.period}</span>
                       </div>
                    </div>
                    
                    <ul className="space-y-4 mb-8 flex-1">
                       {plan.features.map((feature, i) => (
                         <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-300">
                           <CheckCircle size={16} className={plan.id === 'free' ? 'text-slate-600' : 'text-pink-500'} />
                           <span className="leading-tight">{feature}</span>
                         </li>
                       ))}
                    </ul>

                    <button 
                      className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                        plan.active 
                          ? 'bg-white/10 text-slate-500 cursor-default' 
                          : `${plan.color} text-white hover:scale-105 shadow-xl`
                      }`}
                    >
                      {plan.buttonText}
                    </button>
                 </div>
               ))}
            </div>

            <div className="bg-slate-900/60 p-8 rounded-[40px] border border-white/5 mt-12 flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-pink-500/10 rounded-full text-pink-500">
                     <HeartPulse size={32} />
                  </div>
                  <div>
                     <h4 className="font-black text-white text-lg uppercase tracking-tight">Music That Cares</h4>
                     <p className="text-xs text-slate-400 font-bold max-w-md mt-1">
                        With every ₹49 subscription, ₹10 is directly donated to support cancer treatment for those in need.
                     </p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <CreditCard className="text-slate-600" />
                  <Smartphone className="text-slate-600" />
                  <Globe className="text-slate-600" />
               </div>
            </div>
          </div>
        );

      case Page.Profile:
        return (
          <div className="space-y-8 pb-40 pt-24 px-4 md:px-8 max-w-5xl mx-auto w-full">
             {/* Header Section */}
             <div className="relative">
                <div className="h-48 rounded-[40px] bg-gradient-to-r from-blue-900 via-slate-900 to-red-900 overflow-hidden border border-white/5">
                   <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>
                <div className="absolute -bottom-12 left-8 md:left-12 flex items-end gap-6">
                   <div className="w-28 h-28 rounded-full border-4 border-[#020617] relative bg-[#020617]">
                      <img 
                        src={user.avatar} 
                        onError={handleImageError}
                        className="w-full h-full rounded-full object-cover" 
                      />
                      <button className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white border-2 border-[#020617] hover:scale-110 transition-transform">
                         <PenLine size={12} />
                      </button>
                   </div>
                   <div className="mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{user.name}</h2>
                        {user.isPremium && <Crown size={20} className="text-yellow-500 fill-yellow-500" />}
                      </div>
                      <p className="text-xs font-bold text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full inline-block border border-blue-500/20">
                         Night Crawler • Joined 2023
                      </p>
                   </div>
                </div>
             </div>

             <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left Column: Bio & Identity */}
                <div className="space-y-6">
                   <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/5">
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <UserIcon size={14} /> Bio
                      </h3>
                      <p className="text-sm text-slate-300 font-medium leading-relaxed italic">
                         "Chasing echoes in the concrete jungle. Bass, synths, and midnight drives."
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                         {['Synthwave', 'Phonk', 'Indie'].map(tag => (
                            <span key={tag} className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-wide border border-white/5">{tag}</span>
                         ))}
                      </div>
                   </div>

                   <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/5">
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <Zap size={14} /> Subscription
                      </h3>
                      <div className="flex items-center justify-between mb-4">
                         <span className="text-white font-black uppercase text-sm">{user.isPremium ? 'Vibe Care+' : 'Vibe Guest'}</span>
                         <span className={`w-2 h-2 rounded-full ${user.isPremium ? 'bg-pink-500' : 'bg-slate-500'}`}></span>
                      </div>
                      <button 
                        onClick={() => setActivePage(Page.Subscription)}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors"
                      >
                         Manage Plan
                      </button>
                   </div>
                </div>

                {/* Right Column: Stats & Activities */}
                <div className="md:col-span-2 space-y-6">
                   {/* Stats Grid */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Hours Listened', value: '142', icon: Clock, color: 'text-blue-500' },
                        { label: 'Underground Score', value: '89%', icon: TrendingUp, color: 'text-red-500' },
                        { label: 'Artists Backed', value: '12', icon: Heart, color: 'text-pink-500' },
                        { label: 'Moments Saved', value: '34', icon: BookOpen, color: 'text-purple-500' },
                      ].map((stat, i) => (
                         <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                            <stat.icon className={`${stat.color} mb-2`} size={20} />
                            <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                         </div>
                      ))}
                   </div>

                   {/* Recent Activity */}
                   <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/5">
                      <div className="flex items-center justify-between mb-6">
                         <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <History size={14} /> Recent Vibes
                         </h3>
                         <button className="text-[10px] text-blue-500 font-bold uppercase hover:underline">View All</button>
                      </div>
                      <div className="space-y-4">
                         {MOCK_SONGS.slice(0, 3).map((song, i) => (
                            <div key={i} className="flex items-center gap-4 group cursor-pointer" onClick={() => playSong(song)}>
                               <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800">
                                  <img 
                                    src={song.cover} 
                                    onError={handleImageError}
                                    className="w-full h-full object-cover" 
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                     <Play size={16} className="text-white fill-white" />
                                  </div>
                               </div>
                               <div className="flex-1">
                                  <h4 className="text-sm font-bold text-white group-hover:text-blue-500 transition-colors">{song.title}</h4>
                                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Listened 2h ago</p>
                               </div>
                               <div className="text-xs font-bold text-slate-600">{song.duration}s</div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );

      case Page.Notifications:
        return (
          <div className="space-y-6 pb-40 pt-24 px-4 md:px-8 max-w-4xl mx-auto w-full">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <Bell className="text-blue-500" /> Notifications
            </h2>
            <div className="space-y-3">
              {[
                { title: 'New Release: Vanya Void', msg: 'Your followed artist Vanya Void just dropped "Echoes".', time: '2m ago', type: 'Release' },
                { title: 'Moment Liked', msg: 'Someone liked your memory on "Neon Shadows".', time: '1h ago', type: 'Social' },
                { title: 'Weekly Mix Ready', msg: 'Your "Raw" mood playlist is ready.', time: '5h ago', type: 'System' },
              ].map((notif, i) => (
                <div key={i} className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 flex gap-4 hover:border-blue-500/30 transition-all">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 shrink-0">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{notif.title}</h4>
                    <p className="text-xs text-slate-400">{notif.msg}</p>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2">{notif.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case Page.Library:
        return (
          <div className="space-y-8 pb-40 pt-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                 <Library size={32} className="text-white" />
               </div>
               <div>
                 <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Your Library</h2>
                 <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Saved Tracks & Collections</p>
               </div>
             </div>

             <div className="flex gap-4 border-b border-white/10 pb-4">
               <button className="text-white font-black uppercase tracking-widest text-sm border-b-2 border-blue-500 pb-4 -mb-4.5">Liked Songs</button>
               <button className="text-slate-500 font-black uppercase tracking-widest text-sm hover:text-white transition-colors pb-4">Playlists</button>
               <button className="text-slate-500 font-black uppercase tracking-widest text-sm hover:text-white transition-colors pb-4">Moments</button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {MOCK_SONGS.slice(0, 3).map(song => (
                  <div key={song.id} onClick={() => {playSong(song); setActivePage(Page.Player)}} className="flex items-center gap-4 bg-slate-900/40 p-3 rounded-2xl border border-white/5 hover:bg-white/5 cursor-pointer group">
                    <img 
                      src={song.cover} 
                      onError={handleImageError}
                      className="w-16 h-16 rounded-xl object-cover shadow-lg bg-slate-800" 
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-white truncate">{song.title}</h4>
                      <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                    </div>
                    <button className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-blue-500"><Play size={20} fill="currentColor" /></button>
                  </div>
               ))}
             </div>
          </div>
        );

      case Page.Explore:
        return (
          <div className="space-y-10 pb-40 pt-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Explore VIBE</h2>
            
            <section>
              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-red-500"/> Trending Underground</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {MOCK_SONGS.filter(s => s.isUnderground).map(song => (
                  <div key={song.id} onClick={() => playSong(song)} className="relative aspect-video rounded-2xl overflow-hidden group cursor-pointer border border-white/5 bg-slate-900">
                    <img 
                      src={song.cover} 
                      onError={handleImageError}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                      <p className="text-white font-black uppercase text-sm">{song.title}</p>
                      <p className="text-slate-300 font-bold uppercase text-[10px] ml-2">{song.state || song.country}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2"><ListMusic size={20} className="text-blue-500"/> Browse by Genre</h3>
              <div className="flex flex-wrap gap-3">
                {GENRES.slice(1).map(g => (
                  <button key={g} onClick={() => { toggleFilter(g, selectedGenres, setSelectedGenres); setActivePage(Page.Home); }} className="px-6 py-3 bg-white/5 hover:bg-white text-slate-300 hover:text-black rounded-full font-black uppercase tracking-widest text-xs transition-all border border-white/10">
                    {g}
                  </button>
                ))}
              </div>
            </section>
          </div>
        );

      case Page.Upload:
        return (
          <div className="space-y-10 pb-40 pt-24 px-4 md:px-8 max-w-3xl mx-auto w-full">
             <div className="text-center space-y-2">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Upload Your Sound</h2>
                <p className="text-blue-500 text-sm font-black uppercase tracking-widest italic">“Find your listener – feel that from your music”</p>
             </div>

             <div className="bg-slate-900/60 p-8 rounded-[40px] border border-white/5 space-y-8">
                {/* Audio File */}
                <div className="border-2 border-dashed border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group">
                   <div className="w-16 h-16 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload size={32} />
                   </div>
                   <div className="text-center">
                      <p className="text-white font-bold text-sm">Drag and drop audio file</p>
                      <p className="text-slate-500 text-xs mt-1">MP3, WAV up to 50MB</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Track Title *</label>
                      <input type="text" placeholder="e.g. Midnight City" className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-blue-500 outline-none transition-all" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Cover Art</label>
                      <input type="file" className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-slate-400 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20" />
                   </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <select className="bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-slate-300 text-xs font-bold focus:border-blue-500 outline-none">
                       <option>Select Mood</option>
                       {MOODS.map(m => <option key={m}>{m}</option>)}
                    </select>
                    <select className="bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-slate-300 text-xs font-bold focus:border-blue-500 outline-none">
                       <option>Language</option>
                       {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                    </select>
                     <select className="bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-slate-300 text-xs font-bold focus:border-blue-500 outline-none">
                       <option>Year</option>
                       <option>2024</option>
                       <option>2023</option>
                    </select>
                    <select className="bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-slate-300 text-xs font-bold focus:border-blue-500 outline-none">
                       <option>State (Region)</option>
                       {INDIAN_STATES.slice(1).map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Target Listener</label>
                   <input type="text" placeholder="e.g. Late night drivers, heartbroken souls..." className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:border-blue-500 outline-none transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Song Type</label>
                      <div className="flex gap-2">
                         {['Official', 'Remix', 'Live'].map(t => (
                           <button key={t} className="flex-1 py-3 bg-white/5 hover:bg-blue-600 hover:text-white text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">{t}</button>
                         ))}
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-2">Voice Note</label>
                      <button className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-600/20 flex items-center justify-center gap-2 transition-all">
                         <Mic size={14} /> Record Intro
                      </button>
                   </div>
                </div>

                <button className="w-full py-5 bg-blue-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-600/20">
                   Publish Track
                </button>
             </div>
          </div>
        );

      case Page.Admin:
        return (
          <div className="space-y-10 pb-40 pt-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-600 rounded-xl shadow-lg shadow-red-600/20">
                <Shield size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Admin Dashboard</h2>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">System Overview & Controls</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { label: 'Total Users', value: '12,450', change: '+12%', color: 'bg-blue-600' },
                 { label: 'Active Streams', value: '1,892', change: '+24%', color: 'bg-green-600' },
                 { label: 'Total Revenue', value: '₹4.2L', change: '+8%', color: 'bg-yellow-600' },
                 { label: 'Pending Approvals', value: '14', change: '-2', color: 'bg-red-600' },
               ].map((stat, i) => (
                 <div key={i} className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 p-20 ${stat.color} blur-[80px] opacity-20`}></div>
                    <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">{stat.label}</h3>
                    <div className="flex items-end justify-between">
                      <span className="text-3xl font-black text-white tracking-tight">{stat.value}</span>
                      <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">{stat.change}</span>
                    </div>
                 </div>
               ))}
            </div>

            <div className="bg-slate-900/40 rounded-[40px] border border-white/5 p-8">
               <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                 <ShieldCheck className="text-blue-500" /> Pending Verification
               </h3>
               <div className="space-y-4">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex-wrap gap-4">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 font-black text-xs">U</div>
                          <div>
                             <p className="text-sm font-bold text-white">Artist Request #{240 + i}</p>
                             <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Applied 2h ago</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button className="px-4 py-2 bg-green-600/20 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-green-600 hover:text-white transition-colors">Approve</button>
                          <button className="px-4 py-2 bg-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-red-600 hover:text-white transition-colors">Reject</button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        );

      case Page.Home:
        return (
          <div className="space-y-12 pb-32 pt-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
            {/* Artist of the Week Spotlight */}
            <section className="relative h-[440px] rounded-[48px] overflow-hidden group shadow-2xl shadow-blue-500/10 border border-white/5 bg-slate-900">
               <img 
                 src={ARTIST_OF_THE_WEEK.cover} 
                 onError={handleImageError}
                 className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4000ms] group-hover:scale-110" 
                 alt={ARTIST_OF_THE_WEEK.name} 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
               <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent"></div>
               
               <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full max-w-2xl space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/30">
                    <Star size={12} fill="currentColor" /> Artist of the Week
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-6xl font-black text-white uppercase tracking-tighter leading-none">{ARTIST_OF_THE_WEEK.name}</h2>
                    <p className="text-blue-400 text-sm font-black uppercase tracking-widest">{ARTIST_OF_THE_WEEK.genre} • {ARTIST_OF_THE_WEEK.followers} Listeners</p>
                  </div>
                  <p className="text-slate-300 text-sm md:text-base font-medium max-w-md leading-relaxed opacity-90">
                    {ARTIST_OF_THE_WEEK.bio}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <button 
                      onClick={() => {
                        const song = MOCK_SONGS.find(s => s.id === ARTIST_OF_THE_WEEK.featuredTrackId);
                        if (song) { playSong(song); setActivePage(Page.Player); }
                      }}
                      className="px-10 py-4 bg-white text-black font-black text-sm rounded-full hover:bg-blue-600 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-2xl uppercase tracking-widest flex items-center gap-3"
                    >
                      <Play fill="currentColor" size={18} /> Listen Now
                    </button>
                    <button className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-3">
                      <Users size={16} /> Follow Artist
                    </button>
                  </div>
               </div>
            </section>

            {/* Mood Section */}
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                What's your <span className="text-blue-500 italic">Mood</span> today?
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {MOODS.map(mood => (
                  <button
                    key={mood}
                    onClick={() => toggleMood(mood)}
                    className={`flex-shrink-0 px-6 py-3 rounded-full text-sm font-bold border-2 transition-all ${
                      selectedMoods.includes(mood) 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                        : 'border-white/10 text-slate-400 hover:border-blue-500/50 hover:text-white'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 italic mt-1 animate-pulse tracking-wide">{moodQuote}</p>
            </section>

            {/* Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
               <CustomFilterRow 
                title="Vibe by State" 
                icon={MapPin} 
                items={INDIAN_STATES} 
                activeItems={selectedStates} 
                onToggle={(item: string) => toggleFilter(item, selectedStates, setSelectedStates)}
                color="text-orange-500"
                showCustom={showCustomState}
                setShowCustom={setShowCustomState}
                customValue={customState}
                setCustomValue={setCustomState}
                placeholder="STATE..."
               />
               <CustomFilterRow 
                title="Select Genre" 
                icon={Radio} 
                items={GENRES} 
                activeItems={selectedGenres} 
                onToggle={(item: string) => toggleFilter(item, selectedGenres, setSelectedGenres)}
                color="text-red-500"
                showCustom={showCustomGenre}
                setShowCustom={setShowCustomGenre}
                customValue={customGenre}
                setCustomValue={setCustomGenre}
                placeholder="GENRE..."
               />
               <CustomFilterRow 
                title="Select Language" 
                icon={Globe} 
                items={LANGUAGES} 
                activeItems={selectedLanguages} 
                onToggle={(item: string) => toggleFilter(item, selectedLanguages, setSelectedLanguages)}
                color="text-green-500"
                showCustom={showCustomLanguage}
                setShowCustom={setShowCustomLanguage}
                customValue={customLanguage}
                setCustomValue={setCustomLanguage}
                placeholder="LANG..."
               />
               <CustomFilterRow 
                title="Select Country" 
                icon={MapPin} 
                items={COUNTRIES} 
                activeItems={selectedCountries} 
                onToggle={(item: string) => toggleFilter(item, selectedCountries, setSelectedCountries)}
                color="text-yellow-500"
                showCustom={showCustomCountry}
                setShowCustom={setShowCustomCountry}
                customValue={customCountry}
                setCustomValue={setCustomCountry}
                placeholder="COUNTRY..."
               />
            </div>

            {/* Era Filter */}
            <CustomFilterRow 
                title="Pick an Era" 
                icon={Calendar} 
                items={PRESET_YEARS} 
                activeItems={selectedYears} 
                onToggle={(item: string) => toggleFilter(item, selectedYears, setSelectedYears)}
                color="text-blue-500"
                showCustom={showCustomYear}
                setShowCustom={setShowCustomYear}
                customValue={customYear}
                setCustomValue={setCustomYear}
                placeholder="YEAR..."
            />

            {/* Familiar Vibes (Entry Layer - Mainstream) */}
            {filteredMainstreamSongs.length > 0 && (
              <section className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                       <Radio className="text-blue-500" size={20} /> Familiar Vibes
                     </h3>
                     <button onClick={() => setShowModelInfo(true)} className="p-1 rounded-full bg-white/10 text-slate-400 hover:text-white hover:bg-white/20">
                       <Info size={14} />
                     </button>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Entry Layer</span>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {filteredMainstreamSongs.map(song => (
                    <div 
                      key={song.id} 
                      onClick={() => playSong(song)}
                      className="flex-shrink-0 w-40 group cursor-pointer"
                    >
                      <div className="relative aspect-square rounded-[20px] overflow-hidden mb-3 border border-white/5 shadow-lg bg-slate-900">
                        <img 
                          src={song.cover} 
                          onError={handleImageError}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                           <Youtube size={12} className="text-red-500" />
                        </div>
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                           <Play fill="white" className="text-white" size={24} />
                        </div>
                      </div>
                      <h4 className="text-xs font-black text-white truncate">{song.title}</h4>
                      <p className="text-[10px] text-slate-500 font-bold truncate">{song.artist}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Song Grid / Playlist View (Core Focus - Underground) */}
            <section className="space-y-6 pt-4 border-t border-white/5">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black flex items-center gap-3 text-white uppercase tracking-tighter">
                    <TrendingUp className="text-red-500" size={24} />
                    {playlistTitle}
                  </h3>
                  {isFilterActive && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                       <span>{filteredUndergroundSongs.length} Underground Tracks</span>
                       <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                       <span>Based on active filters</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  {isFilterActive && (
                    <>
                      <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                        <Shuffle size={14} /> Shuffle
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all">
                        <Save size={14} /> Save Playlist
                      </button>
                      <button onClick={resetFilters} className="p-2 text-slate-500 hover:text-red-500 transition-colors">
                        <X size={18} />
                      </button>
                    </>
                  )}
                  {!isFilterActive && <button className="text-xs text-blue-500 font-black uppercase tracking-widest hover:underline">View all</button>}
                </div>
              </div>
              
              {filteredUndergroundSongs.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {filteredUndergroundSongs.map(song => (
                    <div 
                      key={song.id} 
                      onClick={() => playSong(song)}
                      className="group cursor-pointer bg-slate-900/40 p-4 rounded-[32px] border border-white/5 hover:border-blue-500/30 transition-all hover:-translate-y-2 shadow-xl"
                    >
                      <div className="relative aspect-square rounded-[24px] overflow-hidden mb-4 shadow-lg bg-slate-800">
                        <img 
                          src={song.cover} 
                          alt={song.title} 
                          onError={handleImageError}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-2xl">
                              <Play fill="currentColor" size={24} />
                           </div>
                        </div>
                        {song.isUnderground && (
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-xl border border-red-500/30 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.2)] group-hover:border-red-500/60 transition-all duration-300">
                             <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
                             <span className="text-[8px] font-black text-white tracking-[0.2em] uppercase drop-shadow-sm">Raw</span>
                          </div>
                        )}
                        {song.state && (
                          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg shadow-lg group-hover:bg-black/80 transition-all duration-300">
                             <MapPin size={10} className="text-slate-400" />
                             <span className="text-[8px] font-black text-slate-200 tracking-widest uppercase">{song.state}</span>
                          </div>
                        )}
                      </div>
                      <h4 className="font-black text-sm truncate text-white uppercase tracking-tighter leading-none mb-1">{song.title}</h4>
                      <p className="text-[10px] text-slate-500 font-bold truncate">{song.artist} • {song.country}</p>
                    </div>
                  ))}
                  {isFilterActive && [1,2].map(i => (
                    <div key={`ghost-${i}`} className="p-4 rounded-[32px] border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center gap-2 opacity-50">
                       <Disc className="text-slate-800 animate-spin-slow" size={32} />
                       <span className="text-[8px] font-black uppercase tracking-widest text-slate-700">Underground Voice #{i + 5}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                  <Disc className="mx-auto text-slate-700 mb-4 animate-spin-slow" size={48} />
                  <p className="text-slate-400 font-black text-sm uppercase tracking-tight">Nothing matches your Vibe.</p>
                  <p className="text-slate-600 text-[10px] uppercase font-bold mt-2">Try adjusting your filters or search query.</p>
                  <button onClick={resetFilters} className="mt-8 px-8 py-3 bg-blue-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest hover:scale-105 transition-transform">Reset All Filters</button>
                </div>
              )}
            </section>
          </div>
        );

      case Page.Player:
        if (!currentSong) return null;
        return (
          <div className="fixed inset-0 bg-black z-[200] flex flex-col pt-4">
            <div className="px-6 flex items-center justify-between h-10 shrink-0">
              <button onClick={() => setActivePage(Page.Home)} className="p-2 bg-white/5 rounded-full text-white"><ArrowLeft size={18}/></button>
              <div className="text-center">
                <p className="text-[8px] uppercase font-black text-slate-600 tracking-widest leading-none mb-1">PLAYING FROM</p>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-tight">{currentSong.genre} • {currentSong.mood}</p>
              </div>
              <button className="p-2 bg-white/5 rounded-full text-white"><MoreHorizontal size={18}/></button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-start px-8 pt-4 space-y-6 overflow-y-auto no-scrollbar pb-16">
              <div className="w-full max-w-[88vw] md:max-w-sm aspect-square rounded-[40px] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] relative group shrink-0 border border-white/5 bg-slate-900">
                
                {/* Visual Cover Art - Always Visible on Top */}
                <img 
                  src={currentSong.cover} 
                  onError={handleImageError}
                  className="relative z-10 w-full h-full object-cover shadow-2xl" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-20"></div>
                
              </div>

              <div className="w-full max-w-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-3xl font-black truncate text-white uppercase tracking-tighter leading-none">{currentSong.title}</h2>
                    <p className="text-base text-slate-400 font-bold truncate mt-1">{currentSong.artist} • {currentSong.language}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => setShowQRModal(true)} className="text-slate-400 hover:text-white transition-colors p-2"><QrCode size={20}/></button>
                    <button onClick={() => setShowTipModal(true)} className="text-blue-500 hover:scale-110 transition-transform bg-blue-500/10 p-2.5 rounded-full border border-blue-500/20 shadow-lg shadow-blue-500/10"><Coins size={20} /></button>
                    <button className="text-red-500 hover:scale-110 transition-transform"><Heart size={26} fill="currentColor" /></button>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
                      if (currentSong.youtubeId) return; // Cannot seek YT in phantom mode easily
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percent = (e.clientX - rect.left) / rect.width;
                      if (audioRef.current) audioRef.current.currentTime = percent * (audioRef.current.duration || 0);
                  }}>
                    <div className="h-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] relative" style={{ width: `${currentSong.youtubeId ? '100%' : `${progress}%`}` }}>
                        <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md ${currentSong.youtubeId ? 'animate-pulse' : ''}`}></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[9px] font-black text-slate-600 uppercase tracking-widest">
                    <span>{currentSong.youtubeId ? 'LIVE' : formatTime(currentTime)}</span>
                    <span>{currentSong.youtubeId ? 'STREAM' : formatTime(duration)}</span>
                  </div>
                </div>
                
                {currentSong.youtubeId && (
                   <div className="text-center bg-blue-600/10 p-2 rounded-xl border border-blue-600/20 animate-in fade-in slide-in-from-bottom-2">
                     <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                       <Zap size={12} fill="currentColor"/> Premium Vibe Mode Active
                     </p>
                   </div>
                )}

                <div className="flex items-center justify-between px-4 text-white">
                  <button className="text-slate-500 hover:text-white transition-colors"><SkipBack size={32}/></button>
                  <button 
                    onClick={togglePlay}
                    className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl"
                  >
                    {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
                  </button>
                  <button className="text-slate-500 hover:text-white transition-colors"><SkipForward size={32}/></button>
                </div>

                {/* Lyrics Section */}
                <div className="space-y-3">
                   <div className="flex items-center gap-2 text-blue-500 uppercase font-black text-[10px] tracking-widest opacity-80">
                      <Quote size={12} /> Lyrics
                   </div>
                   <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-3 text-center italic relative group overflow-hidden">
                      {mockLyrics.slice(0, 3).map((line, idx) => (
                        <p key={idx} className={`text-sm tracking-tight ${idx === 1 ? 'text-white font-black text-base scale-105' : 'text-slate-500'}`}>
                          {line}
                        </p>
                      ))}
                   </div>
                </div>

                {/* Diary Moments Section */}
                <div className="space-y-3">
                   <div className="flex items-center gap-2 text-red-500 uppercase font-black text-[10px] tracking-widest opacity-80">
                      <BookOpen size={12} /> Diary Moments
                   </div>
                   <div className="bg-[#0f172a]/80 border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl">
                      <textarea 
                        value={currentMemory}
                        onChange={(e) => setCurrentMemory(e.target.value)}
                        placeholder="Link a memory to this track..." 
                        className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-xs text-slate-300 outline-none focus:border-blue-500 transition-all h-24 resize-none leading-relaxed font-medium"
                      />
                      <button onClick={saveMemory} className="w-full py-3.5 bg-white/5 hover:bg-white text-slate-400 hover:text-black font-black text-[10px] rounded-2xl transition-all border border-white/10 uppercase tracking-widest">
                        Save Moment
                      </button>
                   </div>
                </div>

                <div className="flex justify-around items-center pt-2 border-t border-white/5">
                  {REACTIONS.map(r => (
                    <button key={r.emoji} className="flex flex-col items-center gap-1.5 group">
                      <span className="text-2xl group-hover:scale-125 transition-transform duration-300">{r.emoji}</span>
                      <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">{r.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pb-4">
                    <input type="text" placeholder="Reaction..." className="flex-1 bg-white/5 border border-white/10 rounded-full px-5 py-4 text-xs focus:border-blue-600 outline-none transition-all text-white font-medium" />
                    <button className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl active:scale-90 transition-transform shrink-0"><ArrowLeft className="rotate-180" size={20}/></button>
                </div>

                {/* Comments Section */}
                <div className="space-y-4 pt-2 border-t border-white/5">
                   <div className="flex items-center gap-2 text-slate-400 uppercase font-black text-[10px] tracking-widest">
                      <MessageCircle size={12} /> Live Comments
                   </div>
                   <div className="space-y-3">
                     {MOCK_COMMENTS.map((comment) => (
                       <div key={comment.id} className="flex gap-3">
                         <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                           {comment.user[0]}
                         </div>
                         <div className="flex-1">
                           <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-slate-300">{comment.user}</span>
                             <span className="text-[8px] text-slate-600 font-bold">{comment.time}</span>
                           </div>
                           <p className="text-xs text-slate-400 leading-tight mt-0.5">{comment.text}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!hasOnboarded) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-red-900/20 z-0"></div>
         <div className="relative z-10 w-full max-w-md space-y-12">
            <div className="text-center space-y-6">
               <Logo className="h-12 justify-center" />
               <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                 Find Your <span className="text-blue-600">Listener</span>.<br/>
                 Feel The <span className="text-red-600">Music</span>.
               </h1>
               <p className="text-slate-400 text-sm font-medium leading-relaxed px-4">
                 Discover raw, independent artistry without the corporate noise. Join the underground movement.
               </p>
            </div>

            <div className="space-y-4">
               <div className="bg-white/5 border border-white/10 rounded-2xl p-1 flex items-center">
                  <div className="w-12 h-12 flex items-center justify-center text-slate-500">
                    <UserIcon size={20} />
                  </div>
                  <input type="text" placeholder="Enter your mobile or email" className="flex-1 bg-transparent border-none outline-none text-white text-sm font-bold h-full" />
               </div>
               <button onClick={() => setHasOnboarded(true)} className="w-full py-5 bg-white text-black font-black text-sm uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3">
                  Start Listening <ArrowRight size={18} />
               </button>
            </div>
            
            <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
               By joining, you agree to our Terms & Vibe Policy.
            </p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row overflow-hidden relative selection:bg-blue-600/30">
      <audio ref={audioRef} className="hidden" />
      
      {/* Global Phantom Player - Always Present for Background Audio */}
      {currentSong?.youtubeId && (
         <div className="fixed -bottom-96 -right-96 w-1 h-1 overflow-hidden opacity-0 pointer-events-none z-[-1]">
             <iframe 
                ref={youtubePlayerRef}
                width="200" 
                height="200" 
                src={`https://www.youtube.com/embed/${currentSong.youtubeId}?autoplay=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${currentSong.youtubeId}&enablejsapi=1&iv_load_policy=3&modestbranding=1`}
                title="Phantom Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
             ></iframe>
         </div>
      )}

      {/* Model Info Modal */}
      {showModelInfo && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
           <div className="bg-slate-900 p-8 rounded-[40px] border border-white/10 flex flex-col items-center gap-6 max-w-md w-full animate-in zoom-in duration-300 relative">
              <button onClick={() => setShowModelInfo(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24}/></button>
              <div className="text-center space-y-2">
                 <h3 className="text-xl font-black text-white uppercase tracking-tight">How Vibe Works</h3>
                 <p className="text-xs text-blue-500 font-bold uppercase tracking-widest">Hybrid Discovery Model</p>
              </div>
              <div className="space-y-4 w-full">
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                   <div className="flex items-center gap-3 mb-2">
                     <Radio className="text-blue-500" size={18} />
                     <h4 className="font-black text-white uppercase text-sm">Mainstream (Entry Layer)</h4>
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                     Popular tracks streamed via official YouTube embeds. Vibe does not host or monetize these. They act as a bridge to help you settle in.
                   </p>
                 </div>
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                   <div className="flex items-center gap-3 mb-2">
                     <TrendingUp className="text-red-500" size={18} />
                     <h4 className="font-black text-white uppercase text-sm">Underground (Core Focus)</h4>
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                     Raw, independent artists hosted directly by Vibe. Ad-free, uninterrupted, and supported by your subscription. This is our heart.
                   </p>
                 </div>
              </div>
              <p className="text-[9px] text-slate-500 text-center font-bold uppercase">
                "Familiar sounds bring you in. Real voices make you stay."
              </p>
           </div>
        </div>
      )}

      {/* QR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
           <div className="bg-slate-900 p-8 rounded-[40px] border border-white/10 flex flex-col items-center gap-6 max-w-sm w-full animate-in zoom-in duration-300 relative">
              <button onClick={() => setShowQRModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24}/></button>
              <div className="text-center space-y-2">
                 <h3 className="text-xl font-black text-white uppercase tracking-tight">Share the Vibe</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{currentSong?.title}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-2xl">
                 <QrCode size={180} className="text-black" />
              </div>
              <div className="flex gap-4 w-full">
                 <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700">Download</button>
                 <button className="flex-1 py-3 bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/20">Copy Link</button>
              </div>
           </div>
        </div>
      )}

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-[40px] p-8 border border-white/10 shadow-2xl space-y-8 animate-in zoom-in duration-300">
            <button onClick={() => setShowTipModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            <div className="text-center space-y-3 pt-4">
              <div className="w-20 h-20 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner"><Coins size={40} /></div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Direct Artist Tip</h3>
              <p className="text-sm text-slate-400 font-medium px-4 leading-relaxed">100% of this tip goes to <span className="text-blue-500 font-bold">{currentSong?.artist}</span>.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['20', '50', '100', '200', '500', 'Custom'].map((amt) => (
                <button key={amt} onClick={() => amt !== 'Custom' && setTipAmount(amt)} className={`py-4 rounded-2xl font-black text-xs transition-all border ${tipAmount === amt && amt !== 'Custom' ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-black/50 border-white/10 text-slate-500 hover:border-blue-500/40 hover:text-white'}`}>
                  {amt === 'Custom' ? '...' : `₹${amt}`}
                </button>
              ))}
            </div>
            <button onClick={handleTip} className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95 text-sm uppercase tracking-widest">
              CONFIRM ₹{tipAmount} TIP
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 h-screen sticky top-0 bg-[#020617] p-6 border-r border-white/5 z-[60]">
        <Logo className="mb-12 h-6" />
        <nav className="flex-1 space-y-7">
          {[
            { id: Page.Home, icon: HomeIcon, label: 'Home' },
            { id: Page.Explore, icon: Search, label: 'Explore' },
            { id: Page.Library, icon: Library, label: 'Library' },
            { id: Page.Upload, icon: Upload, label: 'Upload' },
            { id: Page.Profile, icon: UserIcon, label: 'Profile' },
            ...(user.isAdmin ? [{ id: Page.Admin, icon: Shield, label: 'Admin' }] : [])
          ].map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)} className={`flex items-center gap-4 w-full text-left font-black text-sm uppercase tracking-widest transition-all ${activePage === item.id ? 'text-blue-500 scale-105' : 'text-slate-500 hover:text-white'}`}>
              <item.icon size={22} /> {item.label}
            </button>
          ))}
        </nav>

        {/* Install App Button - Desktop (Always Visible if not installed) */}
        {!isStandalone && (
          <button 
            onClick={handleInstallClick}
            className="mt-auto flex items-center gap-3 w-full p-4 bg-blue-600/10 border border-blue-600/20 rounded-2xl text-blue-500 font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all group animate-in slide-in-from-bottom-5"
          >
            <Download size={18} className="group-hover:animate-bounce" /> Download App
          </button>
        )}
      </aside>

      <main className="flex-1 flex flex-col relative bg-gradient-to-b from-[#0f172a] to-black min-h-screen overflow-y-auto overflow-x-hidden">
        <header className="fixed top-0 left-0 right-0 md:left-60 h-16 glass-morphism px-6 flex items-center justify-between z-[100] border-b border-white/10">
          <div className="md:hidden">
            <Logo className="h-5" />
          </div>
          <div className="hidden md:flex flex-1 max-w-md mx-8">
             <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search mood, artist, era..." 
                  className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-xs focus:border-blue-500/40 outline-none transition-all text-white font-medium" 
                />
             </div>
          </div>
          <div className="flex items-center gap-4">
             {/* Mobile Install Button (Always Visible if not installed) */}
             {!isStandalone && (
               <button 
                  onClick={handleInstallClick} 
                  className="md:hidden p-2 text-blue-500 hover:text-white transition-colors animate-pulse bg-blue-500/10 rounded-full border border-blue-500/20 shadow-lg shadow-blue-500/20"
               >
                  <Download size={20} />
               </button>
             )}
             
             <button onClick={() => setActivePage(Page.Notifications)} className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-black"></span>
             </button>
             <div className="cursor-pointer" onClick={() => setActivePage(Page.Profile)}>
               <img src={user.avatar} className="w-8 h-8 rounded-full border-2 border-blue-600 p-0.5 object-cover shadow-lg" />
             </div>
          </div>
        </header>

        {renderContent()}

        {activePage !== Page.Player && (
          <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-60 z-[90]">
            <Player 
              song={currentSong} 
              onNavigate={setActivePage} 
              isPlaying={isPlaying} 
              progress={progress}
              onTogglePlay={togglePlay}
            />
          </div>
        )}

        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-morphism flex items-center justify-around h-16 z-[110] border-t border-white/10 px-4">
          {[
            { id: Page.Home, icon: HomeIcon, label: 'Home' },
            { id: Page.Explore, icon: Search, label: 'Explore' },
            { id: Page.Upload, icon: PlusCircle, label: 'Upload' },
            { id: Page.Profile, icon: UserIcon, label: 'Profile' },
            ...(user.isAdmin ? [{ id: Page.Admin, icon: Shield, label: 'Admin' }] : [])
          ].map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)} className={`flex flex-col items-center gap-1 flex-1 py-2 transition-all ${activePage === item.id ? 'text-blue-500' : 'text-slate-500'}`}>
              <item.icon size={18} />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default App;
