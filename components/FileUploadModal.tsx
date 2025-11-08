import React, { useState, useEffect, useRef } from 'react';

interface FileUploadModalProps {
  isOpen: boolean;
  file: File | null;
  onClose: () => void;
  onAnalyze: (file: File, prompt: string) => void;
  onGenerateVideo: (file: File, prompt: string, aspectRatio: '16:9' | '9:16') => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({ isOpen, file, onClose, onAnalyze, onGenerateVideo }) => {
  const [prompt, setPrompt] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setPrompt(file.type.startsWith('video') ? 'What is happening in this video?' : 'What do you see in this image?');
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

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


  if (!isOpen || !file) return null;

  const isImage = file.type.startsWith('image');
  const isVideo = file.type.startsWith('video');

  const handleAnalyze = () => {
    if (!prompt.trim()) return;
    onAnalyze(file, prompt);
  };
  
  const handleGenerate = () => {
    if (!prompt.trim() || !isImage) return;
    onGenerateVideo(file, prompt, aspectRatio);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 fade-in" onClick={onClose}>
        <div 
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="fileupload-modal-title"
          className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
            <h2 id="fileupload-modal-title" className="text-xl font-bold text-teal-400 mb-4">File Uploaded</h2>
            
            {isImage && fileUrl && <img src={fileUrl} alt="Selected preview" className="rounded-lg mb-4 max-h-48 w-auto mx-auto" />}
            {isVideo && fileUrl && <video src={fileUrl} controls className="rounded-lg mb-4 max-h-48 w-auto mx-auto" />}

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isImage ? "e.g., 'What is this?' or 'Make her hair blow in the wind'" : "e.g., 'Summarize this video.'"}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-300 mb-4"
                rows={3}
            />

            {isImage && (
              <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">For Video Generation - Aspect Ratio:</p>
                  <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="radio" name="aspectRatio" value="16:9" checked={aspectRatio === '16:9'} onChange={() => setAspectRatio('16:9')} className="form-radio text-teal-500 bg-gray-700"/>
                          <span>Landscape (16:9)</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="radio" name="aspectRatio" value="9:16" checked={aspectRatio === '9:16'} onChange={() => setAspectRatio('9:16')} className="form-radio text-teal-500 bg-gray-700"/>
                          <span>Portrait (9:16)</span>
                      </label>
                  </div>
              </div>
            )}
            
            <div className="flex justify-between items-center">
                <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition">Cancel</button>
                <div className="flex justify-end gap-3">
                    <button onClick={handleAnalyze} disabled={!prompt.trim()} className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition disabled:bg-blue-800 disabled:cursor-not-allowed">
                        Analyze {isImage ? 'Image' : 'Video'}
                    </button>
                    {isImage && (
                        <button onClick={handleGenerate} disabled={!prompt.trim()} className="px-4 py-2 bg-teal-600 rounded-lg hover:bg-teal-500 transition disabled:bg-teal-800 disabled:cursor-not-allowed">
                            Generate Video
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default FileUploadModal;