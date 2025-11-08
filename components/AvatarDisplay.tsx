import React, { useState, useEffect, useRef } from 'react';
import { Mood } from '../types';

interface AvatarDisplayProps {
  videoUrl: string | null;
  isListening?: boolean;
  mood?: Mood;
}

const MAX_RETRIES = 2;
const TRANSITION_DURATION_MS = 300;
const MAX_ROTATION_DEG = 7;

const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ videoUrl, isListening, mood = 'normal' }) => {
  // 1. Renamed and updated the path. Assumes 'avatar.mp4' is in your /public folder.
  const DEFAULT_AVATAR_VIDEO_URL = '/avatar.mp4'; 
  
  const [activeVideo, setActiveVideo] = useState<string | null>(videoUrl);
  const [isFading, setIsFading] = useState<boolean>(false);
  const [hasError, setHasError] = useState(false);
  const [transformStyle, setTransformStyle] = useState({});
  
  const retryCountRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (videoUrl === activeVideo) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsFading(true);
    
    timeoutRef.current = window.setTimeout(() => {
      setActiveVideo(videoUrl);
      setHasError(false);
      retryCountRef.current = 0;
      setIsFading(false);
    }, TRANSITION_DURATION_MS);

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [videoUrl, activeVideo]);

  const handleVideoEnd = () => {
    setIsFading(true);
    timeoutRef.current = window.setTimeout(() => {
      setActiveVideo(null); // This will trigger the fallback to the default video
      setIsFading(false);
    }, TRANSITION_DURATION_MS);
  };
  
  const handleVideoError = () => {
    if (retryCountRef.current < MAX_RETRIES) {
      retryCountRef.current += 1;
      const videoElement = videoRef.current;
      if (videoElement) {
        setTimeout(() => videoElement.load(), 500 * retryCountRef.current);
      }
    } else {
      console.error(`Failed to load video after ${MAX_RETRIES} retries:`, activeVideo);
      setHasError(true); // This will also trigger the fallback
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const { width, height, left, top } = container.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    const xPercent = (x / width - 0.5) * 2;
    const yPercent = (y / height - 0.5) * 2;

    const rotateY = xPercent * MAX_ROTATION_DEG;
    const rotateX = -yPercent * MAX_ROTATION_DEG;

    setTransformStyle({
      transform: `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale3d(1.02, 1.02, 1.02)`,
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle({
      transform: 'perspective(1000px) rotateY(0) rotateX(0) scale3d(1, 1, 1)',
    });
  };

  const getBorderColor = () => {
    if (mood === 'angry') return 'border-fuchsia-500/60';
    if (isListening) return 'border-green-500/80';
    return 'border-teal-500/50';
  };

  const getAvatarStatus = () => {
    if (mood === 'angry') return "Chizuru is angry.";
    if (isListening) return "Chizuru is listening.";
    return "Chizuru is waiting for your message.";
  };

  const animation = isListening || mood === 'angry' ? 'animate-pulse' : '';
  const showVideo = activeVideo && !hasError;

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full max-w-md aspect-square rounded-full overflow-hidden shadow-lg border-4 ${getBorderColor()} ${animation} transition-all duration-500`}
      style={{ transformStyle: 'preserve-3d' }}
    >
       <span role="status" className="sr-only">{getAvatarStatus()}</span>
      <div className="w-full h-full transition-transform duration-200 ease-out" style={transformStyle}>
        {showVideo ? (
          // This is the DYNAMIC video (from props)
          <video 
            ref={videoRef}
            key={activeVideo} 
            src={activeVideo!} 
            autoPlay 
            muted 
            playsInline
            onEnded={handleVideoEnd}
            onError={handleVideoError}
            className={`w-full h-full object-cover ${isFading ? 'fade-out' : 'fade-in'}`}
          />
        ) : (
          // 2. This is now the DEFAULT video (the looping avatar)
          <video
            src={DEFAULT_AVATAR_VIDEO_URL}
            autoPlay
            muted
            loop
            playsInline
            className={`w-full h-full object-cover ${isFading && !showVideo ? 'fade-out' : 'fade-in'}`}
          />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-full"></div>
    </div>
  );
};

export default AvatarDisplay;