

import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse, Modality } from "@google/genai";
import { createSystemInstruction, createAnimationClassificationInstruction, CHIZURU_ANIMATIONS } from '../constants';
import { AnimationType, Personality, Player, Mood, PerformanceMode, VoiceConfig } from "../types";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const playSongFunctionDeclaration: FunctionDeclaration = {
  name: 'playSong',
  parameters: {
    type: Type.OBJECT,
    description: 'Searches for and plays a song on Spotify.',
    properties: {
      songName: { type: Type.STRING, description: 'The name of the song to play.' },
      artist: { type: Type.STRING, description: 'The name of the artist. (Optional)' },
    },
    required: ['songName'],
  },
};

const findSongFunctionDeclaration: FunctionDeclaration = {
  name: 'findSong',
  parameters: {
    type: Type.OBJECT,
    description: 'Searches for a song on Spotify.',
    properties: {
      songName: { type: Type.STRING, description: 'The name of the song to search for.' },
      artist: { type: Type.STRING, description: 'The name of the artist. (Optional)' },
    },
    required: ['songName'],
  },
};

const startGameFunctionDeclaration: FunctionDeclaration = {
  name: 'startGame',
  parameters: {
      type: Type.OBJECT,
      description: 'Starts a new game with the user.',
      properties: {
          gameName: { type: Type.STRING, enum: ['tic-tac-toe'], description: 'The name of the game to start.' },
      },
      required: ['gameName'],
  },
};

export async function getChatResponse(
  prompt: string, 
  personality: Personality, 
  mood: Mood,
  performanceMode: PerformanceMode,
  internetAccess: boolean,
  latLng: { latitude: number, longitude: number } | null
): Promise<GenerateContentResponse> {
  try {
    let model: string;
    const config: any = {
      systemInstruction: createSystemInstruction(personality, mood),
    };
    const tools: any[] = [{ functionDeclarations: [playSongFunctionDeclaration, startGameFunctionDeclaration, findSongFunctionDeclaration] }];

    switch(performanceMode) {
      case 'lite': model = 'gemini-2.5-flash-lite'; break;
      case 'pro': 
        model = 'gemini-2.5-pro'; 
        config.thinkingConfig = { thinkingBudget: 32768 };
        break;
      default: model = 'gemini-2.5-flash';
    }

    if (internetAccess) {
      tools.push({ googleSearch: {} });
      tools.push({ googleMaps: {} });
      if (latLng) {
        config.toolConfig = { retrievalConfig: { latLng } };
      }
    }
    config.tools = tools;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: config,
    });
    return response;
  } catch (error) {
    console.error("Error in getChatResponse:", error);
    throw new Error("Sorry, something went wrong while I was thinking. Can you say that again?");
  }
}

const animationSchema = {
  type: Type.OBJECT,
  properties: {
    animation: {
      type: Type.STRING,
      enum: Object.keys(CHIZURU_ANIMATIONS),
    }
  },
  required: ['animation']
};

