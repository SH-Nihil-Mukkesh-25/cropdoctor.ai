import { Platform } from 'react-native';
import { supabase } from './supabase';
import { ScanRecord, DetectionResult } from '../types';

async function toBase64DataUri(uri: string): Promise<string> {
    if (uri.startsWith('data:')) return uri;

    try {
        if (Platform.OS === 'web') {
            const response = await fetch(uri);
            const blob = await response.blob();
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } else {
            const FileSystem = require('expo-file-system');
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            return `data:image/jpeg;base64,${base64}`;
        }
    } catch (err) {
        console.warn('Failed to convert image to base64, using original URI:', err);
        return uri;
    }
}

export async function saveToHistory(userId: string, scan: ScanRecord): Promise<void> {
    const persistentUri = await toBase64DataUri(scan.imageUri);

    const { error } = await supabase.from('scan_history').insert({
        user_id: userId,
        image_uri: persistentUri,
        disease: scan.result.disease,
        confidence: scan.result.confidence,
        recommendation: scan.result.recommendation,
    });

    if (error) {
        console.error('Failed to save scan to history:', error.message);
        throw new Error('Failed to save scan result');
    }
}

export async function getHistory(userId: string): Promise<ScanRecord[]> {
    const { data, error } = await supabase
        .from('scan_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Failed to load history:', error.message);
        return [];
    }

    return (data || []).map((row: any) => ({
        id: row.id,
        imageUri: row.image_uri,
        result: {
            disease: row.disease,
            confidence: row.confidence,
            recommendation: row.recommendation || '',
        } as DetectionResult,
        timestamp: new Date(row.created_at).getTime(),
    }));
}

export async function getScanById(userId: string, id: string): Promise<ScanRecord | null> {
    const { data, error } = await supabase
        .from('scan_history')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        imageUri: data.image_uri,
        result: {
            disease: data.disease,
            confidence: data.confidence,
            recommendation: data.recommendation || '',
        },
        timestamp: new Date(data.created_at).getTime(),
    };
}

export async function clearHistory(userId: string): Promise<void> {
    const { error } = await supabase
        .from('scan_history')
        .delete()
        .eq('user_id', userId);

    if (error) {
        console.error('Failed to clear history:', error.message);
    }
}

export function generateScanId(): string {
    return crypto.randomUUID?.() || `scan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
