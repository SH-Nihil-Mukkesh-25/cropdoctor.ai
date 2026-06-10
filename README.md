# CropDoctor.ai

CropDoctor.ai is an intelligent cross-platform application designed to assist farmers and agricultural enthusiasts in diagnosing crop diseases. Built using React Native and Expo, the application leverages cutting-edge AI features—specifically focusing on voice and localized language support powered by **Sarvam AI**. 

## 🌟 Key Features

- **Crop Disease Analysis:** Capture or upload photos of plants for automated disease detection using your device's camera.
- **Multilingual Support:** Communicate with the app and receive diagnoses in local languages.
- **AI Voice Integration (Powered by Sarvam AI):**
  - **Speech-to-Text (STT):** Speak directly to the app! Utilizes Sarvam's `saaras:v3` model to accurately transcribe voice queries and commands.
  - **Text-to-Speech (TTS):** Receive audible diagnoses and instructions. Employs Sarvam's `bulbul:v3` model (featuring the `ritu` voice profile) for natural-sounding speech generation.
  - **Translation:** Seamlessly translates English content to localized languages using Sarvam's `mayura:v1` model, ensuring accessibility for farmers across different regions.

## 🛠 Tech Stack

### Core Technologies
- **Frontend Framework:** React Native, Expo (`~54.0.33`)
- **Routing:** Expo Router
- **Web Support:** React Native Web
- **Language:** TypeScript

### Backend & AI Services
- **Database / Backend-as-a-Service:** Supabase (`@supabase/supabase-js`)
- **AI Voice & Translation:** Sarvam AI API

### Key Libraries
- **Media & Hardware:** `expo-av` (Audio recording and playback), `expo-image-picker` (Camera and gallery access)
- **Networking:** Axios, native Fetch API
- **State & Storage:** React hooks, `@react-native-async-storage/async-storage`

## 🚀 Installation & Setup

Follow these steps to set up the project locally for development.

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Expo CLI
- A Sarvam AI API Key
- Supabase Account (for backend setup)

### 1. Clone the repository

If you haven't already, navigate to the project directory:

```bash
git clone <repository-url>
cd cropdoctor.ai
```

### 2. Install Dependencies

Install the required npm packages:

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory and configure your environment variables. The app requires the Sarvam API key to enable the core voice features.

```env
# Sarvam AI Key for STT, TTS, and Translation services
EXPO_PUBLIC_SARVAM_API_KEY=your_sarvam_api_key_here

# Supabase Keys
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Application

Start the Expo development server:

```bash
npm start
```

From the Expo CLI interface, you can run the app on your preferred platform:
- Press `a` to run on Android Emulator.
- Press `i` to run on iOS Simulator.
- Press `w` to run on Web Browser.

To run on a physical device, download the **Expo Go** app on your iOS or Android device and scan the QR code displayed in your terminal.

## 🧠 Sarvam AI Voice Integration Architecture

The accessibility and local language features of CropDoctor.ai are driven by dedicated services mapped to Sarvam AI endpoints.

- **`services/sarvamSTT.ts`:** Handles audio capture from `expo-av` and processes the `.m4a` or `.webm` blobs into highly accurate text using the `saaras:v3` model.
- **`services/sarvamTTS.ts`:** Cleans up markdown and text artifacts, then converts the text into base64 audio snippets for instant playback utilizing the `bulbul:v3` engine.
- **`services/sarvamTranslation.ts`:** Bridges the gap between English (`en-IN`) backend logic and regional languages using the `mayura:v1` model, operating in a formal mode suitable for instructional feedback.

## 📄 License

This project is proprietary. Please check with the repository owner for licensing details.
