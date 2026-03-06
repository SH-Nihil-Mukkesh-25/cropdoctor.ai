import { Platform } from 'react-native';

// ─────────────────────────────────────────────
// Constants & Configuration
// ─────────────────────────────────────────────

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const MODEL_ID = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// ─────────────────────────────────────────────
// Supported Language Codes
// ─────────────────────────────────────────────

export const SUPPORTED_LANGUAGE_CODES = [
    'en-IN', 'hi-IN', 'ta-IN', 'ml-IN', 'te-IN', 'kn-IN',
    'bn-IN', 'mr-IN', 'gu-IN', 'pa-IN', 'or-IN', 'as-IN'
] as const;

export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGE_CODES[number];

// ─────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────

export interface DiseaseAnalysisResult {
    disease: string;
    confidence: number;
    severity: 'healthy' | 'low' | 'moderate' | 'high' | 'critical';
    recommendations: string[];
    key_points: string[];
    action_steps: string[];
}

export interface QueryAnalysisResult extends DiseaseAnalysisResult {
    spoken_response: string;
    language_code: SupportedLanguageCode;
}

// ─────────────────────────────────────────────
// Custom Error Classes
// ─────────────────────────────────────────────

export class GeminiAPIError extends Error {
    constructor(
        message: string,
        public readonly statusCode?: number,
        public readonly raw?: unknown
    ) {
        super(message);
        this.name = 'GeminiAPIError';
    }
}

export class GeminiParseError extends Error {
    constructor(message: string, public readonly rawResponse?: string) {
        super(message);
        this.name = 'GeminiParseError';
    }
}

export class GeminiValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'GeminiValidationError';
    }
}

// ─────────────────────────────────────────────
// Utility: Sleep
// ─────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────
// Utility: Validate API Key
// ─────────────────────────────────────────────

function assertApiKey(): string {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '') {
        throw new GeminiValidationError(
            'Gemini API Key is missing. Set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.'
        );
    }
    return GEMINI_API_KEY;
}

// ─────────────────────────────────────────────
// Utility: Convert Image URI to Base64
// ─────────────────────────────────────────────

async function imageUriToBase64(uri: string): Promise<{ base64: string; mimeType: string }> {
    if (!uri || uri.trim() === '') {
        throw new GeminiValidationError('Image URI cannot be empty.');
    }

    if (Platform.OS === 'web') {
        const response = await fetch(uri);
        if (!response.ok) {
            throw new GeminiValidationError(`Failed to fetch image from URI: ${response.statusText}`);
        }
        const blob = await response.blob();
        const mimeType = blob.type || 'image/jpeg';

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const base64 = dataUrl.split(',')[1];
                if (!base64) {
                    reject(new GeminiValidationError('Failed to extract base64 data from image.'));
                    return;
                }
                resolve({ base64, mimeType });
            };
            reader.onerror = () => reject(new GeminiValidationError('FileReader failed while processing image.'));
            reader.readAsDataURL(blob);
        });
    } else {
        const FileSystem = require('expo-file-system');
        try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            return { base64, mimeType: 'image/jpeg' };
        } catch (err: any) {
            throw new GeminiValidationError(`Failed to read image file: ${err.message}`);
        }
    }
}

// ─────────────────────────────────────────────
// Utility: Gemini API Fetch with Retry
// ─────────────────────────────────────────────

