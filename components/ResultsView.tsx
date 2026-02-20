import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { DetectionResult } from '../types';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '../constants/theme';
import ConfidenceGauge from './ConfidenceGauge';

interface ResultsViewProps {
    imageUri: string;
    result: DetectionResult;
    onNewScan: () => void;
    isFromHistory?: boolean;
}

export default function ResultsView({ imageUri, result, onNewScan, isFromHistory }: ResultsViewProps) {
    const isHealthy = result.disease.toLowerCase().includes('healthy');
    const statusColor = isHealthy ? Colors.healthy : Colors.disease;
    const statusIcon = isHealthy ? '✅' : '⚠️';

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Image Preview */}
            <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                {isFromHistory && (
                    <View style={styles.cachedBadge}>
                        <Text style={styles.cachedBadgeText}>📦 Cached Result</Text>
                    </View>
                )}
            </View>

            {/* Disease Name */}
            <View style={[styles.diseaseCard, { borderLeftColor: statusColor }]}>
                <Text style={styles.diseaseIcon}>{statusIcon}</Text>
                <View style={styles.diseaseInfo}>
                    <Text style={styles.diseaseLabel}>Detection Result</Text>
                    <Text style={[styles.diseaseName, { color: statusColor }]}>
                        {result.disease}
                    </Text>
                </View>
            </View>

            {/* Confidence */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Confidence Level</Text>
                <View style={styles.confidenceRow}>
                    <ConfidenceGauge confidence={result.confidence} size={200} />
                </View>
            </View>

            {/* Recommendation */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>💡 Recommendation</Text>
                <Text style={styles.recommendationText}>{result.recommendation}</Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.newScanBtn} onPress={onNewScan} activeOpacity={0.8}>
                <Text style={styles.newScanBtnText}>🔬  Analyze New Image</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.lg,
        gap: Spacing.md,
        paddingBottom: Spacing.xxl,
    },
    imageContainer: {
        position: 'relative',
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        ...Shadows.lg,
    },
    image: {
        width: '100%',
        aspectRatio: 4 / 3,
        backgroundColor: Colors.surfaceLight,
    },
    cachedBadge: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
        backgroundColor: Colors.overlay,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    cachedBadgeText: {
        color: Colors.white,
        fontSize: FontSize.xs,
        fontWeight: '600',
    },
    diseaseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderLeftWidth: 4,
        gap: Spacing.md,
        ...Shadows.sm,
    },
    diseaseIcon: {
        fontSize: 32,
    },
    diseaseInfo: {
        flex: 1,
    },
    diseaseLabel: {
        color: Colors.textMuted,
        fontSize: FontSize.xs,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    diseaseName: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        marginTop: 2,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        gap: Spacing.sm,
        ...Shadows.sm,
    },
    cardTitle: {
        color: Colors.textSecondary,
        fontSize: FontSize.md,
        fontWeight: '600',
    },
    confidenceRow: {
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    recommendationText: {
        color: Colors.text,
        fontSize: FontSize.md,
        lineHeight: 24,
    },
    newScanBtn: {
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        marginTop: Spacing.sm,
        ...Shadows.sm,
    },
    newScanBtnText: {
        color: Colors.textOnPrimary,
        fontSize: FontSize.lg,
        fontWeight: '700',
    },
});
