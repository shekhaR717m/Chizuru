import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType, Personality, VoiceConfig, SpotifyPlayerState, GameState, Player, Mood, PerformanceMode } from './types';
import { getChatResponse, getAnimationType, getSongSuggestionForMood, getComputerMove, checkIfUpsetting, evaluateCoaxing, generateSpeech, generateImage, analyzeMedia } from './services/geminiService';
import { LiveService } from './services/liveService';
import { generateVideo } from './services/veoService';
import { fileToBase64 } from './utils/image';
import { decode, decodeAudioData } from './utils/audio';
import { SpotifyService } from './services/spotifyService';
import AvatarDisplay from './components/AvatarDisplay';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import SettingsModal from './components/PersonalityModal';
import SpotifyAuthModal from './components/SpotifyAuthModal';
import SpotifyPlayer from './components/SpotifyPlayer';
import FileUploadModal from './components/FileUploadModal';
import ImageGenerationModal from './components/ImageGenerationModal';
import SettingsIcon from './components/icons/SettingsIcon';
import SpotifyIcon from './components/icons/SpotifyIcon';
import { CHIZURU_ANIMATIONS } from './constants';
import ExportIcon from './components/icons/ExportIcon';

const COAX_LEVEL_NEEDED = 3;

const App: React.FC = () => {
  const [chatLog, setChatLog] = useState<ChatMessageType[]>([
    { role: 'model', text: "Hello, I'm Chizuru. I'm here to listen. How are you feeling today?" }
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const liveServiceRef = useRef<LiveService | null>(null);
  
  // Settings State
  const [personality, setPersonality] = useState<Personality>('default');
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({ name: 'Zephyr', pitch: 0, speakingRate: 1.0 });
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('default');
  const [internetAccess, setInternetAccess] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // File Upload & Generation State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [uploadModalState, setUploadModalState] = useState<{ isOpen: boolean; file: File | null }>({ isOpen: false, file: null });
  const [isImageGenModalOpen, setIsImageGenModalOpen] = useState(false);

  // Spotify State
  const spotifyServiceRef = useRef<SpotifyService | null>(null);
  const [isSpotifyAuthModalOpen, setIsSpotifyAuthModalOpen] = useState(false);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [spotifyPlayerState, setSpotifyPlayerState] = useState<SpotifyPlayerState | null>(null);

  // Mood State
  const [mood, setMood] = useState<Mood>('normal');
  const [coaxLevel, setCoaxLevel] = useState(0);
  
  // Geolocation State
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // TTS Audio Playback
  const audioContextRef = useRef<AudioContext | null>(null);

  // Refs for modal triggers to restore focus on close
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const spotifyButtonRef = useRef<HTMLButtonElement>(null);
  const fileUploadButtonRef = useRef<HTMLButtonElement>(null);
  const generateImageButtonRef = useRef<HTMLButtonElement>(null);


  // Get user location for Maps Grounding
  useEffect(() => {
    if (internetAccess) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Could not get user location:", error.message);
          setChatLog(prev => [...prev, { role: 'model', text: "(For best map results, please enable location permissions.)"}]);
        }
      );
    }
  }, [internetAccess]);


  // Load mood from localStorage on initial render
  useEffect(() => {
    const savedMood = localStorage.getItem('chizuru_mood') as Mood | null;
    const savedCoaxLevel = localStorage.getItem('chizuru_coax_level');
    if (savedMood) setMood(savedMood);
    if (savedCoaxLevel) setCoaxLevel(parseInt(savedCoaxLevel, 10));
  }, []);

  // Save mood to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chizuru_mood', mood);
    localStorage.setItem('chizuru_coax_level', coaxLevel.toString());
  }, [mood, coaxLevel]);


  const checkWinner = (board: (Player | null)[][]): { winner: Player; line: number[][] } | 'draw' | null => {
    const lines = [
      [[0, 0], [0, 1], [0, 2]], [[1, 0], [1, 1], [1, 2]], [[2, 0], [2, 1], [2, 2]],
      [[0, 0], [1, 0], [2, 0]], [[0, 1], [1, 1], [2, 1]], [[0, 2], [1, 2], [2, 2]],
      [[0, 0], [1, 1], [2, 2]], [[0, 2], [1, 1], [2, 0]],
    ];
    for (const line of lines) {
      const [a, b, c] = line;
      if (board[a[0]][a[1]] && board[a[0]][a[1]] === board[b[0]][b[1]] && board[a[0]][a[1]] === board[c[0]][c[1]]) {
        return { winner: board[a[0]][a[1]]!, line };
      }
    }
    if (board.flat().every(cell => cell !== null)) return 'draw';
    return null;
  };

  const handlePlayerMove = async (messageIndex: number, row: number, col: number) => {
    const newChatLog = [...chatLog];
    const gameMessage = newChatLog[messageIndex];
    if (!gameMessage?.game || gameMessage.game.board[row][col] || gameMessage.game.status !== 'playing') return;

    const game = gameMessage.game;
    game.board[row][col] = 'user';

    let result = checkWinner(game.board);
    if (result) {
        if (result === 'draw') game.status = 'draw';
        else {
            game.status = 'win';
            game.winner = 'user';
        }
        setChatLog(newChatLog);
        return;
    }

    game.isComputerThinking = true;
    setChatLog(newChatLog);

    try {
        const computerMove = await getComputerMove(game.board);
        if (game.board[computerMove.row][computerMove.col] === null) {
            game.board[computerMove.row][computerMove.col] = 'model';
        } else {
            const emptyCell = game.board.flat().findIndex(c => c === null);
            if(emptyCell !== -1) {
              const r = Math.floor(emptyCell / 3);
              const c = emptyCell % 3;
              game.board[r][c] = 'model';
            }
        }

        result = checkWinner(game.board);
        if (result) {
            if (result === 'draw') game.status = 'draw';
            else {
                game.status = 'lose';
                game.winner = 'model';
            }
        }
    } catch (e) {
        console.error("Error getting computer move", e);
        const errorMessage: ChatMessageType = { role: 'model', text: "I'm sorry, I had a problem making my move. Let's try again later." };
        setChatLog(prev => [...prev, errorMessage]);
    } finally {
        game.isComputerThinking = false;
        setChatLog([...newChatLog]);
    }
  };


  const handleResponse = useCallback(async (responseText: string, currentMood: Mood, groundingChunks?: any[]) => {
    const newBotMessage: ChatMessageType = { role: 'model', text: responseText, groundingChunks };
    setChatLog(prevLog => [...prevLog, newBotMessage]);

    try {
      const animationType = await getAnimationType(responseText, personality);
      const url = CHIZURU_ANIMATIONS[animationType] || CHIZURU_ANIMATIONS.default;
      setVideoUrl(url);

      if (currentMood === 'normal' && isSpotifyConnected && spotifyServiceRef.current) {
        const songQuery = await getSongSuggestionForMood(responseText);
        if (songQuery) {
          await spotifyServiceRef.current.searchAndPlay(songQuery);
          setChatLog(prev => [...prev, { role: 'model', text: `(This made me think of a song for you... now playing on Spotify)`}]);
        }
      }

    } catch (e) {
      console.error("Failed to get animation type or song, using default.", e);
      setVideoUrl(CHIZURU_ANIMATIONS.default);
    }
  }, [personality, isSpotifyConnected]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setVideoUrl(null);
    const newUserMessage: ChatMessageType = { role: 'user', text: message };
    setChatLog(prevLog => [...prevLog, newUserMessage]);
    
    try {
      if (mood === 'angry') {
        const isGoodCoax = await evaluateCoaxing(message);
        if (isGoodCoax) {
          const newCoaxLevel = coaxLevel + 1;
          setCoaxLevel(newCoaxLevel);

          if (newCoaxLevel >= COAX_LEVEL_NEEDED) {
            setMood('normal');
            setCoaxLevel(0);
            await handleResponse("...Okay. I guess I forgive you this time. Don't do it again.", 'normal');
          } else {
            await handleResponse("...Hmph.", 'angry');
          }
        } else {
          await handleResponse("Whatever.", 'angry');
        }
      } else { 
        const isUpsetting = await checkIfUpsetting(message);
        if (isUpsetting) {
          setMood('angry');
          setCoaxLevel(0);
          await handleResponse("...I can't believe you said that. I'm not talking to you.", 'angry');
          return;
        }

        const response = await getChatResponse(message, personality, mood, performanceMode, internetAccess, userLocation);
        let responseText = response.text;
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
          let functionHandled = false;
          for (const fc of functionCalls) {
            if ((fc.name === 'playSong' || fc.name === 'findSong') && spotifyServiceRef.current) {
              const { songName, artist } = fc.args;
              const query = artist ? `${songName} ${artist}` : songName;
              await spotifyServiceRef.current.searchAndPlay(query);
              setChatLog(prev => [...prev, { role: 'model', text: `(Now playing '${songName}' on Spotify)` }]);
              functionHandled = true;
            }
            if (fc.name === 'startGame' && fc.args.gameName === 'tic-tac-toe') {
              const initialBoard = Array(3).fill(null).map(() => Array(3).fill(null));
              const gameMessage: ChatMessageType = {
                role: 'model',
                text: "Alright, let's play Tic-Tac-Toe! You go first.",
                game: { gameType: 'tic-tac-toe', board: initialBoard, status: 'playing' }
              };
              setChatLog(prev => [...prev, gameMessage]);
              functionHandled = true;
            }
          }
          if (functionHandled) responseText = '';
        }
        
        if (responseText) {
          await handleResponse(responseText, mood, groundingChunks);
        }
      }

    } catch (error) {
      console.error("Failed to get response from Gemini:", error);
      let errorMessageText: string;
      if (error instanceof Error) {
          errorMessageText = `Error: ${error.message}`;
      } else {
          errorMessageText = "I'm sorry, I'm having a little trouble connecting right now. Please try again in a moment.";
      }
      const errorMessage: ChatMessageType = { role: 'model', text: errorMessageText };
      setChatLog(prevLog => [...prevLog, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [handleResponse, personality, mood, coaxLevel, performanceMode, internetAccess, userLocation]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadModalState({ isOpen: true, file });
    }
    event.target.value = '';
  };

  const handleAnalyzeMedia = async (file: File, prompt: string) => {
    setUploadModalState({ isOpen: false, file: null });
    setIsProcessingMedia(true);
    setProcessingStatus(`Analyzing ${file.type.startsWith('video') ? 'video' : 'image'}...`);
    setChatLog(prev => [...prev, {role: 'user', text: `(Attached a file) ${prompt}`}]);

    try {
      const base64Data = await fileToBase64(file);
      const filePart = { data: base64Data, mimeType: file.type };
      const responseText = await analyzeMedia(prompt, filePart);
      await handleResponse(responseText, mood);
    } catch (error) {
        console.error("Media analysis failed:", error);
        const errorMessage: ChatMessageType = { role: 'model', text: `Sorry, I couldn't analyze that file. ${error instanceof Error ? error.message : ''}` };
        setChatLog(prev => [...prev, errorMessage]);
    } finally {
        setIsProcessingMedia(false);
        setProcessingStatus('');
    }
  };

  const handleGenerateVideo = async (file: File, prompt: string, aspectRatio: '16:9' | '9:16') => {
    setUploadModalState({ isOpen: false, file: null });
    setIsProcessingMedia(true);
    setProcessingStatus("Preparing your video request...");
    setChatLog(prev => [...prev, {role: 'user', text: `(Attached an image to generate video) ${prompt}`}]);

    try {
        let hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            setChatLog(prev => [...prev, {
                role: 'model', text: "Video generation requires an API key with billing enabled. Please select one to continue. [Learn more](https://ai.google.dev/gemini-api/docs/billing)"
            }]);
            await window.aistudio.openSelectKey();
        }

        const imageBase64 = await fileToBase64(file);
        const imagePart = { data: imageBase64, mimeType: file.type };

        const generatedVideoUrl = await generateVideo(imagePart, prompt, aspectRatio, (status) => setProcessingStatus(status));

        const videoMessage: ChatMessageType = {
            role: 'model', text: "Here is the video I generated for you!", videoUrl: generatedVideoUrl,
        };
        setChatLog(prev => [...prev, videoMessage]);

    } catch (error) {
        console.error("Video generation failed:", error);
        let errorMessageText = "Sorry, I couldn't generate the video. Please try again.";
        if (error instanceof Error && error.message.includes("not found")) {
              errorMessageText = "It seems there's an issue with the selected API key. Please ensure it's valid and has billing enabled.";
        }
        const errorMessage: ChatMessageType = { role: 'model', text: errorMessageText };
        setChatLog(prev => [...prev, errorMessage]);
    } finally {
        setIsProcessingMedia(false);
        setProcessingStatus('');
    }
  };

  const handleGenerateImage = async (prompt: string, aspectRatio: string) => {
    setIsImageGenModalOpen(false);
    setIsProcessingMedia(true);
    setProcessingStatus("Generating your image...");
    setChatLog(prev => [...prev, {role: 'user', text: `(Generate image) ${prompt}`}]);
    
    try {
      const base64Image = await generateImage(prompt, aspectRatio);
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;
      const imageMessage: ChatMessageType = {
        role: 'model', text: "Here is the image I created for you:", imageUrl: imageUrl
      };
      setChatLog(prev => [...prev, imageMessage]);
    } catch (error) {
      console.error("Image generation failed:", error);
      const errorMessage: ChatMessageType = { role: 'model', text: `Sorry, I couldn't create that image. ${error instanceof Error ? error.message : ''}` };
      setChatLog(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessingMedia(false);
      setProcessingStatus('');
    }
  };


  const handleToggleVoice = useCallback(async () => {
    if (isVoiceActive) {
      liveServiceRef.current?.disconnect();
      liveServiceRef.current = null;
      setIsVoiceActive(false);
      setIsConnecting(false);
    } else {
      setIsConnecting(true);
      liveServiceRef.current = new LiveService();
      await liveServiceRef.current.connect({
        onOpen: () => {
          setIsConnecting(false);
          setIsVoiceActive(true);
          setChatLog(prev => [...prev, {role: 'model', text: "I'm listening..."}]);
        },
        onTranscription: async (userInput, modelOutput) => {
          setVideoUrl(null);
          const userMessage: ChatMessageType = { role: 'user', text: userInput };
          
          if (userInput.trim()) {
             setChatLog(prevLog => [...prevLog, userMessage]);
          }

          if (modelOutput.trim()) {
            await handleResponse(modelOutput, 'normal');
          }
        },
        onClose: () => {
          setIsVoiceActive(false);
          setIsConnecting(false);
        },
        // FIX: The error object is of type 'unknown' and cannot be directly used in a template literal.
        // This change adds type checking to ensure the error is handled correctly as a string.
        onError: (error) => {
          let message = 'An unknown voice chat error occurred.';
          if (typeof error === 'string') {
            message = error;
          } else if (error instanceof Error) {
            message = error.message;
          }
          const errorMessage: ChatMessageType = { role: 'model', text: `Voice chat error: ${message}` };
          setChatLog(prevLog => [...prevLog, errorMessage]);
          setIsVoiceActive(false);
          setIsConnecting(false);
        }
      }, personality, voiceConfig);
    }
  }, [isVoiceActive, handleResponse, personality, voiceConfig]);
  
  const handlePlayTTS = async (text: string) => {
    try {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }
      const base64Audio = await generateSpeech(text, voiceConfig);
      const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (error) {
      console.error("TTS Error:", error);
      setChatLog(prev => [...prev, {role: 'model', text: `(Sorry, I couldn't speak right now.)`}]);
    }
  };

  const handleSaveSettings = (settings: { personality: Personality; voice: VoiceConfig; performanceMode: PerformanceMode; internetAccess: boolean; }) => {
    setPersonality(settings.personality);
    setVoiceConfig(settings.voice);
    setPerformanceMode(settings.performanceMode);
    setInternetAccess(settings.internetAccess);
    setIsSettingsModalOpen(false);
    
    setChatLog(prev => [...prev, { role: 'model', text: `(Settings updated.)` }]);
  };

  const handleSaveSpotifyToken = (token: string) => {
    if (!token.trim()) {
      setChatLog(prev => [...prev, { role: 'model', text: `(Spotify connection failed: Token is empty.)`}]);
      return;
    }
    spotifyServiceRef.current = new SpotifyService(token);
    spotifyServiceRef.current.initPlayer({
      onReady: () => {
        setIsSpotifyConnected(true);
        setIsSpotifyAuthModalOpen(false);
        setChatLog(prev => [...prev, { role: 'model', text: `(Spotify connected successfully!)`}]);
      },
      onStateChange: (state) => setSpotifyPlayerState(state),
      onError: (errorType, message) => {
        console.error(`Spotify Error [${errorType}]:`, message);
        setIsSpotifyConnected(false);
        setChatLog(prev => [...prev, { role: 'model', text: `(Spotify Error: ${message})`}]);
        if (errorType === 'authentication_error') {
            setIsSpotifyAuthModalOpen(true);
        }
      }
    });
  };
  
  const handleExportChat = useCallback(() => {
    if (chatLog.length === 0) return;
    const formattedChat = chatLog.map(message => `${message.role === 'user' ? 'You' : 'Chizuru'}: ${message.text}`).join('\n\n');
    const blob = new Blob([formattedChat], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chizuru-chat-history-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [chatLog]);

  // Accessibility: Handlers to restore focus after modals close
  const handleCloseSettingsModal = () => {
    setIsSettingsModalOpen(false);
    settingsButtonRef.current?.focus();
  };
  const handleCloseSpotifyModal = () => {
    setIsSpotifyAuthModalOpen(false);
    spotifyButtonRef.current?.focus();
  };
  const handleCloseFileUploadModal = () => {
    setUploadModalState({ isOpen: false, file: null });
    fileUploadButtonRef.current?.focus();
  };
  const handleCloseImageGenModal = () => {
    setIsImageGenModalOpen(false);
    generateImageButtonRef.current?.focus();
  };


  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 relative">
        <div className="w-full max-w-6xl h-[90vh] bg-gray-800 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-1/2 lg:w-2/5 p-6 border-b-2 md:border-b-0 md:border-r-2 border-gray-700 flex flex-col justify-center items-center">
            <AvatarDisplay videoUrl={videoUrl} isListening={isVoiceActive} mood={mood} />
          </div>
          <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col h-full">
            <header className="p-4 border-b-2 border-gray-700 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-teal-400">Chizuru: Your Companion</h1>
                <p className="text-xs text-gray-500 mt-1">Disclaimer: Chizuru is an AI companion and not a replacement for professional mental health support.</p>
              </div>
              <div className="flex items-center space-x-2">
                <button ref={spotifyButtonRef} onClick={() => setIsSpotifyAuthModalOpen(true)} className="p-2 rounded-full hover:bg-gray-700 transition-colors group" aria-label="Connect Spotify">
                  <SpotifyIcon isConnected={isSpotifyConnected} />
                </button>
                <button onClick={handleExportChat} className="p-2 rounded-full hover:bg-gray-700 transition-colors group" aria-label="Export chat history">
                  <ExportIcon />
                </button>
                <button ref={settingsButtonRef} onClick={() => setIsSettingsModalOpen(true)} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label="Change personality">
                  <SettingsIcon />
                </button>
              </div>
            </header>
            <ChatWindow 
              messages={chatLog} 
              isLoading={isLoading} 
              isProcessingMedia={isProcessingMedia}
              processingStatus={processingStatus}
              onPlayerMove={handlePlayerMove}
              onPlayTTS={handlePlayTTS}
            />
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading || isProcessingMedia}
              isVoiceActive={isVoiceActive}
              isConnecting={isConnecting}
              onToggleVoice={handleToggleVoice}
              onFileUpload={() => fileInputRef.current?.click()}
              onGenerateImage={() => setIsImageGenModalOpen(true)}
              fileUploadButtonRef={fileUploadButtonRef}
              generateImageButtonRef={generateImageButtonRef}
            />
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" aria-label="Upload file" title="Upload file" />
          </div>
        </div>
        {isSpotifyConnected && spotifyServiceRef.current && (
           <SpotifyPlayer
             playerState={spotifyPlayerState}
             onTogglePlay={() => spotifyServiceRef.current?.togglePlay()}
             onNext={() => spotifyServiceRef.current?.nextTrack()}
             onPrevious={() => spotifyServiceRef.current?.previousTrack()}
           />
        )}
      </div>
      
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={handleCloseSettingsModal}
        onSave={handleSaveSettings}
        currentPersonality={personality}
        currentVoice={voiceConfig}
        currentPerformanceMode={performanceMode}
        currentInternetAccess={internetAccess}
      />

      <SpotifyAuthModal
        isOpen={isSpotifyAuthModalOpen}
        onClose={handleCloseSpotifyModal}
        onSave={handleSaveSpotifyToken}
      />

      <FileUploadModal
        isOpen={uploadModalState.isOpen}
        file={uploadModalState.file}
        onClose={handleCloseFileUploadModal}
        onAnalyze={handleAnalyzeMedia}
        onGenerateVideo={handleGenerateVideo}
      />

      <ImageGenerationModal
        isOpen={isImageGenModalOpen}
        onClose={handleCloseImageGenModal}
        onGenerate={handleGenerateImage}
      />
    </>
  );
};

export default App;