async function fetchGeminiWithRetry(
    apiKey: string,
    payload: object,
    retries = MAX_RETRIES
): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            // Handle rate limiting with exponential backoff
            if (res.status === 429) {
                const waitMs = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
                console.warn(`[Gemini] Rate limited. Retrying in ${waitMs}ms (attempt ${attempt}/${retries})`);
                await sleep(waitMs);
                continue;
            }

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new GeminiAPIError(
                    errBody?.error?.message || `Gemini API returned ${res.status}: ${res.statusText}`,
                    res.status,
                    errBody
                );
            }

            const data = await res.json();

            // Validate response structure
            if (!data.candidates || data.candidates.length === 0) {
                // Could be a safety block
                const blockReason = data.promptFeedback?.blockReason;
                if (blockReason) {
                    throw new GeminiAPIError(`Request blocked by Gemini safety filters: ${blockReason}`);
                }
                throw new GeminiAPIError('Gemini returned no candidates. The image may be unsupported or unclear.');
            }

            const part = data.candidates[0]?.content?.parts?.[0];
            if (!part?.text) {
                throw new GeminiAPIError('Gemini response is missing text content.');
            }

            return part.text;

        } catch (err: any) {
            lastError = err;

            // Don't retry on validation or permanent errors
            if (
                err instanceof GeminiValidationError ||
                (err instanceof GeminiAPIError && err.statusCode && err.statusCode < 500 && err.statusCode !== 429)
            ) {
                throw err;
            }

            if (attempt < retries) {
                const waitMs = RETRY_DELAY_MS * attempt;
                console.warn(`[Gemini] Attempt ${attempt} failed. Retrying in ${waitMs}ms...`);
                await sleep(waitMs);
            }
        }
    }

    throw lastError ?? new GeminiAPIError('All retry attempts exhausted.');
}

// ─────────────────────────────────────────────
// Utility: Parse and Validate JSON from Gemini
// ─────────────────────────────────────────────

function parseGeminiJSON<T extends Record<string, any>>(
    rawText: string,
    requiredFields: (keyof T)[]
): T {
    // Strip markdown code fences if present
    const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

    let parsed: T;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        throw new GeminiParseError(
            'Failed to parse Gemini response as JSON. The model returned unexpected formatting.',
            rawText
        );
    }

    for (const field of requiredFields) {
        if (parsed[field] === undefined || parsed[field] === null) {
            throw new GeminiParseError(
                `Parsed response is missing required field: "${String(field)}"`,
                rawText
            );
        }
    }

    return parsed;
}

// ─────────────────────────────────────────────
// Utility: Sanitize & Clamp Array Fields
// ─────────────────────────────────────────────

function sanitizeStringArray(arr: unknown, maxItems = 3, fallback: string[]): string[] {
    if (!Array.isArray(arr)) return fallback;
    return arr
        .filter((item): item is string => typeof item === 'string' && item.trim() !== '')
        .slice(0, maxItems);
}

function clampConfidence(value: unknown): number {
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return 0.85;
    return Math.min(1.0, Math.max(0.0, parseFloat(num.toFixed(2))));
}

function normalizeSeverity(value: unknown): DiseaseAnalysisResult['severity'] {
    const valid: DiseaseAnalysisResult['severity'][] = ['healthy', 'low', 'moderate', 'high', 'critical'];
    const str = String(value ?? '').toLowerCase().trim() as DiseaseAnalysisResult['severity'];
    return valid.includes(str) ? str : 'moderate';
}

