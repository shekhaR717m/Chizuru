
# Chizuru: Your Multimodal AI Companion

Chizuru is an interactive, web-based AI companion designed to provide a safe, engaging, and versatile conversational experience. Powered by Google's latest Gemini models, she listens, responds with text, and shows emotions through "talking head" style video animations. She is a fully multimodal assistant, capable of understanding text, voice, images, and video, and can generate responses in text, voice, and images.

![Chizuru Screenshot](https://i.ibb.co/cy0d0sF/chizuru-screenshot.png)

---

## ✨ Features

- **Advanced Conversational AI**: Engage in natural, empathetic conversations. Chizuru can adapt her personality, remember her emotional state, and even get upset and require coaxing.
- **Multimodal Understanding & Generation**:
    - **Voice Chat**: Have real-time, spoken conversations. The app uses the Gemini Live API for instant audio transcription and spoken responses.
    - **Image & Video Analysis**: Upload an image or video and ask Chizuru questions about its content.
    - **Image Generation**: Create high-quality, original images from text prompts using the Imagen model.
    - **Text-to-Speech (TTS)**: Have any of Chizuru's text responses read aloud with a natural voice.
    - **AI Video Generation**: Upload a starting image and provide a text prompt to generate a short, animated video using Google's Veo model.
- **Internet-Connected Knowledge**:
    - **Search & Maps Grounding**: An "Internet Access" mode connects Chizuru to Google Search and Maps, allowing her to answer questions about current events, find real-world places, and provide up-to-date information, citing her sources.
- **Customizable Experience**:
    - **Performance Modes**: Choose the right AI "brain" for your needs: `Lite` for speed, `Default` for balance, or `Pro` for complex, creative tasks.
    - **Personalities & Voices**: Select a predefined personality (e.g., Cheerful, Shy) or write your own custom instructions for the AI. Her voice can also be customized.
- **Entertainment & Utility**:
    - **Spotify Integration**: Connect your Spotify account to let Chizuru play music that matches the mood of the conversation.
    - **Interactive Games**: Challenge Chizuru to a game of Tic-Tac-Toe directly within the chat.
    - **Chat History Export**: Download your conversation history as a `.txt` file.

---

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **AI & Machine Learning (Google Gemini Suite)**:
    - **Core Chat**: `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.5-pro`
    - **Real-time Voice**: `gemini-2.5-flash-native-audio-preview-09-2025`
    - **Image Generation**: `imagen-4.0-generate-001`
    - **Text-to-Speech**: `gemini-2.5-flash-preview-tts`
    - **Video Generation**: `veo-3.1-fast-generate-preview`
    - **Grounding**: Google Search and Google Maps tools
- **Services**:
    - **Music**: Spotify Web Playback SDK
- **Deployment**: Can be deployed as a static site on services like Vercel or Netlify.

---

## 🚀 Getting Started & Deployment Guide

Follow these instructions to set up, run, and prepare the project for a production-level deployment.

### Prerequisites

- **Node.js**: v18 or later.
- **Visual Studio Code**: Recommended code editor.
- **Google Account**: For accessing Google AI Studio and Google Cloud Platform.

### Step 1: Local Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/ai-gf-chat.git
    cd ai-gf-chat
    ```

2.  **Open in VS Code & Install Dependencies**
    ```bash
    code .
    npm install
    ```

### Step 2: API Key Configuration

For a full, production-like setup, you need to configure API access through a Google Cloud Platform (GCP) project. This is more robust and scalable than using standalone Google AI Studio keys.

1.  **Create a Google Cloud Project**:
    - Go to the [Google Cloud Console](https://console.cloud.google.com/).
    - Create a new project (e.g., "Chizuru-AI-Companion").
    - **Enable Billing** for the project. This is required for many of the advanced APIs.

2.  **Enable Required APIs**:
    - In your new project, navigate to the "APIs & Services" > "Library".
    - Search for and **enable** the following APIs:
        - **Vertex AI API**: This is the main API for accessing Gemini models, Imagen, Veo, and more in a production environment.
        - *(Optional but Recommended)* If you plan to heavily use Search/Maps grounding, you may need to enable specific APIs like the "Places API" for full functionality, though the Gemini tool integration handles much of this automatically.

3.  **Create an API Key**:
    - Navigate to "APIs & Services" > "Credentials".
    - Click "+ CREATE CREDENTIALS" and select "API key".
    - **IMPORTANT**: Restrict your API key to prevent unauthorized use. Click on the new key and under "API restrictions", select "Restrict key" and choose the **Vertex AI API**. Under "Application restrictions", select "HTTP referrers" and add your website's domain (e.g., `your-app-name.vercel.app`) and `localhost:3000` for local development.
    - Copy the generated API key.

4.  **Set Up Environment Variables**:
    - In the root of your local project, create a file named `.env`.
    - Add your restricted API key to it:
    ```
    API_KEY=YOUR_GCP_API_KEY
    ```
    - The application is already configured to use this variable.

### Step 3: Running Locally

- In the VS Code terminal, start the development server:
  ```bash
  npm run start
  ```
- The app will open at `http://localhost:3000`.

### Step 4: Connecting Spotify

To use the Spotify integration, you need a temporary developer token.

1.  Go to the [Spotify Developer Console](https://developer.spotify.com/console/get-current-user-saved-tracks/).
2.  Click **"Get Token"**.
3.  Check the following scopes: `streaming`, `user-read-playback-state`, `user-modify-playback-state`.
4.  Copy the generated **OAuth Token**.
5.  In the Chizuru web app, click the Spotify icon and paste the token.

### Step 5: Deployment

This project is a client-side React application and can be easily deployed to static hosting providers.

1.  **Choose a Provider**: Vercel, Netlify, and Firebase Hosting are excellent choices.
2.  **Connect Your Git Repository**: Link the provider to the GitHub repository containing your project.
3.  **Configure Build Settings**:
    - **Build Command**: `npm run build`
    - **Output Directory**: `dist` (or `build`, depending on your setup)
4.  **Add Environment Variable**:
    - In your hosting provider's project settings, add the `API_KEY` environment variable and paste your restricted GCP API key as its value. **Do not** commit your `.env` file to your repository.
5.  **Deploy**: Trigger a deployment. Your app will be live at the provided URL. Remember to add this new URL to your API key's HTTP referrer restrictions in GCP.

---

### Backend & Database Architecture Note

This project currently operates as a **client-side application**. Data persistence (like Chizuru's mood) is handled by the browser's `localStorage`.

For a full-scale production application, you would typically build a dedicated backend (e.g., using Node.js/Express on Cloud Run or Firebase Functions). This backend would securely manage API keys, handle user authentication, and connect to a cloud database (like MongoDB Atlas or Firestore) to store user-specific chat histories and settings across different devices.
