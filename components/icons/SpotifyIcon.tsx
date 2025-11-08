import React from 'react';

interface SpotifyIconProps {
  isConnected: boolean;
}

const SpotifyIcon: React.FC<SpotifyIconProps> = ({ isConnected }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={`h-6 w-6 transition-colors ${isConnected ? 'text-green-500' : 'text-gray-400 group-hover:text-white'}`} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
  >
    <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm4.194 14.575c-.2.313-.613.413-.925.2-2.288-1.4-5.125-1.713-8.488-.938-.363.087-.725-.137-.813-.5s.138-.725.5-.812c3.725-.85 6.875-.5 9.425 1.125.312.2.412.612.2.925zm.862-2.525c-.25.388-.75.513-1.138.263-2.612-1.612-6.525-2.087-9.712-1.137-.438.125-.888-.138-1.013-.575s.137-.887.575-1.012c3.587-1.038 7.887-.5 10.862 1.337.388.25.513.75.263 1.125zm.1-2.975c-3.113-1.85-8.25-2.038-11.488-1.125-.512.15-.962-.2-1.112-.712s.2-.963.712-1.113c3.675-1.012 9.325-.787 12.875 1.325.463.275.625.862.35 1.325-.275.462-.862.625-1.325.35z"></path>
  </svg>
);

export default SpotifyIcon;