function normalizeLanguageCode(value: unknown): SupportedLanguageCode {
    const str = String(value ?? '').trim();
    return (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(str)
        ? (str as SupportedLanguageCode)
        : 'en-IN';
}

// ─────────────────────────────────────────────
// Prompt Templates
// ─────────────────────────────────────────────

const DISEASE_DETECTION_PROMPT = `
You are an expert agricultural plant pathologist AI. Analyze the plant leaf image provided and return a precise diagnosis.

Respond ONLY with a valid JSON object — no markdown, no code fences, no prose outside JSON.

JSON Schema:
{
  "disease": "Exact Plant Name - Disease Name (e.g. 'Tomato - Early Blight')",
  "confidence": <float between 0.0 and 1.0>,
  "severity": "<one of: healthy | low | moderate | high | critical>",
  "recommendations": [
    "<concise treatment or management advice, max 12 words>",
    "<second recommendation>",
    "<third recommendation>"
  ],
  "key_points": [
    "<visible symptom or diagnostic indicator, max 12 words>",
    "<second symptom>",
    "<third symptom>"
  ],
  "action_steps": [
    "<immediate farmer action required, max 12 words>",
    "<second action>",
    "<third action>"
  ]
}

STRICT RULES:
1. "disease": Use standardized disease names. If healthy, use 'Plant Name - Healthy'.
   Common disease keywords: Blight, Rust, Rot, Spot, Mildew, Mosaic, Wilt, Scab, Canker, Anthracnose.
2. "confidence": Reflect genuine diagnostic certainty. Do NOT always output 0.95.
3. "severity": Assess how urgently the farmer must act. "healthy" if no disease found.
4. Arrays: 2–3 items each. Each item MUST be under 12 words. Plain English. No asterisks or markdown.
5. Language: Simple, farmer-friendly. Avoid scientific jargon unless necessary.
6. JSON ONLY. Any text outside the JSON object will break the system.
`.trim();

const QUERY_ANALYSIS_PROMPT = (question: string) => `
You are a multilingual agricultural AI assistant helping farmers understand their crop health.

User's question (in their native language):
"${question}"

A plant leaf image has been uploaded for context.

Your task:
1. Detect the language of the user's question.
2. Analyze the leaf image in context of the question.
3. Respond ENTIRELY in the SAME language the user wrote in.
4. Return ONLY a valid JSON object — no markdown, no code fences, no prose outside JSON.

JSON Schema:
{
  "language_code": "<one of: en-IN | hi-IN | ta-IN | ml-IN | te-IN | kn-IN | bn-IN | mr-IN | gu-IN | pa-IN | or-IN | as-IN>",
  "disease": "<Plant Name - Short Answer Summary in detected language>",
  "confidence": <float between 0.0 and 1.0>,
  "severity": "<one of: healthy | low | moderate | high | critical>",
  "spoken_response": "<2–3 sentence natural, conversational, empathetic answer directly addressing the user's question. Written in the detected language. This will be read aloud by a voice assistant. NO bullet points, NO markdown, NO lists — flowing prose ONLY.>",
  "recommendations": [
    "<direct answer or treatment tip in detected language, max 12 words>",
    "<second recommendation>",
    "<third recommendation>"
  ],
  "key_points": [
    "<relevant observation or context point in detected language, max 12 words>",
    "<second point>",
    "<third point>"
  ],
  "action_steps": [
    "<immediate action for the farmer in detected language, max 12 words>",
    "<second action>",
    "<third action>"
  ]
}

STRICT RULES:
1. ALL fields (disease, spoken_response, recommendations, key_points, action_steps) MUST be in the user's language.
   Exception: "language_code" and "severity" values are always in English as defined.
2. "spoken_response": Must sound warm, natural, and supportive when spoken aloud. 2–3 sentences. No lists or symbols.
3. "confidence": Genuine estimate. Do NOT always return 0.95.
4. "severity": Always in English. Assess disease urgency: healthy | low | moderate | high | critical.
5. Arrays: 2–3 items each. Each under 12 words. No markdown inside array strings.
6. JSON ONLY. Any text outside the JSON object will break the system.
`.trim();

// ─────────────────────────────────────────────
// Utility: Build Gemini Request Payload
// ─────────────────────────────────────────────

function buildGeminiPayload(promptText: string, base64: string, mimeType: string) {
    return {
        contents: [{
            parts: [
                { text: promptText },
                {
                    inline_data: {
                        mime_type: mimeType,
                        data: base64,
                    },
                },
            ],
        }],
        generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,         // Low temperature = consistent, factual responses
            topP: 0.8,
            topK: 20,
            maxOutputTokens: 1024,
        },
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
    };
}

// ─────────────────────────────────────────────
// Public API: Analyze and Detect Disease
// ─────────────────────────────────────────────

