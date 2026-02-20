import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScanRecord } from '../types';
import { Colors, BorderRadius, Spacing, FontSize, Glass } from '../constants/theme';

interface HistoryItemProps {
    scan: ScanRecord;
    isSelected: boolean;
    onPress: (scan: ScanRecord) => void;
}

export default function HistoryItem({ scan, isSelected, onPress }: HistoryItemProps) {
    const isHealthy = scan.result.disease.toLowerCase().includes('healthy');
    const statusColor = isHealthy ? Colors.healthy : Colors.warning;
    const statusBg = isHealthy ? Colors.healthyBg : Colors.warningBg;
    const statusBorder = isHealthy ? Colors.healthyGlow : Colors.warningGlow;
    const confidence = Math.round(scan.result.confidence * 100);

    const formattedDate = new Date(scan.timestamp).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    return (
        <TouchableOpacity
            style={[styles.container, isSelected && styles.selected]}
            onPress={() => onPress(scan)}
            activeOpacity={0.7}
        >
            <View style={styles.thumbnailWrap}>
                <Image source={{ uri: scan.imageUri }} style={styles.thumbnail} />
            </View>
            <View style={styles.info}>
                <Text style={styles.disease} numberOfLines={1}>{scan.result.disease}</Text>
                <Text style={styles.date}>{formattedDate}</Text>
                <View style={styles.metaRow}>
                    <View style={[styles.badge, { backgroundColor: statusBg, borderColor: statusBorder }]}>
                        <Ionicons
                            name={isHealthy ? 'checkmark-circle' : 'warning'}
                            size={11} color={statusColor}
                        />
                        <Text style={[styles.badgeText, { color: statusColor }]}>
                            {isHealthy ? 'Healthy' : 'Warning'}
                        </Text>
                    </View>
                    <Text style={styles.confidenceText}>{confidence}%</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 10, paddingHorizontal: Spacing.md,
        marginHorizontal: Spacing.sm, marginVertical: 2,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
    },
    selected: {
        ...Glass.cardHeavy,
        borderColor: Colors.borderAccent,
    },
    thumbnailWrap: {
        borderRadius: BorderRadius.sm,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    thumbnail: {
        width: 44, height: 44,
        backgroundColor: Colors.surfaceHover,
    },
    info: { flex: 1, gap: 2 },
    disease: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '600' },
    date: { color: Colors.textMuted, fontSize: FontSize.xs },
    metaRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginTop: 2,
    },
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    badgeText: { fontSize: 10, fontWeight: '600' },
    confidenceText: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
});
