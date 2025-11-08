import React, { useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage';

interface ChatWindowProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  isProcessingMedia?: boolean;
  processingStatus?: string;
  onPlayerMove: (messageIndex: number, row: number, col: number) => void;
  onPlayTTS: (text: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, isProcessingMedia, processingStatus, onPlayerMove, onPlayTTS }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isProcessingMedia]);

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-800/50" role="log" aria-live="polite">
      <div className="flex flex-col space-y-4">
        {messages.map((msg, index) => (
          <ChatMessage 
            key={index} 
            message={msg}
            onPlayerMove={(row, col) => onPlayerMove(index, row, col)}
            onPlayTTS={onPlayTTS}
          />
        ))}
        {isLoading && (
          <div role="status" className="flex justify-start items-center space-x-2">
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse delay-150"></div>
             <span className="text-sm text-gray-400">Chizuru is thinking...</span>
          </div>
        )}
        {isProcessingMedia && (
            <div role="status" className="flex justify-start items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-150"></div>
                <span className="text-sm text-gray-400">{processingStatus || "Processing..."}</span>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;