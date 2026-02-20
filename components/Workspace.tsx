import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DetectionResult, ScanRecord } from '../types';
import { Colors, BorderRadius, Spacing, FontSize, Shadows, Glass } from '../constants/theme';
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

    if (selectedScan) {
        return (
            <View style={styles.container}>
                <ResultsView imageUri={selectedScan.imageUri} result={selectedScan.result}
                    onNewScan={onNewScan} isFromHistory={true} />
            </View>
        );
    }

    if (result && imageUri) {
        return (
            <View style={styles.container}>
                <ResultsView imageUri={imageUri} result={result} onNewScan={onNewScan} />
            </View>
        );
    }

    const handleSubmit = async () => {
        if (!imageUri) return;
        setLoading(true); setError(null);
        try {
            const det = await detectDisease(imageUri);
            setResult(det);
            const scan: ScanRecord = { id: generateScanId(), imageUri, result: det, timestamp: Date.now() };
            await saveToHistory(userId, scan);
            onScanComplete();
        } catch (e: any) {
            setError(e.message || 'Analysis failed. Please try again.');
        } finally { setLoading(false); }
    };

    return (
        <View style={styles.container}>
            <ImageUploader imageUri={imageUri}
                onImageSelected={(uri) => { setImageUri(uri); setError(null); }}
                onRemoveImage={() => { setImageUri(null); setError(null); }}
                loading={loading} onSubmit={handleSubmit} />
            {error && (
                <View style={styles.errorWrap}>
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle" size={16} color={Colors.warning} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    errorWrap: { position: 'absolute', bottom: 20, left: 20, right: 20 },
    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        backgroundColor: Colors.warningBg, borderRadius: BorderRadius.md,
        padding: Spacing.md, ...Shadows.sm,
        borderWidth: 1, borderColor: Colors.warningGlow,
    },
    errorText: { color: Colors.warning, fontSize: FontSize.sm, fontWeight: '500', flex: 1 },
});
