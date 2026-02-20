import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { ScanRecord } from '../types';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
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
    history,
    selectedId,
    onSelectScan,
    onClearHistory,
    loading,
    onNewScan,
}: SidebarProps) {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>📋 History</Text>
                <Text style={styles.count}>{history.length} scans</Text>
            </View>

            {/* New Scan Button */}
            <TouchableOpacity style={styles.newScanBtn} onPress={onNewScan} activeOpacity={0.8}>
                <Text style={styles.newScanText}>＋  New Scan</Text>
            </TouchableOpacity>

            {/* History List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color={Colors.primaryLight} size="small" />
                </View>
            ) : history.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🌱</Text>
                    <Text style={styles.emptyText}>No scans yet</Text>
                    <Text style={styles.emptySubtext}>Upload a plant image to get started</Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <HistoryItem
                            scan={item}
                            isSelected={selectedId === item.id}
                            onPress={onSelectScan}
                        />
                    )}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                />
            )}

            {/* Clear History */}
            {history.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={onClearHistory} activeOpacity={0.7}>
                    <Text style={styles.clearText}>Clear History</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRightWidth: 1,
        borderRightColor: Colors.border,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    title: {
        color: Colors.text,
        fontSize: FontSize.lg,
        fontWeight: '700',
    },
    count: {
        color: Colors.textMuted,
        fontSize: FontSize.xs,
        backgroundColor: Colors.surfaceLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    newScanBtn: {
        marginHorizontal: Spacing.sm,
        marginBottom: Spacing.sm,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    newScanText: {
        color: Colors.textOnPrimary,
        fontSize: FontSize.md,
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: Spacing.md,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: Spacing.sm,
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: FontSize.md,
        fontWeight: '600',
        marginBottom: 4,
    },
    emptySubtext: {
        color: Colors.textMuted,
        fontSize: FontSize.sm,
        textAlign: 'center',
    },
    clearBtn: {
        padding: Spacing.sm,
        margin: Spacing.sm,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    clearText: {
        color: Colors.textMuted,
        fontSize: FontSize.sm,
    },
});
