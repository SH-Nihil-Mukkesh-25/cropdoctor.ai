import React, { useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Animated, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, FontSize, Shadows, Glass } from '../constants/theme';

interface ImageUploaderProps {
    imageUri: string | null;
    onImageSelected: (uri: string) => void;
    onRemoveImage: () => void;
    loading: boolean;
    onSubmit: () => void;
}

export default function ImageUploader({
    imageUri, onImageSelected, onRemoveImage, loading, onSubmit,
}: ImageUploaderProps) {
    const pulseScale = useRef(new Animated.Value(1)).current;
    const pulseOpacity = useRef(new Animated.Value(0.6)).current;
    const scanLineY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(pulseScale, {
                        toValue: 1.25, duration: 2000,
                        easing: Easing.inOut(Easing.sin), useNativeDriver: true,
                    }),
                    Animated.timing(pulseOpacity, {
                        toValue: 0, duration: 2000,
                        easing: Easing.out(Easing.cubic), useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(pulseScale, {
                        toValue: 1, duration: 0, useNativeDriver: true,
                    }),
                    Animated.timing(pulseOpacity, {
                        toValue: 0.6, duration: 0, useNativeDriver: true,
                    }),
                ]),
            ])
        ).start();
    }, []);

    useEffect(() => {
        if (loading) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanLineY, {
                        toValue: 1, duration: 1800,
                        easing: Easing.inOut(Easing.sin), useNativeDriver: true,
                    }),
                    Animated.timing(scanLineY, {
                        toValue: 0, duration: 1800,
                        easing: Easing.inOut(Easing.sin), useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            scanLineY.setValue(0);
        }
    }, [loading]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) onImageSelected(result.assets[0].uri);
    };

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return;
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true, aspect: [4, 3], quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) onImageSelected(result.assets[0].uri);
    };

    if (imageUri) {
        const scanTranslateY = scanLineY.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 250],
        });

        return (
            <View style={styles.previewContainer}>
                <View style={styles.previewImageWrap}>
                    <Image source={{ uri: imageUri }} style={styles.previewImage} />
                    {loading && (
                        <View style={styles.scanOverlay}>
                            <View style={styles.meshGrid}>
                                {[0, 1, 2].map(i => (
                                    <View key={`h${i}`} style={[styles.meshLineH, { top: `${25 * (i + 1)}%` }]} />
                                ))}
                                {[0, 1, 2].map(i => (
                                    <View key={`v${i}`} style={[styles.meshLineV, { left: `${25 * (i + 1)}%` }]} />
                                ))}
                            </View>
                            <Animated.View style={[
                                styles.scanLine,
                                { transform: [{ translateY: scanTranslateY }] },
                            ]} />
                            <View style={[styles.corner, styles.cornerTL]} />
                            <View style={[styles.corner, styles.cornerTR]} />
                            <View style={[styles.corner, styles.cornerBL]} />
                            <View style={[styles.corner, styles.cornerBR]} />
                            <View style={styles.scanLabel}>
                                <View style={styles.scanDot} />
                                <Text style={styles.scanLabelText}>AI Analyzing...</Text>
                            </View>
                        </View>
                    )}
                </View>
                <View style={styles.previewActions}>
                    {!loading && (
                        <TouchableOpacity style={styles.removeBtn} onPress={onRemoveImage} activeOpacity={0.7}>
                            <Ionicons name="close" size={16} color={Colors.textMuted} />
                            <Text style={styles.removeBtnText}>Remove</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.analyzeBtn, loading && styles.analyzeBtnActive]}
                        onPress={onSubmit} disabled={loading} activeOpacity={0.8}
                    >
                        {loading ? (
                            <View style={styles.row}>
                                <ActivityIndicator color={Colors.primaryDeep} size="small" />
                                <Text style={styles.analyzeBtnText}>  Scanning...</Text>
                            </View>
                        ) : (
                            <View style={styles.row}>
                                <Ionicons name="scan" size={16} color={Colors.primaryDeep} />
                                <Text style={styles.analyzeBtnText}>  Analyze Plant</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.uploadContainer}>
            <View style={styles.uploadBox}>
                <View style={styles.scanBtnContainer}>
                    <Animated.View style={[
                        styles.scanBtnPulse,
                        { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                    ]} />
                    <TouchableOpacity style={styles.scanBtn} onPress={takePhoto} activeOpacity={0.8}>
                        <Ionicons name="scan-outline" size={36} color={Colors.primaryDeep} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.uploadTitle}>Scan Leaf</Text>
                <Text style={styles.uploadSubtext}>
                    Point your camera at a leaf or select from gallery to detect diseases
                </Text>

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.galleryBtn} onPress={pickImage} activeOpacity={0.8}>
                        <Ionicons name="images-outline" size={16} color={Colors.textSecondary} />
                        <Text style={styles.galleryBtnText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto} activeOpacity={0.8}>
                        <Ionicons name="camera-outline" size={16} color={Colors.primaryDeep} />
                        <Text style={styles.cameraBtnText}>Camera</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    uploadContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
    uploadBox: {
        width: '100%', maxWidth: 400,
        paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.xxl,
        ...Glass.card,
        alignItems: 'center', gap: Spacing.md,
    },
    scanBtnContainer: {
        width: 100, height: 100,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    scanBtnPulse: {
        position: 'absolute',
        width: 100, height: 100,
        borderRadius: 50,
        backgroundColor: Colors.accent,
    },
    scanBtn: {
        width: 80, height: 80,
        borderRadius: 40,
        backgroundColor: Colors.accent,
        justifyContent: 'center', alignItems: 'center',
        ...Shadows.glow,
    },
    uploadTitle: {
        color: Colors.text, fontSize: FontSize.xxl, fontWeight: '700',
        textAlign: 'center', letterSpacing: -0.5,
    },
    uploadSubtext: {
        color: Colors.textMuted, fontSize: FontSize.md, textAlign: 'center',
        lineHeight: 22,
    },
    buttonRow: { flexDirection: 'row', gap: Spacing.md, width: '100%', marginTop: Spacing.sm },
    galleryBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 13, borderRadius: BorderRadius.md,
        ...Glass.card,
    },
    galleryBtnText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
    cameraBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 13, borderRadius: BorderRadius.md,
        backgroundColor: Colors.accent, ...Shadows.glowSm,
    },
    cameraBtnText: { color: Colors.primaryDeep, fontSize: FontSize.md, fontWeight: '700' },
    previewContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        padding: Spacing.lg, gap: Spacing.lg,
    },
    previewImageWrap: {
        width: '100%', maxWidth: 420, borderRadius: BorderRadius.xl,
        overflow: 'hidden', ...Shadows.md,
        borderWidth: 1, borderColor: Colors.border,
    },
    previewImage: { width: '100%', aspectRatio: 4 / 3, backgroundColor: Colors.surfaceHover },
    scanOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 230, 118, 0.04)',
    },
    meshGrid: {
        ...StyleSheet.absoluteFillObject,
    },
    meshLineH: {
        position: 'absolute', left: 0, right: 0, height: 1,
        backgroundColor: 'rgba(0, 230, 118, 0.15)',
    },
    meshLineV: {
        position: 'absolute', top: 0, bottom: 0, width: 1,
        backgroundColor: 'rgba(0, 230, 118, 0.15)',
    },
    scanLine: {
        position: 'absolute', left: 0, right: 0,
        height: 2,
        backgroundColor: Colors.accent,
        ...Shadows.glow,
    },
    corner: {
        position: 'absolute', width: 20, height: 20,
        borderColor: Colors.accent,
    },
    cornerTL: { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2 },
    cornerTR: { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2 },
    cornerBL: { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2 },
    cornerBR: { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2 },
    scanLabel: {
        position: 'absolute', bottom: 16, alignSelf: 'center',
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: BorderRadius.full,
    },
    scanDot: {
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: Colors.accent,
    },
    scanLabelText: {
        color: Colors.accent, fontSize: FontSize.xs, fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: 1,
    },
    previewActions: { flexDirection: 'row', gap: Spacing.md, width: '100%', maxWidth: 420 },
    removeBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 13, borderRadius: BorderRadius.md,
        ...Glass.card,
    },
    removeBtnText: { color: Colors.textMuted, fontSize: FontSize.md, fontWeight: '500' },
    analyzeBtn: {
        flex: 2, paddingVertical: 13, borderRadius: BorderRadius.md,
        backgroundColor: Colors.accent, alignItems: 'center',
        ...Shadows.glowSm,
    },
    analyzeBtnActive: {
        backgroundColor: Colors.accentMuted,
    },
    analyzeBtnText: { color: Colors.primaryDeep, fontSize: FontSize.md, fontWeight: '700' },
    row: { flexDirection: 'row', alignItems: 'center' },
});
