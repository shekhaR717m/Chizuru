import React, { useState, useEffect, useRef } from 'react';

interface ImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, aspectRatio: string) => void;
}

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];

const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
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
    modalRef.current?.querySelector('textarea')?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerate(prompt, aspectRatio);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 fade-in" onClick={onClose}>
        <div 
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="imagegen-modal-title"
          className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
            <h2 id="imagegen-modal-title" className="text-xl font-bold text-teal-400 mb-4">Generate Image</h2>
            <p className="text-sm text-gray-400 mb-4">Describe the image you want to create. Be as descriptive as you like!</p>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A cute anime girl sitting in a cozy cafe, rainy day outside"
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-300 mb-4"
                rows={4}
            />
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                <div className="bg-gray-700 rounded-lg p-1 flex flex-wrap gap-1">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`flex-grow py-1.5 px-2 text-sm font-medium rounded-md transition-colors ${aspectRatio === ratio ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600/50'}`}>{ratio}</button>
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition">Cancel</button>
                <button onClick={handleGenerate} disabled={!prompt.trim()} className="px-4 py-2 bg-teal-600 rounded-lg hover:bg-teal-500 transition disabled:bg-teal-800 disabled:cursor-not-allowed">Generate</button>
            </div>
        </div>
    </div>
  );
};

export default ImageGenerationModal;