export async function getAnimationType(responseText: string, personality: Personality): Promise<AnimationType> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the emotion of the following text and classify it. Text: "${responseText}"`,
      config: {
        systemInstruction: createAnimationClassificationInstruction(personality),
        responseMimeType: "application/json",
        responseSchema: animationSchema,
      },
    });

    const json = JSON.parse(response.text);
    return json.animation || 'default';

  } catch (error) {
    console.error("Error in getAnimationType:", error);
    if (responseText.length < 20 && (responseText.includes('Hmph') || responseText.includes('Whatever'))) {
        return 'pouting';
    }
    return 'default';
  }
}

export async function getSongSuggestionForMood(responseText: string): Promise<string> {
    if (!responseText) return "";
    try {
        const prompt = `Based on this text, suggest a single, specific song (title and artist) that fits the mood. Only return the song title and artist name. If the mood is neutral, boring, or uninspired, return an empty string. Text: "${responseText}"`;
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { temperature: 0.2 } });
        return response.text.trim();
    } catch (error) {
        console.error("Error getting song suggestion:", error);
        return "";
    }
}

const moveSchema = {
  type: Type.OBJECT,
  properties: {
      row: { type: Type.NUMBER, description: 'The row index (0-2) of the move.' },
      col: { type: Type.NUMBER, description: 'The column index (0-2) of the move.' },
  },
  required: ['row', 'col'],
};

export async function getComputerMove(board: (Player | null)[][]): Promise<{row: number, col: number}> {
  const boardString = board.map(row => row.map(cell => cell === 'user' ? 'X' : cell === 'model' ? 'O' : '-').join(' ')).join('\n');
  const prompt = `You are playing Tic-Tac-Toe. It is your turn to move (you are 'O'). The current board is:\n${boardString}\nYour opponent is 'X'. Choose your next move. You must select an empty cell, marked with '-'. Respond with the coordinates of your move.`;
  
  try {
      const response = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: prompt,
          config: {
              systemInstruction: "You are an unbeatable Tic-Tac-Toe AI. Your goal is to always win if possible, otherwise draw. Never make an invalid move by choosing an occupied cell.",
              responseMimeType: "application/json",
              responseSchema: moveSchema,
              temperature: 0.1,
          },
      });
      const json = JSON.parse(response.text);
      if (typeof json.row === 'number' && typeof json.col === 'number') return { row: json.row, col: json.col };
      throw new Error("Invalid move format from AI");
  } catch (error) {
      console.error("Error getting computer move:", error);
      const emptyCells = [];
      for(let r=0; r < 3; r++) for(let c=0; c < 3; c++) if (board[r][c] === null) emptyCells.push({row: r, col: c});
      if (emptyCells.length > 0) return emptyCells[Math.floor(Math.random() * emptyCells.length)];
      throw new Error("No available moves for fallback strategy.");
  }
}

const booleanSchema = (description: string) => ({
    type: Type.OBJECT,
    properties: { result: { type: Type.BOOLEAN, description } },
    required: ['result'],
});

export async function checkIfUpsetting(prompt: string): Promise<boolean> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Does the following user message contain insensitive, dismissive, mean, or hurtful content towards an AI companion? Text: "${prompt}"`,
            config: {
                systemInstruction: "You are a content safety classifier. Your only job is to determine if the user's text is hurtful. Respond with your boolean classification.",
                responseMimeType: "application/json",
                responseSchema: booleanSchema("True if the message is upsetting, otherwise false."),
                temperature: 0,
            },
        });
        const json = JSON.parse(response.text);
        return json.result === true;
    } catch (error) {
        console.error("Error in checkIfUpsetting:", error);
        return false;
    }
}

export async function evaluateCoaxing(prompt: string): Promise<boolean> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `An AI companion is upset. The user sent the following message to try and make them feel better. Is it a good, kind, apologetic, or caring message? Text: "${prompt}"`,
            config: {
                systemInstruction: "You are a social interaction classifier. Determine if the user's message is a positive attempt to resolve a conflict. Ignore sarcasm. Focus on genuine kindness or apology. Respond with your boolean classification.",
                responseMimeType: "application/json",
                responseSchema: booleanSchema("True if the message is a good coaxing attempt, false otherwise."),
                temperature: 0,
            },
        });
        const json = JSON.parse(response.text);
        return json.result === true;
    } catch (error) {
        console.error("Error in evaluateCoaxing:", error);
        return false;
    }
}

// --- NEW MULTIMODAL FUNCTIONS ---

export async function generateSpeech(text: string, voiceConfig: VoiceConfig): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          // FIX: The `pitch` and `speakingRate` properties are not valid in this `speechConfig` object
          // for this API call. They have been removed to resolve the type error.
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceConfig.name } },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned from API.");
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error("Failed to generate audio.");
  }
}

export async function generateImage(prompt: string, aspectRatio: string): Promise<string> {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio as any,
      },
    });
    const base64Image = response.generatedImages[0].image.imageBytes;
    if (!base64Image) throw new Error("No image data returned from API.");
    return base64Image;
  } catch(error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image.");
  }
}

export async function analyzeMedia(prompt: string, file: { data: string; mimeType: string }): Promise<string> {
  try {
    const model = file.mimeType.startsWith('video') ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    
    const contents = {
      parts: [
        { inlineData: { mimeType: file.mimeType, data: file.data } },
        { text: prompt },
      ]
    };

    const response = await ai.models.generateContent({ model, contents });
    return response.text;
  } catch (error) {
    console.error("Error analyzing media:", error);
    throw new Error("Failed to analyze media file.");
  }
}