export async function analyzeAndDetectDisease(imageUri: string): Promise<DiseaseAnalysisResult> {
    const apiKey = assertApiKey();
    const { base64, mimeType } = await imageUriToBase64(imageUri);
    const payload = buildGeminiPayload(DISEASE_DETECTION_PROMPT, base64, mimeType);

    let rawText: string;
    try {
        rawText = await fetchGeminiWithRetry(apiKey, payload);
    } catch (err: any) {
        console.error('[Gemini][analyzeAndDetectDisease] API error:', err);
        throw err;
    }

    try {
        const parsed = parseGeminiJSON<any>(rawText, ['disease', 'confidence', 'severity']);
        return {
            disease: typeof parsed.disease === 'string' && parsed.disease.trim()
                ? parsed.disease.trim()
                : 'Unknown Plant',
            confidence: clampConfidence(parsed.confidence),
            severity: normalizeSeverity(parsed.severity),
            recommendations: sanitizeStringArray(
                parsed.recommendations, 3,
                ['Apply appropriate fungicide.', 'Isolate affected plants.', 'Consult a local agronomist.']
            ),
            key_points: sanitizeStringArray(
                parsed.key_points, 3,
                ['Visible discoloration on leaf surface.', 'Unusual spotting pattern detected.']
            ),
            action_steps: sanitizeStringArray(
                parsed.action_steps, 3,
                ['Remove and destroy infected leaves immediately.', 'Do not irrigate overhead.']
            ),
        };
    } catch (parseErr: any) {
        console.error('[Gemini][analyzeAndDetectDisease] Parse error:', parseErr.rawResponse ?? rawText);
        // Graceful degradation — return a safe fallback rather than crashing the UI
        return {
            disease: 'Analysis Incomplete',
            confidence: 0.0,
            severity: 'moderate',
            recommendations: ['Unable to parse AI recommendations. Please retry.'],
            key_points: ['Image may be unclear, blurry, or non-plant content.'],
            action_steps: ['Retake the photo in good lighting and try again.'],
        };
    }
}

// ─────────────────────────────────────────────
// Public API: Analyze with User Query (Multilingual)
// ─────────────────────────────────────────────

export async function analyzeWithUserQuery(
    imageUri: string,
    question: string
): Promise<QueryAnalysisResult> {
    const apiKey = assertApiKey();

    if (!question || question.trim() === '') {
        throw new GeminiValidationError('A question is required for query-based analysis.');
    }

    const { base64, mimeType } = await imageUriToBase64(imageUri);
    const payload = buildGeminiPayload(QUERY_ANALYSIS_PROMPT(question.trim()), base64, mimeType);

    let rawText: string;
    try {
        rawText = await fetchGeminiWithRetry(apiKey, payload);
    } catch (err: any) {
        console.error('[Gemini][analyzeWithUserQuery] API error:', err);
        throw err;
    }

    try {
        const parsed = parseGeminiJSON<any>(rawText, ['disease', 'confidence', 'spoken_response', 'language_code']);
        return {
            language_code: normalizeLanguageCode(parsed.language_code),
            disease: typeof parsed.disease === 'string' && parsed.disease.trim()
                ? parsed.disease.trim()
                : 'Question Answered',
            confidence: clampConfidence(parsed.confidence),
            severity: normalizeSeverity(parsed.severity),
            spoken_response: typeof parsed.spoken_response === 'string' && parsed.spoken_response.trim()
                ? parsed.spoken_response.trim()
                : 'I have answered your question on screen. Please read the details below.',
            recommendations: sanitizeStringArray(
                parsed.recommendations, 3,
                ['Please refer to the key points below.']
            ),
            key_points: sanitizeStringArray(
                parsed.key_points, 3,
                ['No additional context available.']
            ),
            action_steps: sanitizeStringArray(
                parsed.action_steps, 3,
                ['Please try asking again with a clearer question.']
            ),
        };
    } catch (parseErr: any) {
        console.error('[Gemini][analyzeWithUserQuery] Parse error:', parseErr.rawResponse ?? rawText);
        return {
            language_code: 'en-IN',
            disease: 'Question Received',
            confidence: 0.0,
            severity: 'moderate',
            spoken_response: 'I heard your question, but had trouble formatting my answer. Please try again with a clear, well-lit photo.',
            recommendations: ['Ensure the leaf is clearly visible in the image.'],
            key_points: ['AI response could not be parsed correctly.'],
            action_steps: ['Retake the photo and ask your question again.'],
        };
    }
}