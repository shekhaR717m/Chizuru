
import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import UserIcon from './icons/UserIcon';
import BotIcon from './icons/BotIcon';
import TicTacToeBoard from './TicTacToeBoard';
import DownloadIcon from './icons/DownloadIcon';
import SpeakerIcon from './icons/SpeakerIcon';

interface ChatMessageProps {
  message: ChatMessageType;
  onPlayerMove?: (row: number, col: number) => void;
  onPlayTTS?: (text: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onPlayerMove, onPlayTTS }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-teal-500 flex-shrink-0 flex items-center justify-center">
          <BotIcon />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <div 
          className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl relative group ${
            isUser 
              ? 'bg-slate-600 rounded-br-lg' 
              : 'bg-gray-700 rounded-bl-lg'
          }`}
        >
          <p className="text-white whitespace-pre-wrap">{message.text}</p>
          {!isUser && onPlayTTS && message.text && (
             <button
              onClick={() => onPlayTTS(message.text)}
              className="absolute -bottom-3 -right-3 p-1.5 bg-gray-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-500"
              aria-label="Read aloud"
            >
              <SpeakerIcon />
            </button>
          )}
        </div>
        
        {message.imageUrl && (
          <div className="max-w-xs md:max-w-md lg:max-w-lg rounded-lg overflow-hidden relative group">
            <img src={message.imageUrl} alt="Generated content" className="w-full h-auto"/>
            <a
              href={message.imageUrl}
              download={`chizuru-image-${new Date().getTime()}.jpg`}
              className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Download image"
            >
              <DownloadIcon />
            </a>
          </div>
        )}

        {message.videoUrl && (
          <div className="max-w-xs md:max-w-md lg:max-w-lg rounded-lg overflow-hidden relative group">
            <video src={message.videoUrl} controls playsInline className="w-full h-auto"/>
             <a
              href={message.videoUrl}
              download={`chizuru-video-${new Date().getTime()}.mp4`}
              className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Download video"
            >
              <DownloadIcon />
            </a>
          </div>
        )}
        
        {message.game && message.game.gameType === 'tic-tac-toe' && onPlayerMove && (
          <div className="max-w-xs md:max-w-md lg:max-w-lg">
            <TicTacToeBoard gameState={message.game} onMove={onPlayerMove} />
          </div>
        )}

        {message.groundingChunks && message.groundingChunks.length > 0 && (
           <div className="max-w-xs md:max-w-md lg:max-w-lg text-xs text-gray-400">
            <p className="font-semibold mb-1">Sources:</p>
            <ul className="list-disc list-inside space-y-1">
              {message.groundingChunks.map((chunk, index) => {
                const source = chunk.web || chunk.maps;
                if (!source || !source.uri) return null;
                return (
                  <li key={index}>
                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:text-teal-400 hover:underline truncate">
                      {source.title || source.uri}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
       {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-600 flex-shrink-0 flex items-center justify-center">
          <UserIcon />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
