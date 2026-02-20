import { Platform } from 'react-native';
import { DetectionResult } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8008';

/**
 * Convert a data URI or blob URI to a Blob (web) or prepare RN file object (native).
 */
async function uriToBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    return await response.blob();
}

export async function detectDisease(imageUri: string): Promise<DetectionResult> {
    const formData = new FormData();

    if (Platform.OS === 'web') {
        // On web: convert the URI (data URL / blob URL from the file picker) into a Blob
        const blob = await uriToBlob(imageUri);
        formData.append('image', blob, 'plant.jpg');
    } else {
        // On native (iOS/Android): React Native's FormData accepts { uri, type, name }
        formData.append('image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'plant.jpg',
        } as any);
    }

    // Do NOT set Content-Type manually — the runtime will add the correct
    // multipart boundary automatically when sending FormData.
    const response = await fetch(`${API_URL}/api/detect`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server error (${response.status}): ${errText}`);
    }

    return response.json();
}

export async function checkHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/health`, { method: 'GET' });
        return response.ok;
    } catch {
        return false;
    }
}
