    import React, { useState, useRef } from 'react';
    import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Modal, Platform } from 'react-native';
    import { Audio } from 'expo-av';
    import { DetectionResult, ScanRecord } from '../types';
    import { Colors, BorderRadius, Spacing, FontSize, Shadows } from '../constants/theme';
    import ImageUploader from './ImageUploader';
    import ResultsView from './ResultsView';
    import { analyzeAndDetectDisease, analyzeWithUserQuery } from '../services/gemini';
    import { saveToHistory, generateScanId } from '../services/storage';
    import { transcribeAudio } from '../services/sarvamSTT';

    interface WorkspaceProps {
        userId: string;
        selectedScan: ScanRecord | null;
        onScanComplete: () => void;
        onNewScan: () => void;
    }

    export default function Workspace({ userId, selectedScan, onScanComplete, onNewScan }: WorkspaceProps) {
        const [imageUri, setImageUri] = useState<string | null>(null);
        const [loading, setLoading] = useState(false);
        const [result, setResult] = useState<DetectionResult | null>(null);
        const [error, setError] = useState<string | null>(null);

        // Voice input state
        const [recording, setRecording] = useState<Audio.Recording | null>(null);
        const [isRecording, setIsRecording] = useState(false);
        const [transcription, setTranscription] = useState<string | null>(null);
        const [isTranscribing, setIsTranscribing] = useState(false);
        const [showPreviewModal, setShowPreviewModal] = useState(false);

        if (selectedScan) {
            return (
                <View style={{ flex: 1 }}>
                    <ResultsView imageUri={selectedScan.imageUri} result={selectedScan.result}
                        onNewScan={onNewScan} isFromHistory={true} />
                </View>
            );
        }

        if (result && imageUri) {
            return (
                <View style={{ flex: 1 }}>
                    <ResultsView imageUri={imageUri} result={result} onNewScan={onNewScan} />
                </View>
            );
        }

        const startRecording = async () => {
            try {
                await Audio.requestPermissionsAsync();
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                });

                const { recording: newRecording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );

                setRecording(newRecording);
                setIsRecording(true);
                setError(null);
            } catch (err: any) {
                setError("Microphone permission denied or not available.");
                console.error(err);
            }
        };

        const stopRecording = async () => {
            if (!recording) return;

            setIsRecording(false);
            setIsTranscribing(true);

            try {
                await recording.stopAndUnloadAsync();
                await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
                
                const uri = recording.getURI();
                
                if (uri) {
                    let blob;
                    if (Platform.OS === 'web') {
                        const response = await fetch(uri);
                        blob = await response.blob();
                    }
                    
                    const text = await transcribeAudio(uri, blob);
                    setTranscription(text);
                    setShowPreviewModal(true);
                }
            } catch (err: any) {
                setError("Transcription failed: " + err.message);
                console.error(err);
            } finally {
                setIsTranscribing(false);
                setRecording(null);
            }
        };

        const handleSubmit = async () => {
            if (!imageUri) {
                setError('Please select an image first.');
                setShowPreviewModal(false);
                return;
            }
            setLoading(true); setError(null); setShowPreviewModal(false);
            try {
                const det = transcription
                    ? await analyzeWithUserQuery(imageUri, transcription)
                    : await analyzeAndDetectDisease(imageUri);

                const enrichedResult = { ...det };
                setResult(enrichedResult);
                const scan: ScanRecord = { id: generateScanId(), imageUri, result: enrichedResult, timestamp: Date.now() };
                await saveToHistory(userId, scan);
                onScanComplete();
            } catch (e: any) {
                setError(e.message || 'Analysis failed. Please try again.');
            } finally { setLoading(false); setTranscription(null); }
        };

        return (
            <View style={{ flex: 1, backgroundColor: Colors.background }}>
                <ImageUploader imageUri={imageUri}
                    onImageSelected={(uri) => { setImageUri(uri); setError(null); }}
                    onRemoveImage={() => { setImageUri(null); setError(null); }}
                    loading={loading} onSubmit={handleSubmit} />

                {!loading && (
                    <View style={styles.fabContainer}>
                        {isTranscribing ? (
                            <View style={styles.fab}>
                                <ActivityIndicator color={Colors.surface} />
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.fab, isRecording && styles.fabRecording]}
                                onPressIn={startRecording}
                                onPressOut={stopRecording}
                                activeOpacity={0.8}
                            >
                                <Text style={{ fontSize: 24 }}>🎤</Text>
                            </TouchableOpacity>
                        )}
                        <Text style={styles.fabLabel}>Hold to ask</Text>
                    </View>
                )}

                <Modal visible={showPreviewModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>You asked:</Text>
                            <Text style={styles.modalText}>"{transcription}"</Text>
                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => { setShowPreviewModal(false); setTranscription(null); }}>
                                    <Text style={styles.modalBtnTextCancel}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleSubmit}>
                                    <Text style={styles.modalBtnTextConfirm}>Send to AI</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {error && (
                    <View style={styles.errorWrap}>
                        <View style={styles.errorBox}>
                            <Text style={{ fontSize: 16 }}>⚠️</Text>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    </View>
                )}
            </View>
        );
    }

    const styles = StyleSheet.create({
        errorWrap: { position: 'absolute', bottom: 20, left: 20, right: 20 },
        errorBox: {
            flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
            backgroundColor: Colors.warningBg, borderRadius: BorderRadius.md,
            padding: Spacing.md, ...Shadows.sm,
            borderWidth: 1, borderColor: Colors.warningGlow,
        },
        errorText: { color: Colors.warning, fontSize: FontSize.sm, fontWeight: '500', flex: 1 },
        fabContainer: {
            position: 'absolute',
            bottom: 90,
            right: 20,
            alignItems: 'center',
            gap: 4,
        },
        fab: {
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: Colors.accent,
            justifyContent: 'center',
            alignItems: 'center',
            ...Shadows.md,
        },
        fabRecording: {
            backgroundColor: Colors.danger,
            transform: [{ scale: 1.1 }],
        },
        fabLabel: {
            color: Colors.textSecondary,
            fontSize: FontSize.xs,
            fontWeight: '600',
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContent: {
            width: '80%',
            backgroundColor: Colors.surface,
            borderRadius: BorderRadius.lg,
            padding: Spacing.lg,
            ...Shadows.lg,
        },
        modalTitle: {
            color: Colors.textSecondary,
            fontSize: FontSize.sm,
            fontWeight: '600',
            marginBottom: Spacing.sm,
        },
        modalText: {
            color: Colors.text,
            fontSize: FontSize.lg,
            fontStyle: 'italic',
            marginBottom: Spacing.lg,
        },
        modalButtons: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: Spacing.md,
        },
        modalBtnCancel: {
            paddingVertical: 8,
            paddingHorizontal: 16,
        },
        modalBtnTextCancel: {
            color: Colors.textSecondary,
            fontWeight: '600',
        },
        modalBtnConfirm: {
            backgroundColor: Colors.accent,
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: BorderRadius.sm,
        },
        modalBtnTextConfirm: {
            color: Colors.background,
            fontWeight: '600',
        },
    });