import React, { useState } from 'react';
import SendIcon from './icons/SendIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';
import StopIcon from './icons/StopIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import SparklesIcon from './icons/SparklesIcon';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isVoiceActive: boolean;
  isConnecting: boolean;
  onToggleVoice: () => void;
  onFileUpload: () => void;
  onGenerateImage: () => void;
  fileUploadButtonRef: React.RefObject<HTMLButtonElement>;
  generateImageButtonRef: React.RefObject<HTMLButtonElement>;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, isVoiceActive, isConnecting, onToggleVoice, onFileUpload, onGenerateImage, fileUploadButtonRef, generateImageButtonRef }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !isVoiceActive) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const isMicDisabled = isLoading;
  const isInputDisabled = isLoading || isVoiceActive;

  return (
    <div className="p-4 bg-gray-800 border-t-2 border-gray-700">
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <button
          ref={fileUploadButtonRef}
          type="button"
          onClick={onFileUpload}
          disabled={isInputDisabled}
          className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-500 transition duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed"
          aria-label="Attach file"
        >
          <PaperclipIcon />
        </button>
        <button
          ref={generateImageButtonRef}
          type="button"
          onClick={onGenerateImage}
          disabled={isInputDisabled}
          className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-500 transition duration-300 disabled:bg-gray-700 disabled:cursor-not-allowed"
          aria-label="Generate Image"
        >
          <SparklesIcon />
        </button>
        
        <label htmlFor="chat-input" className="sr-only">Your message</label>
        <input
          id="chat-input"
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isVoiceActive ? "Listening..." : "Share what's on your mind..."}
          disabled={isInputDisabled}
          className="flex-1 bg-gray-700 rounded-full px-5 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-300 disabled:opacity-50"
          autoComplete="off"
        />
        
        <button
          type="submit"
          disabled={isInputDisabled || !message.trim()}
          className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white hover:bg-teal-700 transition duration-300 disabled:bg-teal-800 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <SendIcon />
        </button>
        
        <button
          type="button"
          onClick={onToggleVoice}
          disabled={isMicDisabled}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition duration-300 ${
            isVoiceActive 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          } disabled:bg-gray-600 disabled:cursor-not-allowed`}
          aria-label={isVoiceActive ? 'Stop voice chat' : 'Start voice chat'}
        >
          {isConnecting ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : isVoiceActive ? (
            <StopIcon />
          ) : (
            <MicrophoneIcon />
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatInput;