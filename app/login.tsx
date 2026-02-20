import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
    Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, FontSize, Shadows, Glass } from '../constants/theme';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const { login, signup } = useAuth();
    const router = useRouter();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const logoGlow = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1, duration: 800,
                easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0, duration: 800,
                easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(logoGlow, {
                    toValue: 1, duration: 2000,
                    easing: Easing.inOut(Easing.sin), useNativeDriver: true,
                }),
                Animated.timing(logoGlow, {
                    toValue: 0.3, duration: 2000,
                    easing: Easing.inOut(Easing.sin), useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handleSubmit = async () => {
        if (!email.trim()) { setError('Please enter your email'); return; }
        if (!password.trim() || password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (isSignUp && password !== confirmPassword) { setError('Passwords do not match'); return; }

        setLoading(true);
        setError(null);
        try {
            if (isSignUp) { await signup(email, password); } else { await login(email, password); }
            router.replace('/dashboard');
        } catch (e: any) {
            setError(e.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const getInputStyle = (field: string) => [
        styles.inputRow,
        focusedField === field ? styles.inputRowFocused : null,
    ];

    return (
        <LinearGradient
            colors={[Colors.primaryDeep, Colors.gradientMid, Colors.gradientEnd]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <Animated.View
                    style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
                >
                    <View style={styles.brandSection}>
                        <View style={styles.logoContainer}>
                            <Animated.View style={[styles.logoGlowRing, { opacity: logoGlow }]} />
                            <View style={styles.logoMark}>
                                <Ionicons name="leaf" size={30} color={Colors.accent} />
                            </View>
                        </View>
                        <Text style={styles.appName}>Smart Leaf Health</Text>
                        <Text style={styles.tagline}>AI-Powered Plant Diagnostics</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>
                            {isSignUp ? 'Create your account' : 'Welcome back'}
                        </Text>
                        <Text style={styles.cardSubtitle}>
                            {isSignUp ? 'Start diagnosing plant health today' : 'Sign in to continue'}
                        </Text>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Email address</Text>
                            <View style={getInputStyle('email')}>
                                <Ionicons name="mail-outline" size={16} color={Colors.textMuted} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="you@example.com"
                                    placeholderTextColor={Colors.textMuted}
                                    value={email}
                                    onChangeText={(t) => { setEmail(t); setError(null); }}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={getInputStyle('password')}>
                                <Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Min. 6 characters"
                                    placeholderTextColor={Colors.textMuted}
                                    value={password}
                                    onChangeText={(t) => { setPassword(t); setError(null); }}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        {isSignUp && (
                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>Confirm password</Text>
                                <View style={getInputStyle('confirm')}>
                                    <Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Re-enter password"
                                        placeholderTextColor={Colors.textMuted}
                                        value={confirmPassword}
                                        onChangeText={(t) => { setConfirmPassword(t); setError(null); }}
                                        onFocus={() => setFocusedField('confirm')}
                                        onBlur={() => setFocusedField(null)}
                                        secureTextEntry
                                    />
                                </View>
                            </View>
                        )}

                        {error && (
                            <View style={styles.errorBox}>
                                <Ionicons name="alert-circle" size={15} color={Colors.danger} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.primaryDeep} size="small" />
                            ) : (
                                <View style={styles.submitInner}>
                                    <Ionicons name="arrow-forward" size={18} color={Colors.primaryDeep} />
                                    <Text style={styles.submitBtnText}>
                                        {isSignUp ? 'Create Account' : 'Sign In'}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => { setIsSignUp(!isSignUp); setError(null); setConfirmPassword(''); }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.toggleText}>
                                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                                <Text style={styles.toggleLink}>{isSignUp ? 'Sign in' : 'Sign up'}</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    brandSection: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    logoContainer: {
        width: 72,
        height: 72,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    logoGlowRing: {
        position: 'absolute',
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.accentGlow,
        ...Shadows.glow,
    },
    logoMark: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 230, 118, 0.12)',
        borderWidth: 1,
        borderColor: Colors.borderAccent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appName: {
        fontSize: FontSize.hero,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: -0.8,
    },
    tagline: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
        marginTop: 4,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    card: {
        width: '100%',
        maxWidth: 420,
        ...Glass.card,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        gap: Spacing.md,
        ...Shadows.md,
    },
    cardTitle: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        color: Colors.text,
    },
    cardSubtitle: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
        marginTop: -8,
        marginBottom: Spacing.xs,
    },
    fieldGroup: {
        gap: 6,
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        ...Glass.input,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
    },
    inputRowFocused: {
        ...Glass.inputFocused,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: FontSize.md,
        color: Colors.text,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.dangerBg,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.dangerGlow,
    },
    errorText: {
        color: Colors.danger,
        fontSize: FontSize.sm,
        fontWeight: '500',
        flex: 1,
    },
    submitBtn: {
        backgroundColor: Colors.accent,
        borderRadius: BorderRadius.md,
        paddingVertical: 15,
        alignItems: 'center',
        ...Shadows.glowSm,
    },
    submitBtnDisabled: {
        opacity: 0.6,
    },
    submitInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    submitBtnText: {
        color: Colors.primaryDeep,
        fontSize: FontSize.md,
        fontWeight: '700',
    },
    toggleText: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
        textAlign: 'center',
    },
    toggleLink: {
        color: Colors.accent,
        fontWeight: '600',
    },
});
