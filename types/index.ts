export interface DetectionResult {
    disease: string;
    confidence: number;
    recommendation: string;
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
}

export interface UploadState {
    imageUri: string | null;
    loading: boolean;
    result: DetectionResult | null;
    error: string | null;
}
