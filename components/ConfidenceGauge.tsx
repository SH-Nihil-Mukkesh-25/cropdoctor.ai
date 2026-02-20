import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, FontSize } from '../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props { confidence: number; size?: number; }

export default function ConfidenceGauge({ confidence, size = 150 }: Props) {
    const animValue = useRef(new Animated.Value(0)).current;
    const pct = Math.round(confidence * 100);
    const sw = size * 0.065;
    const r = (size - sw) / 2;
    const circ = 2 * Math.PI * r;

    useEffect(() => {
        Animated.timing(animValue, {
            toValue: confidence, duration: 1400,
            easing: Easing.out(Easing.cubic), useNativeDriver: false,
        }).start();
    }, [confidence]);

    const color = confidence >= 0.8 ? Colors.healthy
        : confidence >= 0.5 ? Colors.warning
            : Colors.danger;

    const label = confidence >= 0.8 ? 'High'
        : confidence >= 0.5 ? 'Medium'
            : 'Low';

    const offset = animValue.interpolate({
        inputRange: [0, 1], outputRange: [circ, 0],
    });

    return (
        <View style={[s.wrap, { width: size, height: size }]}>
            <View style={[s.glowBackdrop, {
                width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35,
                backgroundColor: confidence >= 0.8 ? Colors.healthyGlow
                    : confidence >= 0.5 ? Colors.warningGlow
                        : Colors.dangerGlow,
            }]} />
            <Svg width={size} height={size} style={s.svg}>
                <Circle
                    cx={size / 2} cy={size / 2} r={r}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth={sw} fill="none"
                />
                <AnimatedCircle
                    cx={size / 2} cy={size / 2} r={r}
                    stroke={color} strokeWidth={sw}
                    fill="none" strokeLinecap="round"
                    strokeDasharray={`${circ}`}
                    strokeDashoffset={offset}
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>
            <View style={s.center}>
                <Text style={[s.pct, { color, fontSize: size * 0.22 }]}>{pct}%</Text>
                <Text style={[s.lbl, { color }]}>{label}</Text>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    wrap: { justifyContent: 'center', alignItems: 'center' },
    svg: { position: 'absolute' },
    glowBackdrop: {
        position: 'absolute',
        opacity: 0.3,
    },
    center: { alignItems: 'center', gap: 2 },
    pct: { fontWeight: '700', letterSpacing: -0.5 },
    lbl: {
        fontSize: FontSize.xs, fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.8,
    },
});
