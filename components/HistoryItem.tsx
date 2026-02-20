import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ScanRecord } from '../types';
import { Colors, BorderRadius, Spacing, FontSize } from '../constants/theme';
import ConfidenceGauge from './ConfidenceGauge';

interface HistoryItemProps {
    scan: ScanRecord;
    isSelected: boolean;
    onPress: (scan: ScanRecord) => void;
}

export default function HistoryItem({ scan, isSelected, onPress }: HistoryItemProps) {
    const isHealthy = scan.result.disease.toLowerCase().includes('healthy');
    const formattedDate = new Date(scan.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <TouchableOpacity
            style={[styles.container, isSelected && styles.selected]}
            onPress={() => onPress(scan)}
            activeOpacity={0.7}
        >
            <Image source={{ uri: scan.imageUri }} style={styles.thumbnail} />
            <View style={styles.info}>
                <Text style={styles.disease} numberOfLines={1}>
                    {scan.result.disease}
                </Text>
                <Text style={styles.date}>{formattedDate}</Text>
                <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: isHealthy ? Colors.healthy + '22' : Colors.disease + '22' }]}>
                        <Text style={[styles.badgeText, { color: isHealthy ? Colors.healthy : Colors.disease }]}>
                            {isHealthy ? '✓ Healthy' : '⚠ Disease'}
                        </Text>
                    </View>
                    <ConfidenceGauge confidence={scan.result.confidence} size={60} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: Spacing.sm,
        marginHorizontal: Spacing.sm,
        marginVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: Spacing.sm,
    },
    selected: {
        borderColor: Colors.primaryLight,
        backgroundColor: Colors.surfaceLight,
    },
    thumbnail: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.surfaceLight,
    },
    info: {
        flex: 1,
        justifyContent: 'center',
        gap: 2,
    },
    disease: {
        color: Colors.text,
        fontSize: FontSize.sm,
        fontWeight: '600',
    },
    date: {
        color: Colors.textMuted,
        fontSize: FontSize.xs,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    badgeText: {
        fontSize: FontSize.xs,
        fontWeight: '600',
    },
});
