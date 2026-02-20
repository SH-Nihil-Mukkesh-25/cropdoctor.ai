import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Animated,
    useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { ScanRecord } from '../types';
import { getHistory, clearHistory } from '../services/storage';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../constants/theme';
import Sidebar from '../components/Sidebar';
import Workspace from '../components/Workspace';

const BREAKPOINT = 768;

/**
 * Cross-platform confirm dialog.
 * Alert.alert is a no-op on web, so we use window.confirm there.
 */
function confirmAction(title: string, message: string, onConfirm: () => void) {
    if (Platform.OS === 'web') {
        if (window.confirm(`${title}\n\n${message}`)) {
            onConfirm();
        }
    } else {
        // React Native Alert works on iOS/Android
        const { Alert } = require('react-native');
        Alert.alert(title, message, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'OK', style: 'destructive', onPress: onConfirm },
        ]);
    }
}

export default function DashboardScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();

    const [history, setHistory] = useState<ScanRecord[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [slideAnim] = useState(() => new Animated.Value(-screenWidth));
    // This key forces a full remount of Workspace, guaranteeing a clean slate
    const [workspaceKey, setWorkspaceKey] = useState(0);

    const isTablet = screenWidth >= BREAKPOINT;
    const sidebarWidth = isTablet ? 280 : Math.min(screenWidth * 0.82, 320);
    const userId = user?.id || '';

    // Load user-specific history
    const loadHistory = useCallback(async () => {
        if (!userId) return;
        setHistoryLoading(true);
        const data = await getHistory(userId);
        setHistory(data);
        setHistoryLoading(false);
    }, [userId]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // Toggle sidebar animation (phone only)
    const toggleSidebar = () => {
        const toValue = sidebarOpen ? -sidebarWidth : 0;
        setSidebarOpen(!sidebarOpen);
        Animated.spring(slideAnim, {
            toValue,
            useNativeDriver: true,
            friction: 8,
            tension: 65,
        }).start();
    };

    const closeSidebar = () => {
        if (sidebarOpen) {
            setSidebarOpen(false);
            Animated.spring(slideAnim, {
                toValue: -sidebarWidth,
                useNativeDriver: true,
                friction: 8,
                tension: 65,
            }).start();
        }
    };

    const handleSelectScan = (scan: ScanRecord) => {
        setSelectedScan(scan);
        if (!isTablet) closeSidebar();
    };

    const handleNewScan = () => {
        setSelectedScan(null);
        // Increment key to force Workspace remount — guarantees clean state
        setWorkspaceKey((k) => k + 1);
        if (!isTablet) closeSidebar();
    };

    const handleClearHistory = () => {
        confirmAction(
            'Clear History',
            'This will remove all your saved scan results. Are you sure?',
            async () => {
                await clearHistory(userId);
                setHistory([]);
                setSelectedScan(null);
                setWorkspaceKey((k) => k + 1);
            },
        );
    };

    const handleLogout = () => {
        confirmAction(
            'Logout',
            'Are you sure you want to log out?',
            async () => {
                await logout();
                router.replace('/login');
            },
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <View style={styles.topBarLeft}>
                    {!isTablet && (
                        <TouchableOpacity style={styles.menuBtn} onPress={toggleSidebar} activeOpacity={0.7}>
                            <Text style={styles.menuIcon}>{sidebarOpen ? '✕' : '☰'}</Text>
                        </TouchableOpacity>
                    )}
                    <Text style={styles.topBarTitle}>🌱 CropGuard</Text>
                </View>
                <View style={styles.topBarRight}>
                    <View style={styles.userBadge}>
                        <Text style={styles.userAvatar}>
                            {(user?.name || user?.email || '?')[0].toUpperCase()}
                        </Text>
                    </View>
                    {isTablet && (
                        <Text style={styles.userName} numberOfLines={1}>
                            {user?.name || user?.email}
                        </Text>
                    )}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
                {/* Tablet: fixed sidebar */}
                {isTablet && (
                    <View style={[styles.sidebarFixed, { width: sidebarWidth }]}>
                        <Sidebar
                            history={history}
                            selectedId={selectedScan?.id || null}
                            onSelectScan={handleSelectScan}
                            onClearHistory={handleClearHistory}
                            loading={historyLoading}
                            onNewScan={handleNewScan}
                        />
                    </View>
                )}

                {/* Workspace — key prop forces remount on "New Scan" */}
                <View style={styles.workspaceArea}>
                    <Workspace
                        key={workspaceKey}
                        userId={userId}
                        selectedScan={selectedScan}
                        onScanComplete={loadHistory}
                        onNewScan={handleNewScan}
                    />
                </View>

                {/* Phone: animated slide-in sidebar */}
                {!isTablet && (
                    <>
                        {sidebarOpen && (
                            <TouchableOpacity
                                style={styles.backdrop}
                                activeOpacity={1}
                                onPress={closeSidebar}
                            />
                        )}
                        <Animated.View
                            style={[
                                styles.sidebarAnimated,
                                {
                                    width: sidebarWidth,
                                    transform: [{ translateX: slideAnim }],
                                    top: 0,
                                    bottom: 0,
                                },
                            ]}
                        >
                            <Sidebar
                                history={history}
                                selectedId={selectedScan?.id || null}
                                onSelectScan={handleSelectScan}
                                onClearHistory={handleClearHistory}
                                loading={historyLoading}
                                onNewScan={handleNewScan}
                            />
                        </Animated.View>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        minHeight: 48,
        ...Shadows.sm,
    },
    topBarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    menuBtn: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.surfaceLight,
    },
    menuIcon: {
        fontSize: 18,
        color: Colors.text,
    },
    topBarTitle: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.primaryLight,
    },
    topBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    userBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userAvatar: {
        color: Colors.textOnPrimary,
        fontSize: FontSize.xs,
        fontWeight: '700',
    },
    userName: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        maxWidth: 120,
    },
    logoutBtn: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 5,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    logoutText: {
        color: Colors.textMuted,
        fontSize: FontSize.xs,
        fontWeight: '600',
    },
    mainContent: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebarFixed: {
        borderRightWidth: 1,
        borderRightColor: Colors.border,
    },
    workspaceArea: {
        flex: 1,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.overlay,
        zIndex: 10,
    },
    sidebarAnimated: {
        position: 'absolute',
        left: 0,
        zIndex: 20,
        backgroundColor: Colors.surface,
        ...Shadows.lg,
    },
});
