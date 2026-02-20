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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { ScanRecord } from '../types';
import { getHistory, clearHistory } from '../services/storage';
import { Colors, Spacing, FontSize, BorderRadius, Shadows, Glass } from '../constants/theme';
import Sidebar from '../components/Sidebar';
import Workspace from '../components/Workspace';

const BREAKPOINT = 768;

function confirmAction(title: string, message: string, onConfirm: () => void) {
    if (Platform.OS === 'web') {
        if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    } else {
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
    const [workspaceKey, setWorkspaceKey] = useState(0);

    const isTablet = screenWidth >= BREAKPOINT;
    const sidebarWidth = isTablet ? 300 : Math.min(screenWidth * 0.85, 340);
    const userId = user?.id || '';

    const loadHistory = useCallback(async () => {
        if (!userId) return;
        setHistoryLoading(true);
        const data = await getHistory(userId);
        setHistory(data);
        setHistoryLoading(false);
    }, [userId]);

    useEffect(() => { loadHistory(); }, [loadHistory]);

    const toggleSidebar = () => {
        const toValue = sidebarOpen ? -sidebarWidth : 0;
        setSidebarOpen(!sidebarOpen);
        Animated.spring(slideAnim, { toValue, useNativeDriver: true, friction: 8, tension: 65 }).start();
    };

    const closeSidebar = () => {
        if (!sidebarOpen) return;
        setSidebarOpen(false);
        Animated.spring(slideAnim, {
            toValue: -sidebarWidth, useNativeDriver: true, friction: 8, tension: 65
        }).start();
    };

    const handleSelectScan = (scan: ScanRecord) => { setSelectedScan(scan); if (!isTablet) closeSidebar(); };
    const handleNewScan = () => { setSelectedScan(null); setWorkspaceKey(k => k + 1); if (!isTablet) closeSidebar(); };

    const handleClearHistory = () => {
        confirmAction('Clear History', 'Remove all saved scan results?', async () => {
            await clearHistory(userId); setHistory([]); setSelectedScan(null); setWorkspaceKey(k => k + 1);
        });
    };

    const handleLogout = () => {
        confirmAction('Logout', 'Are you sure you want to log out?', async () => {
            await logout(); router.replace('/login');
        });
    };

    const userInitial = (user?.name || user?.email || '?')[0].toUpperCase();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.topBar}>
                <View style={styles.topBarLeft}>
                    {!isTablet && (
                        <TouchableOpacity style={styles.iconBtn} onPress={toggleSidebar} activeOpacity={0.7}>
                            <Ionicons name={sidebarOpen ? 'close' : 'menu'} size={20} color={Colors.text} />
                        </TouchableOpacity>
                    )}
                    <View style={styles.topBarBrand}>
                        <Ionicons name="leaf" size={18} color={Colors.accent} />
                        <Text style={styles.topBarTitle}>Smart Leaf Health</Text>
                    </View>
                </View>
                <View style={styles.topBarRight}>
                    <View style={styles.avatarGlow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{userInitial}</Text>
                        </View>
                    </View>
                    {isTablet && (
                        <Text style={styles.userName} numberOfLines={1}>
                            {user?.name || user?.email}
                        </Text>
                    )}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                        <Ionicons name="log-out-outline" size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>

            <LinearGradient
                colors={['transparent', Colors.accentGlow, 'transparent']}
                style={styles.accentLine}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            />

            <View style={styles.mainContent}>
                {isTablet && (
                    <View style={[styles.sidebarFixed, { width: sidebarWidth }]}>
                        <Sidebar history={history} selectedId={selectedScan?.id || null}
                            onSelectScan={handleSelectScan} onClearHistory={handleClearHistory}
                            loading={historyLoading} onNewScan={handleNewScan} />
                    </View>
                )}
                <View style={styles.workspaceArea}>
                    <Workspace key={workspaceKey} userId={userId} selectedScan={selectedScan}
                        onScanComplete={loadHistory} onNewScan={handleNewScan} />
                </View>
                {!isTablet && (
                    <>
                        {sidebarOpen && (
                            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeSidebar} />
                        )}
                        <Animated.View style={[styles.sidebarAnimated, {
                            width: sidebarWidth, transform: [{ translateX: slideAnim }], top: 0, bottom: 0,
                        }]}>
                            <Sidebar history={history} selectedId={selectedScan?.id || null}
                                onSelectScan={handleSelectScan} onClearHistory={handleClearHistory}
                                loading={historyLoading} onNewScan={handleNewScan} />
                        </Animated.View>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: 12,
        backgroundColor: Colors.surfaceSolid,
    },
    topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    topBarBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconBtn: {
        width: 38, height: 38,
        justifyContent: 'center', alignItems: 'center',
        borderRadius: BorderRadius.sm,
        ...Glass.surface,
    },
    topBarTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: -0.3,
    },
    accentLine: {
        height: 1,
    },
    topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatarGlow: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.accentMuted,
    },
    avatar: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '700' },
    userName: { color: Colors.textSecondary, fontSize: FontSize.sm, maxWidth: 140 },
    logoutBtn: {
        width: 36, height: 36,
        justifyContent: 'center', alignItems: 'center',
        borderRadius: BorderRadius.sm,
        ...Glass.surface,
    },
    mainContent: { flex: 1, flexDirection: 'row' },
    sidebarFixed: { borderRightWidth: 1, borderRightColor: Colors.border },
    workspaceArea: { flex: 1 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.overlay, zIndex: 10 },
    sidebarAnimated: {
        position: 'absolute', left: 0, zIndex: 20,
        backgroundColor: Colors.surfaceSolid, ...Shadows.lg,
    },
});
