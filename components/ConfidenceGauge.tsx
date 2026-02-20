import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '../constants/theme';

interface ConfidenceGaugeProps {
    confidence: number; // 0 to 1
    size?: number;
}

export default function ConfidenceGauge({ confidence, size = 100 }: ConfidenceGaugeProps) {
    const animValue = useRef(new Animated.Value(0)).current;
    const percentage = Math.round(confidence * 100);

    useEffect(() => {
        Animated.timing(animValue, {
            toValue: confidence,
            duration: 1200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [confidence]);

    const getColor = () => {
        if (confidence >= 0.8) return Colors.healthy;
        if (confidence >= 0.5) return Colors.warning;
        return Colors.disease;
    };

    const barWidth = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={[styles.container, { width: size }]}>
            <View style={styles.barBackground}>
                <Animated.View
                    style={[
                        styles.barFill,
                        {
                            width: barWidth,
                            backgroundColor: getColor(),
                        },
                    ]}
                />
            </View>
            <Animated.Text style={[styles.label, { color: getColor() }]}>
                {percentage}%
            </Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: 6,
    },
    barBackground: {
        width: '100%',
        height: 8,
        backgroundColor: Colors.surfaceLight,
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
    },
});
