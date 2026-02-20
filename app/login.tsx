import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '../constants/theme';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const { login, signup } = useAuth();
    const router = useRouter();

    const handleSubmit = async () => {
        if (!email.trim()) {
            setError('Please enter your email');
            return;
        }
        if (!password.trim() || password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (isSignUp && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                await signup(email, password);
            } else {
                await login(email, password);
            }
            router.replace('/dashboard');
        } catch (e: any) {
            setError(e.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.inner}>
                {/* Branding */}
                <View style={styles.brandSection}>
                    <Text style={styles.logoIcon}>🌱</Text>
                    <Text style={styles.appName}>CropGuard</Text>
                    <Text style={styles.tagline}>AI-Powered Plant Disease Detection</Text>
                </View>

                {/* Login / Signup Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
                    <Text style={styles.cardSubtitle}>
                        {isSignUp ? 'Sign up to start detecting plant diseases' : 'Sign in to continue'}
                    </Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="you@example.com"
                            placeholderTextColor={Colors.textMuted}
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setError(null);
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Min. 6 characters"
                            placeholderTextColor={Colors.textMuted}
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setError(null);
                            }}
                            secureTextEntry
                        />
                    </View>

                    {isSignUp && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Confirm Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Re-enter your password"
                                placeholderTextColor={Colors.textMuted}
                                value={confirmPassword}
                                onChangeText={(text) => {
                                    setConfirmPassword(text);
                                    setError(null);
                                }}
                                secureTextEntry
                            />
                        </View>
                    )}

                    {error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>⚠  {error}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.loginBtnText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                            setConfirmPassword('');
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.toggleText}>
                            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                            <Text style={styles.toggleLink}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>Protect your crops with AI 🌾</Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
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
    logoIcon: {
        fontSize: 72,
        marginBottom: Spacing.sm,
    },
    appName: {
        fontSize: FontSize.hero,
        fontWeight: '800',
        color: Colors.primaryLight,
        letterSpacing: 1,
    },
    tagline: {
        fontSize: FontSize.md,
        color: Colors.textMuted,
        marginTop: Spacing.xs,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        gap: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.lg,
    },
    cardTitle: {
        fontSize: FontSize.xxl,
        fontWeight: '700',
        color: Colors.text,
    },
    cardSubtitle: {
        fontSize: FontSize.md,
        color: Colors.textMuted,
        marginBottom: Spacing.sm,
    },
    inputGroup: {
        gap: Spacing.xs,
    },
    inputLabel: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    input: {
        backgroundColor: Colors.surfaceLight,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: FontSize.md,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    errorBox: {
        backgroundColor: Colors.disease + '15',
        borderRadius: BorderRadius.sm,
        padding: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.disease + '33',
    },
    errorText: {
        color: Colors.disease,
        fontSize: FontSize.sm,
        fontWeight: '500',
    },
    loginBtn: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        marginTop: Spacing.sm,
        ...Shadows.sm,
    },
    loginBtnDisabled: {
        opacity: 0.7,
    },
    loginBtnText: {
        color: Colors.textOnPrimary,
        fontSize: FontSize.lg,
        fontWeight: '700',
    },
    toggleText: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
        textAlign: 'center',
        marginTop: Spacing.xs,
    },
    toggleLink: {
        color: Colors.primaryLight,
        fontWeight: '700',
    },
    footer: {
        marginTop: Spacing.xl,
        fontSize: FontSize.sm,
        color: Colors.textMuted,
    },
});
