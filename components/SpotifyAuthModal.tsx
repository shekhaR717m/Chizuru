import React, { useState, useEffect, useRef } from 'react';

interface SpotifyAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (token: string) => void;
}

const SpotifyAuthModal: React.FC<SpotifyAuthModalProps> = ({ isOpen, onClose, onSave }) => {
  const [token, setToken] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) { // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Focus the first element when the modal opens
    modalRef.current?.querySelector('input')?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  const handleSave = () => {
    onSave(token);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 fade-in" onClick={onClose}>
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="spotify-modal-title"
        className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-700" 
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="spotify-modal-title" className="text-xl font-bold text-teal-400 mb-4">Connect Spotify</h2>
        <p className="text-gray-400 text-sm mb-4">
          To play music, you need to provide a temporary access token from Spotify. This allows Chizuru to control playback in your browser.
        </p>
        <ol className="list-decimal list-inside text-gray-400 text-sm mb-4 space-y-1">
          <li>
            Go to the{' '}
            <a
              href="https://developer.spotify.com/console/get-current-user-saved-tracks/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:underline"
            >
              Spotify Developer Console
            </a>.
          </li>
          <li>Click "Get Token" and log in to your Spotify account.</li>
          <li>
            Check the following scopes:
            <code className="block bg-gray-900 text-xs p-2 rounded mt-1">streaming, user-read-playback-state, user-modify-playback-state</code>
          </li>
          <li>Copy the generated "OAuth Token" and paste it below.</li>
        </ol>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your OAuth Token here"
          className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-300 mb-4"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition">Cancel</button>
          <button onClick={handleSave} disabled={!token.trim()} className="px-4 py-2 bg-teal-600 rounded-lg hover:bg-teal-500 transition disabled:bg-teal-800 disabled:cursor-not-allowed">Connect</button>
        </div>
      </div>
    </div>
  );
};

export default SpotifyAuthModal;