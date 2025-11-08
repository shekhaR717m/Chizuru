import React, { useState, useEffect, useRef } from 'react';
import { Personality, VoiceConfig, PerformanceMode } from '../types';
import { PREBUILT_VOICES } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: { 
    personality: Personality, 
    voice: VoiceConfig,
    performanceMode: PerformanceMode,
    internetAccess: boolean 
  }) => void;
  currentPersonality: Personality;
  currentVoice: VoiceConfig;
  currentPerformanceMode: PerformanceMode;
  currentInternetAccess: boolean;
}

const PREDEFINED_PERSONALITIES: { key: Personality; label: string }[] = [
  { key: 'default', label: 'Empathetic' },
  { key: 'cheerful', label: 'Cheerful' },
  { key: 'shy', label: 'Shy' },
  { key: 'intellectual', label: 'Intellectual' },
];

const PERFORMANCE_MODES: { key: PerformanceMode; label: string, description: string }[] = [
    { key: 'lite', label: 'Lite', description: 'Fastest response time.' },
    { key: 'default', label: 'Default', description: 'Balanced speed and capability.' },
    { key: 'pro', label: 'Pro', description: 'Slower, for complex reasoning.' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentPersonality, currentVoice, currentPerformanceMode, currentInternetAccess }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedPersonality, setSelectedPersonality] = useState<Personality>(currentPersonality);
  const [customPersonality, setCustomPersonality] = useState('');
  const [voiceSettings, setVoiceSettings] = useState<VoiceConfig>(currentVoice);
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>(currentPerformanceMode);
  const [internetAccess, setInternetAccess] = useState<boolean>(currentInternetAccess);

  useEffect(() => {
    if (isOpen) {
      setSelectedPersonality(currentPersonality);
      setVoiceSettings(currentVoice);
      setPerformanceMode(currentPerformanceMode);
      setInternetAccess(currentInternetAccess);
      const isPredefined = PREDEFINED_PERSONALITIES.some(p => p.key === currentPersonality);
      if (!isPredefined && typeof currentPersonality === 'string') {
        setCustomPersonality(currentPersonality);
      } else {
        setCustomPersonality('');
      }
    }
  }, [isOpen, currentPersonality, currentVoice, currentPerformanceMode, currentInternetAccess]);

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
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);


  const handleSave = () => {
    const finalPersonality = selectedPersonality === 'custom' ? (customPersonality.trim() || 'default') : selectedPersonality;
    onSave({ personality: finalPersonality, voice: voiceSettings, performanceMode, internetAccess });
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 fade-in" onClick={onClose}>
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h2 id="settings-modal-title" className="text-xl font-bold text-teal-400 mb-4">Core Settings</h2>
          <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Performance Mode</label>
                <div className="bg-gray-700 rounded-lg p-1 flex space-x-1">
                    {PERFORMANCE_MODES.map(({key, label}) => (
                         <button key={key} onClick={() => setPerformanceMode(key)} className={`w-full py-1.5 text-sm font-medium rounded-md transition-colors ${performanceMode === key ? 'bg-teal-600 text-white' : 'text-gray-300 hover:bg-gray-600/50'}`}>{label}</button>
                    ))}
                </div>
            </div>
             <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                <div>
                    <label htmlFor="internet-toggle" className="font-medium text-white">Internet Access</label>
                    <p className="text-xs text-gray-400">Allow Chizuru to access Google Search & Maps.</p>
                </div>
                <label htmlFor="internet-toggle" className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="internet-toggle" className="sr-only peer" checked={internetAccess} onChange={() => setInternetAccess(!internetAccess)} />
                    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-teal-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 mb-6">
          <h2 className="text-xl font-bold text-teal-400 mb-4">Choose Chizuru's Personality</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {PREDEFINED_PERSONALITIES.map(({ key, label }) => (
              <button key={key} onClick={() => setSelectedPersonality(key)} className={`px-4 py-2 rounded-lg text-left transition ${selectedPersonality === key ? 'bg-teal-600 ring-2 ring-teal-400' : 'bg-gray-700 hover:bg-gray-600'}`}>
                {label}
              </button>
            ))}
          </div>
          <div>
            <button onClick={() => setSelectedPersonality('custom')} className={`w-full px-4 py-2 rounded-lg text-left transition mb-2 ${selectedPersonality === 'custom' ? 'bg-teal-600 ring-2 ring-teal-400' : 'bg-gray-700 hover:bg-gray-600'}`}>
              Custom
            </button>
            {selectedPersonality === 'custom' && (
              <textarea value={customPersonality} onChange={(e) => setCustomPersonality(e.target.value)} placeholder="Describe a personality (e.g., 'a curious explorer')" className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-300" rows={2}/>
            )}
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6">
            <h2 className="text-xl font-bold text-teal-400 mb-4">Voice Settings</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="voice-select" className="block text-sm font-medium text-gray-300 mb-1">Voice</label>
                    <select id="voice-select" value={voiceSettings.name} onChange={e => setVoiceSettings(v => ({...v, name: e.target.value}))} className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                        {PREBUILT_VOICES.map(voice => <option key={voice.name} value={voice.name}>{voice.label}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="pitch-slider" className="block text-sm font-medium text-gray-300 mb-1">Pitch: <span className="font-mono text-teal-400">{voiceSettings.pitch.toFixed(1)}</span></label>
                    <input id="pitch-slider" type="range" min="-10" max="10" step="0.5" value={voiceSettings.pitch} onChange={e => setVoiceSettings(v => ({...v, pitch: parseFloat(e.target.value)}))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-teal-500"/>
                </div>
                <div>
                    <label htmlFor="rate-slider" className="block text-sm font-medium text-gray-300 mb-1">Speaking Rate: <span className="font-mono text-teal-400">{voiceSettings.speakingRate.toFixed(2)}x</span></label>
                    <input id="rate-slider" type="range" min="0.5" max="2.0" step="0.05" value={voiceSettings.speakingRate} onChange={e => setVoiceSettings(v => ({...v, speakingRate: parseFloat(e.target.value)}))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-teal-500"/>
                </div>
            </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6 border-t border-gray-700 pt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-teal-600 rounded-lg hover:bg-teal-500 transition">Save</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;