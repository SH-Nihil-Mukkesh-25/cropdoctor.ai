import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Animated, Easing, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { DetectionResult } from '../types';
import { Colors, Spacing, BorderRadius, FontSize, Shadows, Glass } from '../constants/theme';
import ConfidenceGauge from './ConfidenceGauge';
import { computeSeverity, computeExplainability, computeYieldLoss } from '../services/aiAnalysis';
import { translateText } from '../services/sarvamTranslation';
import { generateSpeech } from '../services/sarvamTTS';
import { transcribeAudio } from '../services/sarvamSTT';
import { analyzeWithUserQuery } from '../services/gemini';

const LANGUAGES = [
    { code: 'en-IN', label: 'English' },
    { code: 'hi-IN', label: 'Hindi' },
    { code: 'ta-IN', label: 'Tamil' },
    { code: 'ml-IN', label: 'Malayalam' },
    { code: 'te-IN', label: 'Telugu' },
    { code: 'kn-IN', label: 'Kannada' },
];

interface ResultsViewProps {
    imageUri: string;
    result: DetectionResult;
    onNewScan: () => void;
    isFromHistory?: boolean;
}

type ToggleKey = 'severity' | 'explainability' | 'yieldLoss';

const TOGGLE_CONFIG: { key: ToggleKey; label: string; icon: string; color: string }[] = [
    { key: 'severity', label: 'Severity', icon: 'speedometer-outline', color: Colors.danger },
    { key: 'explainability', label: 'Explainability', icon: 'git-network-outline', color: Colors.accent },
    { key: 'yieldLoss', label: 'Yield Loss', icon: 'trending-down-outline', color: Colors.warning },
];

