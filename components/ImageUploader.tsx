import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '../constants/theme';

interface ImageUploaderProps {
    imageUri: string | null;
    onImageSelected: (uri: string) => void;
    onRemoveImage: () => void;
    loading: boolean;
    onSubmit: () => void;
}

export default function ImageUploader({
    imageUri,
    onImageSelected,
    onRemoveImage,
    loading,
    onSubmit,
}: ImageUploaderProps) {
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            onImageSelected(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return;

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            onImageSelected(result.assets[0].uri);
        }
    };

    if (imageUri) {
        return (
            <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <View style={styles.previewActions}>
                    {!loading && (
                        <TouchableOpacity style={styles.removeBtn} onPress={onRemoveImage} activeOpacity={0.7}>
                            <Text style={styles.removeBtnText}>✕  Remove</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
                        onPress={onSubmit}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <View style={styles.loadingRow}>
                                <ActivityIndicator color={Colors.white} size="small" />
                                <Text style={styles.analyzeBtnText}>  Analyzing...</Text>
                            </View>
                        ) : (
                            <Text style={styles.analyzeBtnText}>🔬  Analyze Plant</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.uploadContainer}>
            <View style={styles.uploadBox}>
                <Text style={styles.uploadIcon}>🌿</Text>
                <Text style={styles.uploadTitle}>Upload Plant Image</Text>
                <Text style={styles.uploadSubtext}>
                    Take a photo or select from your gallery to detect diseases
                </Text>

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.galleryBtn} onPress={pickImage} activeOpacity={0.8}>
                        <Text style={styles.galleryBtnText}>📁  Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto} activeOpacity={0.8}>
                        <Text style={styles.cameraBtnText}>📸  Camera</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    uploadContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    uploadBox: {
        width: '100%',
        maxWidth: 400,
        padding: Spacing.xxl,
        borderRadius: BorderRadius.xl,
        borderWidth: 2,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        backgroundColor: Colors.surface,
        alignItems: 'center',
        gap: Spacing.sm,
        ...Shadows.md,
    },
    uploadIcon: {
        fontSize: 64,
        marginBottom: Spacing.sm,
    },
    uploadTitle: {
        color: Colors.text,
        fontSize: FontSize.xl,
        fontWeight: '700',
        textAlign: 'center',
    },
    uploadSubtext: {
        color: Colors.textMuted,
        fontSize: FontSize.md,
        textAlign: 'center',
        marginBottom: Spacing.md,
        lineHeight: 22,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    galleryBtn: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.surfaceElevated,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        alignItems: 'center',
    },
    galleryBtnText: {
        color: Colors.text,
        fontSize: FontSize.md,
        fontWeight: '600',
    },
    cameraBtn: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary,
        alignItems: 'center',
    },
    cameraBtnText: {
        color: Colors.textOnPrimary,
        fontSize: FontSize.md,
        fontWeight: '600',
    },

    // Preview states
    previewContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
        gap: Spacing.lg,
    },
    previewImage: {
        width: '100%',
        maxWidth: 400,
        aspectRatio: 4 / 3,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.surfaceLight,
        ...Shadows.lg,
    },
    previewActions: {
        flexDirection: 'row',
        gap: Spacing.md,
        width: '100%',
        maxWidth: 400,
    },
    removeBtn: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
        alignItems: 'center',
    },
    removeBtnText: {
        color: Colors.textMuted,
        fontSize: FontSize.md,
        fontWeight: '600',
    },
    analyzeBtn: {
        flex: 2,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        ...Shadows.sm,
    },
    analyzeBtnDisabled: {
        backgroundColor: Colors.primaryDark,
        opacity: 0.7,
    },
    analyzeBtnText: {
        color: Colors.textOnPrimary,
        fontSize: FontSize.md,
        fontWeight: '700',
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
