export interface DetectionResult {
    disease: string;
    confidence: number;
    recommendations: string[];
    key_points: string[];
    action_steps: string[];
}

export interface ScanRecord {
    id: string;
    imageUri: string;
    result: DetectionResult;
    timestamp: number;
    thumbnailUri?: string;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    preferredLanguage?: string;
}

export interface UploadState {
    imageUri: string | null;
    loading: boolean;
    result: DetectionResult | null;
    error: string | null;
}