export default function ResultsView({ imageUri, result, onNewScan, isFromHistory }: ResultsViewProps) {
    const isHealthy = result.disease.toLowerCase().includes('healthy');
    const statusColor = isHealthy ? Colors.healthy : Colors.warning;
    const statusBg = isHealthy ? Colors.healthyBg : Colors.warningBg;
    const statusGlow = isHealthy ? Colors.healthyGlow : Colors.warningGlow;
    const statusLabel = isHealthy ? 'Healthy' : 'Disease Detected';
    const statusIcon = isHealthy ? 'checkmark-circle' : 'alert-circle';

    const [activeToggles, setActiveToggles] = useState<Record<ToggleKey, boolean>>({
        severity: false, explainability: false, yieldLoss: false,
    });

    const [selectedLanguage, setSelectedLanguage] = useState<string>('en-IN');
    const [isTranslating, setIsTranslating] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    // Voice QA State
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);

    const soundRef = useRef<Audio.Sound | null>(null);
    const webAudioRef = useRef<any>(null);

    // Initial baseContent includes spoken_response (if any)
    const [baseContent, setBaseContent] = useState({
        disease: result.disease,
        recommendations: result.recommendations || [],
        key_points: result.key_points || [],
        action_steps: result.action_steps || [],
        severityDesc: computeSeverity(result).description,
        spoken_response: (result as any).spoken_response || ''
    });

    const [displayContent, setDisplayContent] = useState(baseContent);

    const translationsCache = useRef<Record<string, typeof baseContent>>({
        'en-IN': baseContent
    });

    const severity = useMemo(() => computeSeverity(result), [result]);
    const explainability = useMemo(() => computeExplainability(result), [result]);
    const yieldLoss = useMemo(() => computeYieldLoss(result), [result]);

    const slideAnim = useRef(new Animated.Value(80)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: 0, friction: 6, tension: 50, useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1, duration: 500,
                easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
        ]).start();

        if (Platform.OS !== 'web') {
            Audio.requestPermissionsAsync().then(() => {
                Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    allowsRecordingIOS: true,
                });
            });
        }

        return () => {
            if (soundRef.current) soundRef.current.unloadAsync();
            if (webAudioRef.current) webAudioRef.current.pause();
        };
    }, []);

    useEffect(() => {
        const handleTranslation = async () => {
            if (selectedLanguage === 'en-IN') {
                setDisplayContent(baseContent);
                return;
            }

            if (translationsCache.current[selectedLanguage]) {
                setDisplayContent(translationsCache.current[selectedLanguage]);
                return;
            }

            setIsTranslating(true);

            const safeTranslate = async (text: string, lang: string) => {
                if (!text) return text;
                try {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    return await translateText(text, lang);
                } catch (e) {
                    console.warn(`Translation failed for "${text}". Using original text.`);
                    return text;
                }
            };

            try {
                const translatedDisease = await safeTranslate(baseContent.disease, selectedLanguage);
                const translatedSeverity = await safeTranslate(baseContent.severityDesc, selectedLanguage);
                const translatedSpoken = baseContent.spoken_response
                    ? await safeTranslate(baseContent.spoken_response, selectedLanguage)
                    : '';

                const translatedDict: any = {
                    disease: translatedDisease,
                    severityDesc: translatedSeverity,
                    spoken_response: translatedSpoken,
                    recommendations: [],
                    key_points: [],
                    action_steps: []
                };

                for (const rec of baseContent.recommendations) {
                    translatedDict.recommendations.push(await safeTranslate(rec, selectedLanguage));
                }
                for (const point of baseContent.key_points) {
                    translatedDict.key_points.push(await safeTranslate(point, selectedLanguage));
                }
                for (const step of baseContent.action_steps) {
                    translatedDict.action_steps.push(await safeTranslate(step, selectedLanguage));
                }

                translationsCache.current[selectedLanguage] = translatedDict;
                setDisplayContent(translatedDict);
            } catch (err) {
                console.error("Translation failed:", err);
                setDisplayContent(baseContent);
                setSelectedLanguage('en-IN');
            } finally {
                setIsTranslating(false);
            }
        };

        handleTranslation();
    }, [selectedLanguage, baseContent]);

    const toggleSection = (key: ToggleKey) => {
        setActiveToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const triggerPlayback = async (contentToPlay: any, langToPlay: string) => {
        try {
            setIsPlaying(true);

            // Prioritize the natural conversational response if available
            let textToRead = '';
            if (contentToPlay.spoken_response) {
                textToRead = contentToPlay.spoken_response;
            } else {
                // Fallback to reading bullet points for initial scan
                textToRead = `${contentToPlay.disease}. ${contentToPlay.severityDesc || ''}. `;
                if (contentToPlay.recommendations?.length) {
                    textToRead += `Recommendations: ${contentToPlay.recommendations.join('. ')}. `;
                }
                if (contentToPlay.action_steps?.length) {
                    textToRead += `Action Steps: ${contentToPlay.action_steps.join('. ')}.`;
                }
            }

            const audioUri = await generateSpeech(textToRead, langToPlay);

            if (Platform.OS === 'web') {
                const base64Data = audioUri.split(',')[1];
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'audio/wav' });
                const blobUrl = URL.createObjectURL(blob);

                const audio = new window.Audio(blobUrl);
                webAudioRef.current = audio;

                audio.onended = () => { setIsPlaying(false); webAudioRef.current = null; URL.revokeObjectURL(blobUrl); };
                audio.onerror = (e) => { setIsPlaying(false); webAudioRef.current = null; URL.revokeObjectURL(blobUrl); };
                await audio.play();
            } else {
                if (soundRef.current) await soundRef.current.unloadAsync();
                const { sound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true });
                soundRef.current = sound;
                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        setIsPlaying(false);
                        sound.unloadAsync();
                        soundRef.current = null;
                    }
                });
            }
        } catch (error) {
            console.error("Audio playback error:", error);
            setIsPlaying(false);
        }
    };

    const handlePlayAudio = async () => {
        if (isPlaying) {
            if (Platform.OS === 'web' && webAudioRef.current) {
                webAudioRef.current.pause(); webAudioRef.current = null;
            } else if (soundRef.current) {
                await soundRef.current.pauseAsync();
            }
            setIsPlaying(false);
            return;
        }
        await triggerPlayback(displayContent, selectedLanguage);
    };

    // --- VOICE RECORDING LOGIC ---
    const startRecording = async () => {
        try {
            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone start failed", err);
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        setIsRecording(false);
        setIsProcessingVoice(true);

        try {
            await recording.stopAndUnloadAsync();

            const uri = recording.getURI();
            if (uri) {
                let blob;
                if (Platform.OS === 'web') {
                    const response = await fetch(uri);
                    blob = await response.blob();
                }

                // 1. Get Transcription (STT auto-detects language)
                const transcript = await transcribeAudio(uri, blob);

                // 2. Ask Gemini (Gemini answers in user's language)
                const aiResponse = await analyzeWithUserQuery(imageUri, transcript);

                // 3. Set the new AI content, mapping the spoken_response field!
                const newContent = {
                    disease: aiResponse.disease,
                    recommendations: aiResponse.recommendations,
                    key_points: aiResponse.key_points,
                    action_steps: aiResponse.action_steps,
                    severityDesc: "Answer generated based on your voice query.",
                    spoken_response: aiResponse.spoken_response
                };

                const detectedLang = aiResponse.language_code || 'en-IN';

                // Reset cache to strictly reflect the new conversation context
                translationsCache.current = { [detectedLang]: newContent };

                setBaseContent(newContent);
                setSelectedLanguage(detectedLang);
                setDisplayContent(newContent);

                // 4. Read the AI's natural conversational response aloud
                await triggerPlayback(newContent, detectedLang);
            }
        } catch (err) {
            console.error("Voice flow failed:", err);
        } finally {
            setIsProcessingVoice(false);
            setRecording(null);
        }
    };

    const getSeverityColor = () => {
        if (severity.score >= 80) return Colors.danger;
        if (severity.score >= 60) return Colors.warning;
        if (severity.score >= 40) return '#FFB74D';
        return Colors.healthy;
    };

    const getImpactColor = (impact: string) => {
        if (impact === 'positive') return Colors.healthy;
        if (impact === 'negative') return Colors.danger;
        return Colors.textMuted;
    };

    const getImpactIcon = (impact: string): string => {
        if (impact === 'positive') return 'checkmark-circle';
        if (impact === 'negative') return 'close-circle';
        return 'remove-circle';
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.imageWrap}>
                    <Image source={{ uri: imageUri }} style={styles.image} />
                    {isFromHistory && (
                        <View style={styles.cachedBadge}>
                            <Ionicons name="archive-outline" size={12} color={Colors.textSecondary} />
                            <Text style={styles.cachedText}>Cached</Text>
                        </View>
                    )}
                </View>

                <View style={styles.languageBar}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langScroll}>
                        {LANGUAGES.map(lang => (
                            <TouchableOpacity
                                key={lang.code}
                                style={[styles.langBadge, selectedLanguage === lang.code && styles.langBadgeActive]}
                                onPress={() => setSelectedLanguage(lang.code)}
                                activeOpacity={0.7}
                                disabled={isTranslating || isProcessingVoice}
                            >
                                <Text style={[styles.langText, selectedLanguage === lang.code && styles.langTextActive]}>
                                    {lang.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <Animated.View style={[
                    styles.statusBanner,
                    { backgroundColor: statusBg, borderColor: statusGlow },
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}>
                    <View style={[styles.statusIconWrap, { backgroundColor: statusGlow }]}>
                        <Ionicons name={statusIcon} size={22} color={statusColor} />
                    </View>
                    <View style={styles.statusInfo}>
                        <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
                        {isTranslating || isProcessingVoice ? (
                            <Text style={[styles.diseaseName, { color: Colors.textMuted }]}>Processing...</Text>
                        ) : (
                            <View style={styles.diseaseTitleRow}>
                                <Text style={styles.diseaseName}>{displayContent.disease}</Text>
                                <TouchableOpacity
                                    onPress={handlePlayAudio}
                                    disabled={isTranslating}
                                    style={[styles.speakBtn, isPlaying && styles.speakBtnActive]}
                                >
                                    <Ionicons
                                        name={isPlaying ? "stop-circle-outline" : "volume-high-outline"}
                                        size={20}
                                        color={isPlaying ? Colors.danger : Colors.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </Animated.View>

                <Animated.View style={[
                    styles.card,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}>
                    <Text style={styles.cardTitle}>Confidence</Text>
                    <View style={styles.gaugeWrap}>
                        <ConfidenceGauge confidence={result.confidence} size={150} />
                    </View>
                </Animated.View>

                <Animated.View style={[
                    styles.card,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="star-outline" size={16} color={Colors.healthy} />
                        <Text style={styles.cardTitle}>Recommendations</Text>
                    </View>
                    {isTranslating || isProcessingVoice ? (
                        <Text style={styles.recText}>Loading...</Text>
                    ) : displayContent.recommendations?.length > 0 ? (
                        displayContent.recommendations.map((rec: string, idx: number) => (
                            <Text key={`rec-${idx}`} style={styles.recText}>• {rec}</Text>
                        ))
                    ) : (
                        <Text style={styles.recText}>• No specific recommendations needed.</Text>
                    )}
                </Animated.View>

                <Animated.View style={[
                    styles.card,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="list-outline" size={16} color={Colors.accent} />
                        <Text style={styles.cardTitle}>Key Points</Text>
                    </View>
                    {isTranslating || isProcessingVoice ? (
                        <Text style={styles.recText}>Loading...</Text>
                    ) : displayContent.key_points?.length > 0 ? (
                        displayContent.key_points.map((pt: string, idx: number) => (
                            <Text key={`kp-${idx}`} style={styles.recText}>• {pt}</Text>
                        ))
                    ) : (
                        <Text style={styles.recText}>• Plant appears fully healthy.</Text>
                    )}
                </Animated.View>

                <Animated.View style={[
                    styles.card,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="bulb-outline" size={16} color={Colors.warning} />
                        <Text style={styles.cardTitle}>Action Steps</Text>
                    </View>
                    {isTranslating || isProcessingVoice ? (
                        <Text style={styles.recText}>Loading...</Text>
                    ) : displayContent.action_steps?.length > 0 ? (
                        displayContent.action_steps.map((st: string, idx: number) => (
                            <Text key={`as-${idx}`} style={styles.recText}>• {st}</Text>
                        ))
                    ) : (
                        <Text style={styles.recText}>• Maintain current watering and care routine.</Text>
                    )}
                </Animated.View>

                <Animated.View style={[
                    styles.toggleSection,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}>
                    <Text style={styles.aiSectionTitle}>AI Analysis</Text>
                    <View style={styles.toggleRow}>
                        {TOGGLE_CONFIG.map(({ key, label, icon, color }) => (
                            <TouchableOpacity
                                key={key}
                                style={[
                                    styles.toggleBtn,
                                    activeToggles[key] && styles.toggleBtnActive,
                                    activeToggles[key] && { borderColor: color },
                                ]}
                                onPress={() => toggleSection(key)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name={icon as any} size={16} color={activeToggles[key] ? color : Colors.textMuted} />
                                <Text style={[
                                    styles.toggleBtnText,
                                    activeToggles[key] && { color },
                                ]}>{label}</Text>
                                <View style={[styles.toggleIndicator, activeToggles[key] && { backgroundColor: color }]} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {activeToggles.severity && (
                        <View style={styles.expandedCard}>
                            <View style={styles.expandedHeader}>
                                <Ionicons name="speedometer-outline" size={18} color={Colors.danger} />
                                <Text style={styles.expandedTitle}>Severity Assessment</Text>
                            </View>

                            <View style={styles.severityMeter}>
                                <View style={styles.severityBarBg}>
                                    <View style={[
                                        styles.severityBarFill,
                                        { width: `${severity.score}%`, backgroundColor: getSeverityColor() },
                                    ]} />
                                </View>
                                <View style={styles.severityLabelRow}>
                                    <Text style={[styles.severityLevel, { color: getSeverityColor() }]}>{severity.level}</Text>
                                    <Text style={[styles.severityScore, { color: getSeverityColor() }]}>{severity.score}/100</Text>
                                </View>
                            </View>

                            <Text style={styles.expandedDesc}>
                                {isTranslating ? 'Translating...' : displayContent.severityDesc}
                            </Text>
                        </View>
                    )}

                    {activeToggles.explainability && (
                        <View style={styles.expandedCard}>
                            <View style={styles.expandedHeader}>
                                <Ionicons name="git-network-outline" size={18} color={Colors.accent} />
                                <Text style={styles.expandedTitle}>Explainability Analysis</Text>
                            </View>
                            <Text style={[styles.expandedDesc, { marginBottom: Spacing.sm }]}>{explainability.modelBasis}</Text>
                            {explainability.factors.map((factor, idx) => (
                                <View key={idx} style={{ marginBottom: Spacing.sm }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                        <Ionicons name={getImpactIcon(factor.impact) as any} size={14} color={getImpactColor(factor.impact)} />
                                        <Text style={{ color: Colors.text, fontWeight: '600', fontSize: FontSize.sm }}>{factor.name}</Text>
                                    </View>
                                    <Text style={styles.expandedDesc}>{factor.detail}</Text>
                                </View>
                            ))}
                            <Text style={[styles.expandedDesc, { marginTop: Spacing.sm, fontStyle: 'italic', fontSize: FontSize.xs }]}>{explainability.limitations}</Text>
                        </View>
                    )}

                    {activeToggles.yieldLoss && (
                        <View style={styles.expandedCard}>
                            <View style={styles.expandedHeader}>
                                <Ionicons name="trending-down-outline" size={18} color={Colors.warning} />
                                <Text style={styles.expandedTitle}>Yield Loss Assessment</Text>
                            </View>
                            <View style={[styles.severityLabelRow, { marginBottom: Spacing.sm }]}>
                                <Text style={styles.severityLevel}>Estimated Loss</Text>
                                <Text style={[styles.severityScore, { color: Colors.warning, fontSize: FontSize.lg }]}>{yieldLoss.estimatedLossPercent}%</Text>
                            </View>
                            <Text style={[styles.expandedDesc, { marginBottom: Spacing.sm }]}>{yieldLoss.economicImpact}</Text>

                            <View style={{ gap: Spacing.xs, marginTop: Spacing.xs }}>
                                <Text style={styles.expandedDesc}>
                                    <Text style={{ fontWeight: '700', color: Colors.text }}>Time to Action: </Text>
                                    {yieldLoss.timeToAction}
                                </Text>
                                <Text style={styles.expandedDesc}>
                                    <Text style={{ fontWeight: '700', color: Colors.text }}>Recovery Potential: </Text>
                                    {yieldLoss.recoveryPotential}
                                </Text>
                            </View>
                        </View>
                    )}
                </Animated.View>

                <TouchableOpacity style={styles.newScanBtn} onPress={onNewScan} activeOpacity={0.8}>
                    <Ionicons name="scan-outline" size={16} color={Colors.primaryDeep} />
                    <Text style={styles.newScanText}>Analyze Another Image</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* FLOATING ACTION BUTTON (MIC) */}
            <View style={styles.fabContainer}>
                {isProcessingVoice ? (
                    <View style={styles.fab}>
                        <ActivityIndicator color={Colors.background} />
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.fab, isRecording && styles.fabRecording]}
                        onPressIn={startRecording}
                        onPressOut={stopRecording}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="mic-outline" size={28} color={isRecording ? Colors.surface : Colors.background} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, position: 'relative' },
    content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 120 /* extra padding for fab */ },

    // FAB Styles
    fabContainer: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    fab: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: Colors.accent,
        justifyContent: 'center', alignItems: 'center',
        ...Shadows.lg,
    },
    fabRecording: {
        backgroundColor: Colors.danger,
        transform: [{ scale: 1.1 }],
    },

    // Standard Styles
    imageWrap: {
        borderRadius: BorderRadius.xl, overflow: 'hidden',
        ...Shadows.md, position: 'relative',
        borderWidth: 1, borderColor: Colors.border,
    },
    image: { width: '100%', aspectRatio: 4 / 3, backgroundColor: Colors.surfaceHover },
    cachedBadge: {
        position: 'absolute', top: Spacing.sm, right: Spacing.sm,
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 1, borderColor: Colors.border,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full,
    },
    cachedText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '500' },
    languageBar: { marginVertical: Spacing.sm },
    langScroll: { gap: Spacing.sm },
    langBadge: {
        paddingHorizontal: Spacing.md, paddingVertical: 8,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1, borderColor: Colors.border,
    },
    langBadgeActive: {
        backgroundColor: 'rgba(0, 230, 118, 0.1)',
        borderColor: Colors.accent,
    },
    langText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
    langTextActive: { color: Colors.accent },
    statusBanner: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        padding: Spacing.md, borderRadius: BorderRadius.lg,
        borderWidth: 1,
    },
    statusIconWrap: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
    },
    statusInfo: { flex: 1, gap: 2 },
    statusLabel: {
        fontSize: FontSize.xs, fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: 1,
    },
    diseaseTitleRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    },
    speakBtn: {
        padding: 4, borderRadius: BorderRadius.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    speakBtnActive: {
        backgroundColor: 'rgba(255, 82, 82, 0.1)',
    },
    diseaseName: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, flex: 1 },
    card: {
        ...Glass.card,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg, gap: Spacing.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    cardTitle: {
        color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    gaugeWrap: { alignItems: 'center', paddingVertical: Spacing.md },
    recText: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 24 },

    toggleSection: { gap: Spacing.md },
    aiSectionTitle: {
        color: Colors.text, fontSize: FontSize.lg, fontWeight: '700',
        letterSpacing: -0.3,
    },
    toggleRow: {
        flexDirection: 'row', gap: Spacing.sm,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: BorderRadius.md,
        ...Glass.card,
    },
    toggleBtnActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.10)',
        borderWidth: 1,
    },
    toggleBtnText: {
        color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600',
        textAlign: 'center',
    },
    toggleIndicator: {
        width: 20, height: 3, borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },

    expandedCard: {
        ...Glass.cardHeavy,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    expandedHeader: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    expandedTitle: {
        color: Colors.text, fontSize: FontSize.md, fontWeight: '700',
    },
    expandedDesc: {
        color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20,
    },

    severityMeter: { gap: Spacing.xs },
    severityBarBg: {
        height: 8, borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
    },
    severityBarFill: {
        height: 8, borderRadius: 4,
    },
    severityLabelRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    severityLevel: {
        fontSize: FontSize.md, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
    },
    severityScore: {
        fontSize: FontSize.sm, fontWeight: '600',
    },

    newScanBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 15, borderRadius: BorderRadius.md,
        backgroundColor: Colors.accent,
        ...Shadows.glowSm,
    },
    newScanText: { color: Colors.primaryDeep, fontSize: FontSize.md, fontWeight: '700' },
});