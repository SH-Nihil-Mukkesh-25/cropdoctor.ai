import { Platform } from 'react-native';

export async function translateText(text: string, targetLanguage: string): Promise<string> {
    const SARVAM_API_KEY = process.env.EXPO_PUBLIC_SARVAM_API_KEY || process.env.SARVAM_API_KEY;

    if (!SARVAM_API_KEY) {
        throw new Error("Sarvam API Key is missing. Set SARVAM_API_KEY in .env");
    }

    if (!text || text.trim() === '') {
        return text;
    }

    try {
        const baseUrl = "https://api.sarvam.ai/translate";
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
                input: text.trim(),
                source_language_code: "en-IN",
                target_language_code: targetLanguage,
                speaker_gender: "Male",
                mode: "formal",
                model: "mayura:v1",
                enable_preprocessing: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Translation API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        if (data.translated_text) {
            return data.translated_text;
        } else {
            throw new Error("Invalid response format from Sarvam Translation API.");
        }
    } catch (error: any) {
        console.error("Translation failed:", error);
        throw new Error(error.message || "Failed to translate text.");
    }
}