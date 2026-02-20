import React, { useEffect, useRef } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScanRecord } from '../types';
import { Colors, Spacing, FontSize, BorderRadius, Shadows, Glass } from '../constants/theme';
import HistoryItem from './HistoryItem';

interface SidebarProps {
    history: ScanRecord[];
    selectedId: string | null;
    onSelectScan: (scan: ScanRecord) => void;
    onClearHistory: () => void;
    loading: boolean;
    onNewScan: () => void;
}

export default function Sidebar({
    history, selectedId, onSelectScan, onClearHistory, loading, onNewScan,
}: SidebarProps) {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.04, duration: 1500,
                    easing: Easing.inOut(Easing.sin), useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1, duration: 1500,
                    easing: Easing.inOut(Easing.sin), useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Scan History</Text>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{history.length}</Text>
                </View>
            </View>

            <Animated.View style={{ transform: [{ scale: pulseAnim }], marginHorizontal: Spacing.md, marginBottom: Spacing.sm }}>
                <TouchableOpacity style={styles.newScanBtn} onPress={onNewScan} activeOpacity={0.8}>
                    <View style={styles.newScanInner}>
                        <Ionicons name="add-circle" size={18} color={Colors.primaryDeep} />
                        <Text style={styles.newScanText}>New Scan</Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>

            <View style={styles.divider} />

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator color={Colors.accent} size="small" />
                </View>
            ) : history.length === 0 ? (
                <View style={styles.centerBox}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="leaf-outline" size={36} color={Colors.textMuted} />
                    </View>
                    <Text style={styles.emptyTitle}>No scans yet</Text>
                    <Text style={styles.emptySubtext}>
                        Upload a plant image to get started
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <HistoryItem scan={item} isSelected={selectedId === item.id} onPress={onSelectScan} />
                    )}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                />
            )}

            {history.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={onClearHistory} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                    <Text style={styles.clearText}>Clear history</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surfaceSolid },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
    },
    title: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
    countBadge: {
        backgroundColor: Colors.accentSubtle,
        paddingHorizontal: 10, paddingVertical: 3,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.borderAccent,
    },
    countText: { color: Colors.accent, fontSize: FontSize.xs, fontWeight: '700' },
    newScanBtn: {
        backgroundColor: Colors.accent,
        borderRadius: BorderRadius.md,
        ...Shadows.glowSm,
    },
    newScanInner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 12,
    },
    newScanText: { color: Colors.primaryDeep, fontSize: FontSize.md, fontWeight: '700' },
    divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
    listContent: { paddingTop: Spacing.xs, paddingBottom: Spacing.md },
    centerBox: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: Spacing.xl, gap: Spacing.sm,
    },
    emptyIcon: {
        width: 64, height: 64, borderRadius: 32,
        ...Glass.surface,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    emptyTitle: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
    emptySubtext: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
    clearBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: Spacing.sm, margin: Spacing.md,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.dangerBg,
        borderWidth: 1,
        borderColor: Colors.dangerGlow,
    },
    clearText: { color: Colors.danger, fontSize: FontSize.sm, fontWeight: '500' },
});
