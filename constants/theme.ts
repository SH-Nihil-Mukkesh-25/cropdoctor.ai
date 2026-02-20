export const Colors = {
    primary: '#2D6A4F',
    primaryDark: '#1B4332',
    primaryDeep: '#0A1F14',
    primaryLight: '#40916C',
    primaryMuted: 'rgba(45, 106, 79, 0.3)',

    accent: '#00E676',
    accentMuted: 'rgba(0, 230, 118, 0.25)',
    accentGlow: 'rgba(0, 230, 118, 0.15)',
    accentSubtle: 'rgba(0, 230, 118, 0.08)',

    healthy: '#95D5B2',
    healthyBg: 'rgba(149, 213, 178, 0.12)',
    healthyGlow: 'rgba(149, 213, 178, 0.3)',

    warning: '#FFB74D',
    warningBg: 'rgba(255, 183, 77, 0.12)',
    warningGlow: 'rgba(255, 183, 77, 0.3)',

    danger: '#EF5350',
    dangerBg: 'rgba(239, 83, 80, 0.12)',
    dangerGlow: 'rgba(239, 83, 80, 0.3)',

    background: '#0A1F14',
    backgroundAlt: '#0D2818',
    surface: 'rgba(255, 255, 255, 0.06)',
    surfaceHover: 'rgba(255, 255, 255, 0.10)',
    surfaceActive: 'rgba(255, 255, 255, 0.14)',
    surfaceSolid: '#112D1E',

    gradientStart: '#0A1F14',
    gradientMid: '#143D2B',
    gradientEnd: '#1B4332',

    mintFrost: '#D8F3DC',
    sage: '#B7E4C7',
    seafoam: '#74C69D',

    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.72)',
    textMuted: 'rgba(255, 255, 255, 0.42)',
    textOnPrimary: '#FFFFFF',
    textDark: '#1A1A2E',

    border: 'rgba(255, 255, 255, 0.10)',
    borderLight: 'rgba(255, 255, 255, 0.06)',
    borderAccent: 'rgba(0, 230, 118, 0.25)',
    borderDark: 'rgba(255, 255, 255, 0.15)',

    overlay: 'rgba(0, 0, 0, 0.55)',

    white: '#FFFFFF',
    black: '#000000',
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
    full: 999,
};

export const FontSize = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 21,
    xxl: 26,
    hero: 34,
};

export const Shadows = {
    xs: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 16,
    },
    glow: {
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    glowSm: {
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    glowAccent: {
        shadowColor: '#2D6A4F',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
};

export const Glass = {
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.10)',
    },
    cardHeavy: {
        backgroundColor: 'rgba(255, 255, 255, 0.10)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    surface: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    inputFocused: {
        backgroundColor: 'rgba(0, 230, 118, 0.06)',
        borderWidth: 1,
        borderColor: 'rgba(0, 230, 118, 0.35)',
    },
};
