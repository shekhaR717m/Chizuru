import React from 'react';
import { SpotifyPlayerState } from '../types';

interface SpotifyPlayerProps {
    playerState: SpotifyPlayerState | null;
    onTogglePlay: () => void;
    onNext: () => void;
    onPrevious: () => void;
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ playerState, onTogglePlay, onNext, onPrevious }) => {
    if (!playerState?.track) {
        return (
            <div role="region" aria-label="Spotify Music Player" className="fixed bottom-4 left-4 bg-gray-800/80 backdrop-blur-sm text-white p-3 rounded-lg shadow-2xl flex items-center space-x-3 w-64 border border-gray-700 fade-in">
                <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
                </div>
                <div>
                    <p className="font-semibold text-sm">Spotify Player</p>
                    <p className="text-xs text-gray-400">Play a song to begin...</p>
                </div>
            </div>
        );
    }

    const { track, is_paused } = playerState;
    const albumArtUrl = track.album.images[0]?.url || '';
    const artistName = track.artists.map(a => a.name).join(', ');

    return (
        <div role="region" aria-label="Spotify Music Player" className="fixed bottom-4 left-4 bg-gray-800/80 backdrop-blur-sm text-white p-3 rounded-lg shadow-2xl flex items-center space-x-3 w-80 border border-gray-700 fade-in">
            <img src={albumArtUrl} alt={track.album.name} className="w-16 h-16 rounded-md shadow-md" />
            <div className="flex-1 overflow-hidden">
                <p className="font-bold text-sm truncate">{track.name}</p>
                <p className="text-xs text-gray-400 truncate">{artistName}</p>
                <div className="flex items-center space-x-3 mt-2">
                    <button onClick={onPrevious} className="text-gray-400 hover:text-white transition" aria-label="Previous track">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.953 3.547a1 1 0 00-1.02.043L4.062 9.51a1 1 0 000 1.018l7.87 5.92a1 1 0 001.53-.974V4.52a1 1 0 00-.508-.973zM18 4a1 1 0 00-1 1v14a1 1 0 002 0V5a1 1 0 00-1-1z"/></svg>
                    </button>
                    <button onClick={onTogglePlay} className="text-white bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-600 transition" aria-label={is_paused ? `Play ${track.name}` : `Pause ${track.name}`}>
                        {is_paused ? 
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"/></svg> :
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 7h3v10H8zm5 0h3v10h-3z"/></svg>
                        }
                    </button>
                    <button onClick={onNext} className="text-gray-400 hover:text-white transition" aria-label="Next track">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.047 3.547a1 1 0 011.02.043l7.87 5.92a1 1 0 010 1.018l-7.87 5.92a1 1 0 01-1.53-.974V4.52a1 1 0 01.509-.973zM6 20a1 1 0 011-1h1a1 1 0 010 2H7a1 1 0 01-1-1zM7 4a1 1 0 00-1 1v14a1 1 0 002 0V5a1 1 0 00-1-1z"/></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SpotifyPlayer;