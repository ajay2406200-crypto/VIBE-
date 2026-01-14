
export type MoodType = 'Euphoric' | 'Melancholy' | 'Aggressive' | 'Dreamy' | 'Raw' | 'Vibe';

export interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audioUrl?: string; // Optional if using YouTube
  youtubeId?: string; // For mainstream songs
  mood: MoodType;
  year: number;
  genre: string;
  language: string;
  country: string;
  state?: string; // New State field for regional discovery
  isUnderground: boolean;
  duration: number; // in seconds
  likes: number;
  reactions: Record<string, number>;
  // New Metadata fields
  songType?: 'Official' | 'Remix' | 'Live';
  targetListener?: string;
}

export interface User {
  id: string;
  name: string;
  isPremium: boolean;
  avatar: string;
  role: 'Listener' | 'Artist';
  isAdmin?: boolean;
}

export interface Reaction {
  emoji: string;
  label: string;
}

export enum Page {
  Home = 'home',
  Explore = 'explore',
  Library = 'library',
  Upload = 'upload',
  Profile = 'profile',
  Player = 'player',
  Subscription = 'subscription',
  Admin = 'admin',
  Notifications = 'notifications'
}
