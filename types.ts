
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  videoUrl?: string;
  imageUrl?: string;
  game?: GameState;
  groundingChunks?: GroundingChunk[];
}

export type AnimationType = 'default' | 'happy' | 'thinking' | 'consoling' | 'wholesome' | 'sad' | 'giggle' | 'blushing' | 'curious' | 'pouting';

export type Personality = 'default' | 'cheerful' | 'shy' | 'intellectual' | string; // string for custom

export interface VoiceConfig {
  name: string;
  pitch: number;
  speakingRate: number;
}

export interface SpotifyPlayerState {
  track: {
    name: string;
    uri: string;
    album: {
      name: string;
      images: { url: string }[];
    };
    artists: { name: string }[];
  } | null;
  is_paused: boolean;
  position: number;
  duration: number;
}

export type Player = 'user' | 'model';

export interface GameState {
  gameType: 'tic-tac-toe';
  board: (Player | null)[][];
  status: 'playing' | 'win' | 'lose' | 'draw';
  winner?: Player;
  isComputerThinking?: boolean;
}

export type Mood = 'normal' | 'angry';

export type PerformanceMode = 'lite' | 'default' | 'pro';

export interface WebSource {
  uri: string;
  title: string;
}
    
export interface GroundingChunk {
  web?: WebSource;
  maps?: WebSource; 
}
