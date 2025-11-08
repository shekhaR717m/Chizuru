import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";
import { createSystemInstruction } from '../constants';
import { decode, encode, decodeAudioData } from '../utils/audio';
import { Personality, VoiceConfig } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

type LiveServiceCallbacks = {
  onOpen: () => void;
  onTranscription: (userInput: string, modelOutput: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
};

export class LiveService {
  private ai: GoogleGenAI | null = null;
  private session: any | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private callbacks: LiveServiceCallbacks | null = null;

  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();

  private currentInputTranscription = '';
  private currentOutputTranscription = '';

  constructor() {
    // DO NOT instantiate the AI client here. It will become stale if the API key changes.
  }

  public async connect(callbacks: LiveServiceCallbacks, personality: Personality, voiceConfig: VoiceConfig): Promise<void> {
    this.callbacks = callbacks;
    try {
      // CRITICAL FIX: Instantiate the client here to ensure the latest API key is used.
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioContext = new AudioContext({ sampleRate: 16000 });
      this.outputAudioContext = new AudioContext({ sampleRate: 24000 });
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            this.callbacks?.onOpen();
            this.startMicrophone(sessionPromise);
          },
          onmessage: (message: LiveServerMessage) => this.handleMessage(message),
          onerror: (e: ErrorEvent) => {
            console.error("Live session error:", e);
            this.callbacks?.onError("A connection error occurred.");
            this.disconnect();
          },
          onclose: () => this.callbacks?.onClose(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            // FIX: Removed `pitch` and `speakingRate` as they are not supported in this configuration
            // and were causing the "Script error."
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceConfig.name },
            },
          },
          systemInstruction: createSystemInstruction(personality),
        },
      });

      this.session = await sessionPromise;
    } catch (error) {
      console.error("Failed to connect to Live service:", error);
      this.callbacks?.onError("Could not start voice session. Check microphone permissions.");
    }
  }

  private startMicrophone(sessionPromise: Promise<any>) {
    if (!this.inputAudioContext || !this.mediaStream) return;

    this.source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
    this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    this.scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
      const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
      const l = inputData.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
        int16[i] = inputData[i] * 32768;
      }
      const pcmBlob: Blob = {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
      };
      
      sessionPromise.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    this.source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioContext.destination);
  }

  private handleMessage(message: LiveServerMessage) {
    if (message.serverContent?.inputTranscription) {
      this.currentInputTranscription += message.serverContent.inputTranscription.text;
    }
    if (message.serverContent?.outputTranscription) {
      this.currentOutputTranscription += message.serverContent.outputTranscription.text;
    }
    if (message.serverContent?.turnComplete && this.callbacks) {
      this.callbacks.onTranscription(this.currentInputTranscription, this.currentOutputTranscription);
      this.currentInputTranscription = '';
      this.currentOutputTranscription = '';
    }
    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (base64Audio) this.playAudio(base64Audio);
    if (message.serverContent?.interrupted) this.stopAllAudio();
  }

  private async playAudio(base64Audio: string) {
    if (!this.outputAudioContext) return;
    this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);

    const audioBuffer = await decodeAudioData(decode(base64Audio), this.outputAudioContext, 24000, 1);
    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAudioContext.destination);
    source.addEventListener('ended', () => this.sources.delete(source));

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.sources.add(source);
  }

  private stopAllAudio() {
    this.sources.forEach(source => {
      source.stop();
      this.sources.delete(source);
    });
    this.nextStartTime = 0;
  }
  
  public disconnect() {
    this.session?.close();
    this.session = null;
    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.mediaStream = null;
    this.source?.disconnect();
    this.scriptProcessor?.disconnect();
    this.source = null;
    this.scriptProcessor = null;
    this.inputAudioContext?.close().catch(console.error);
    this.outputAudioContext?.close().catch(console.error);
    this.inputAudioContext = null;
    this.outputAudioContext = null;
    this.stopAllAudio();
    this.callbacks?.onClose();
  }
}