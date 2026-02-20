import { Platform } from 'react-native';
import { DetectionResult } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8008';

async function uriToBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    return await response.blob();
}

export async function detectDisease(imageUri: string): Promise<DetectionResult> {
    const formData = new FormData();

    if (Platform.OS === 'web') {
        const blob = await uriToBlob(imageUri);
        formData.append('image', blob, 'plant.jpg');
    } else {
        formData.append('image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'plant.jpg',
        } as any);
    }

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
