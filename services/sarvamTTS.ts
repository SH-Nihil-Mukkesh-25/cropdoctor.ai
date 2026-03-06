import { Platform } from 'react-native';

export async function generateSpeech(text: string, language: string): Promise<string> {
    const SARVAM_API_KEY = process.env.EXPO_PUBLIC_SARVAM_API_KEY || process.env.SARVAM_API_KEY;

    if (!SARVAM_API_KEY) {
        throw new Error("Sarvam API Key is missing. Set SARVAM_API_KEY in .env");
    }

    if (!text || text.trim() === '') {
        throw new Error("Text is required for speech generation.");
    }

    try {
        // 1. Clean up the text: Remove markdown asterisks, hashes, and extra spaces
        let cleanText = text.replace(/[*#_]/g, '').replace(/\s+/g, ' ').trim();

        // 2. Prevent API crashes: Sarvam TTS usually caps out around 500 characters per input.
        if (cleanText.length > 500) {
            console.warn("TTS text exceeded 500 characters. Truncating to prevent API crash.");
            cleanText = cleanText.substring(0, 497) + "..."; 
        }

        const baseUrl = "https://api.sarvam.ai/text-to-speech";
        
        const fetchUrl = Platform.OS === 'web'
            ? `https://corsproxy.io/?${encodeURIComponent(baseUrl)}`
            : baseUrl;

        const response = await fetch(fetchUrl, {
            method: "POST",
            headers: {
                "api-subscription-key": SARVAM_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: [cleanText], 
                target_language_code: language,
                speaker: "ritu", 
                pace: 1.0,
                // Removed 'pitch' and 'loudness' to comply with bulbul:v3 requirements
                speech_sample_rate: 8000,
                enable_preprocessing: true,
                model: "bulbul:v3" 
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`TTS API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        if (data.audios && data.audios.length > 0) {
            const base64Audio = data.audios[0];
            return `data:audio/wav;base64,${base64Audio}`;
        } else {
            throw new Error("No audio payload returned from Sarvam TTS API.");
        }
    } catch (error: any) {
        console.error("TTS generation failed:", error);
        throw new Error(error.message || "Failed to generate speech audio.");
    }
}