import React, { useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DetectionResult } from '../types';
import { Colors, Spacing, BorderRadius, FontSize, Shadows, Glass } from '../constants/theme';
import ConfidenceGauge from './ConfidenceGauge';

interface ResultsViewProps {
    imageUri: string;
    result: DetectionResult;
    onNewScan: () => void;
    isFromHistory?: boolean;
}

export default function ResultsView({ imageUri, result, onNewScan, isFromHistory }: ResultsViewProps) {
    const isHealthy = result.disease.toLowerCase().includes('healthy');
    const statusColor = isHealthy ? Colors.healthy : Colors.warning;
    const statusBg = isHealthy ? Colors.healthyBg : Colors.warningBg;
    const statusGlow = isHealthy ? Colors.healthyGlow : Colors.warningGlow;
    const statusLabel = isHealthy ? 'Healthy' : 'Disease Detected';
    const statusIcon = isHealthy ? 'checkmark-circle' : 'alert-circle';

    const slideAnim = useRef(new Animated.Value(80)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: 0, friction: 6, tension: 50, useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1, duration: 500,
                easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.imageWrap}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                {isFromHistory && (
                    <View style={styles.cachedBadge}>
                        <Ionicons name="archive-outline" size={12} color={Colors.textSecondary} />
                        <Text style={styles.cachedText}>Cached</Text>
                    </View>
                )}
            </View>

            <Animated.View style={[
                styles.statusBanner,
                { backgroundColor: statusBg, borderColor: statusGlow },
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}>
                <View style={[styles.statusIconWrap, { backgroundColor: statusGlow }]}>
                    <Ionicons name={statusIcon} size={22} color={statusColor} />
                </View>
                <View style={styles.statusInfo}>
                    <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
                    <Text style={styles.diseaseName}>{result.disease}</Text>
                </View>
            </Animated.View>

            <Animated.View style={[
                styles.card,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}>
                <Text style={styles.cardTitle}>Confidence</Text>
                <View style={styles.gaugeWrap}>
                    <ConfidenceGauge confidence={result.confidence} size={150} />
                </View>
            </Animated.View>

            <Animated.View style={[
                styles.card,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}>
                <View style={styles.cardHeader}>
                    <Ionicons name="bulb-outline" size={16} color={Colors.warning} />
                    <Text style={styles.cardTitle}>Recommendation</Text>
                </View>
                <Text style={styles.recText}>{result.recommendation}</Text>
            </Animated.View>

            <TouchableOpacity style={styles.newScanBtn} onPress={onNewScan} activeOpacity={0.8}>
                <Ionicons name="scan-outline" size={16} color={Colors.primaryDeep} />
                <Text style={styles.newScanText}>Analyze Another Image</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
    imageWrap: {
        borderRadius: BorderRadius.xl, overflow: 'hidden',
        ...Shadows.md, position: 'relative',
        borderWidth: 1, borderColor: Colors.border,
    },
    image: { width: '100%', aspectRatio: 4 / 3, backgroundColor: Colors.surfaceHover },
    cachedBadge: {
        position: 'absolute', top: Spacing.sm, right: Spacing.sm,
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 1, borderColor: Colors.border,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full,
    },
    cachedText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '500' },
    statusBanner: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        padding: Spacing.md, borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
    statusIconWrap: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
    },
    statusInfo: { flex: 1, gap: 2 },
    statusLabel: {
        fontSize: FontSize.xs, fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: 1,
    },
    diseaseName: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
    card: {
        ...Glass.card,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg, gap: Spacing.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    cardTitle: {
        color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    gaugeWrap: { alignItems: 'center', paddingVertical: Spacing.md },
    recText: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 24 },
    newScanBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 15, borderRadius: BorderRadius.md,
        backgroundColor: Colors.accent,
        ...Shadows.glowSm,
    },
    newScanText: { color: Colors.primaryDeep, fontSize: FontSize.md, fontWeight: '700' },
});
