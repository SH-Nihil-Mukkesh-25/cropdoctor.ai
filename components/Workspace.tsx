import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DetectionResult, ScanRecord } from '../types';
import { Colors, BorderRadius, Spacing, FontSize } from '../constants/theme';
import ImageUploader from './ImageUploader';
import ResultsView from './ResultsView';
import { detectDisease } from '../services/api';
import { saveToHistory, generateScanId } from '../services/storage';

interface WorkspaceProps {
    userId: string;
    selectedScan: ScanRecord | null;
    onScanComplete: () => void;
    onNewScan: () => void;
}

export default function Workspace({ userId, selectedScan, onScanComplete, onNewScan }: WorkspaceProps) {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<DetectionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // If a cached scan is selected from sidebar, show its results
    if (selectedScan) {
        return (
            <View style={styles.container}>
                <ResultsView
                    imageUri={selectedScan.imageUri}
                    result={selectedScan.result}
                    onNewScan={onNewScan}
                    isFromHistory={true}
                />
            </View>
        );
    }

    // If we have a new result, show it
    if (result && imageUri) {
        return (
            <View style={styles.container}>
                <ResultsView
                    imageUri={imageUri}
                    result={result}
                    onNewScan={onNewScan}
                />
            </View>
        );
    }

    // Upload mode
    const handleSubmit = async () => {
        if (!imageUri) return;
        setLoading(true);
        setError(null);

        try {
            const detectionResult = await detectDisease(imageUri);
            setResult(detectionResult);

            // Save to user-specific history in Supabase
            const scan: ScanRecord = {
                id: generateScanId(),
                imageUri,
                result: detectionResult,
                timestamp: Date.now(),
            };
            await saveToHistory(userId, scan);
            onScanComplete();
        } catch (e: any) {
            setError(e.message || 'Analysis failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ImageUploader
                imageUri={imageUri}
                onImageSelected={(uri) => {
                    setImageUri(uri);
                    setError(null);
                }}
                onRemoveImage={() => {
                    setImageUri(null);
                    setError(null);
                }}
                loading={loading}
                onSubmit={handleSubmit}
            />
            {error && (
                <View style={styles.errorContainer}>
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>❌  {error}</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    errorContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    errorBox: {
        backgroundColor: Colors.disease + '22',
        borderWidth: 1,
        borderColor: Colors.disease,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
    },
    errorText: {
        color: Colors.disease,
        fontSize: FontSize.sm,
        fontWeight: '600',
    },
});
