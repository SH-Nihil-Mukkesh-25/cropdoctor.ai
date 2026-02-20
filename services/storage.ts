import { supabase } from './supabase';
import { ScanRecord, DetectionResult } from '../types';

/**
 * Save a completed scan to the user's history in Supabase.
 */
export async function saveToHistory(userId: string, scan: ScanRecord): Promise<void> {
    const { error } = await supabase.from('scan_history').insert({
        user_id: userId,
        image_uri: scan.imageUri,
        disease: scan.result.disease,
        confidence: scan.result.confidence,
        recommendation: scan.result.recommendation,
    });

    if (error) {
        console.error('Failed to save scan to history:', error.message);
        throw new Error('Failed to save scan result');
    }
}

/**
 * Get all scans for the current user, newest first.
 */
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

/**
 * Get a single scan by its ID.
 */
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

/**
 * Delete all scans for the current user.
 */
export async function clearHistory(userId: string): Promise<void> {
    const { error } = await supabase
        .from('scan_history')
        .delete()
        .eq('user_id', userId);

    if (error) {
        console.error('Failed to clear history:', error.message);
    }
}

/**
 * Generate a unique scan ID (used as a client-side reference before DB insert).
 */
export function generateScanId(): string {
    return crypto.randomUUID?.() || `scan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
