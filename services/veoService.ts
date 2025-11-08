import { GoogleGenAI } from "@google/genai";

const PROGRESS_MESSAGES = [
    "Warming up the digital canvas...",
    "Mixing the pixels and code...",
    "Choreographing the animation...",
    "Rendering the main sequence...",
    "Adding the final touches, this can take a moment...",
    "Almost ready to debut!",
];

export async function generateVideo(
    image: { data: string; mimeType: string },
    prompt: string,
    aspectRatio: '16:9' | '9:16',
    onProgress: (status: string) => void
): Promise<string> {
    
    // Create a new instance for each call to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    onProgress(PROGRESS_MESSAGES[0]);

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
            imageBytes: image.data,
            mimeType: image.mimeType,
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    });

    let progressIndex = 1;
    while (!operation.done) {
        onProgress(PROGRESS_MESSAGES[progressIndex % PROGRESS_MESSAGES.length]);
        progressIndex++;
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        try {
            operation = await ai.operations.getVideosOperation({ operation: operation });
        } catch (error) {
            console.error("Error polling video operation:", error);
            // Rethrow to be caught by the caller in App.tsx
            throw new Error("Failed while checking video status. The process may have been interrupted.");
        }
    }

    onProgress("Finalizing video...");
    
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was found.");
    }

    // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error("Failed to download the generated video file.");
    }
    
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
}
