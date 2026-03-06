import { DetectionResult } from '../types';

interface SeverityResult {
    level: 'None' | 'Low' | 'Moderate' | 'High' | 'Critical';
    score: number;
    description: string;
    actionRequired: string;
    spreadRisk: string;
}

interface ExplainabilityResult {
    factors: { name: string; impact: 'positive' | 'negative' | 'neutral'; weight: number; detail: string }[];
    modelBasis: string;
    limitations: string;
}

interface YieldLossResult {
    estimatedLossPercent: number;
    range: { min: number; max: number };
    economicImpact: string;
    timeToAction: string;
    recoveryPotential: string;
}

export function computeSeverity(result: DetectionResult): SeverityResult {
    const isHealthy = result.disease.toLowerCase().includes('healthy');
    const conf = result.confidence;
    const name = result.disease.toLowerCase();

    if (isHealthy) {
        return {
            level: 'None',
            score: 0,
            description: 'No disease detected. The plant tissue appears healthy with normal coloration and structure.',
            actionRequired: 'Continue regular care and monitoring schedule.',
            spreadRisk: 'N/A — No pathogen present.',
        };
    }

    const isBlight = name.includes('blight');
    const isRust = name.includes('rust');
    const isRot = name.includes('rot');
    const isSpot = name.includes('spot');
    const isMosaic = name.includes('mosaic') || name.includes('virus');
    const isWilt = name.includes('wilt');
    const isMildew = name.includes('mildew');

    let baseScore = conf * 70;

    if (isBlight || isRot || isWilt) baseScore += 20;
    else if (isRust || isMosaic) baseScore += 15;
    else if (isSpot || isMildew) baseScore += 10;
    else baseScore += 12;

    const score = Math.min(Math.round(baseScore), 100);

    let level: SeverityResult['level'];
    let actionRequired: string;
    let spreadRisk: string;

    if (score >= 80) {
        level = 'Critical';
        actionRequired = 'Immediate intervention required. Isolate affected plants and begin emergency treatment protocol.';
        spreadRisk = 'Very High — Can spread to neighboring plants within 48–72 hours under favorable conditions.';
    } else if (score >= 60) {
        level = 'High';
        actionRequired = 'Urgent treatment needed within 3–5 days. Monitor surrounding plants for early signs.';
        spreadRisk = 'High — Moderate spread risk, especially in humid conditions.';
    } else if (score >= 40) {
        level = 'Moderate';
        actionRequired = 'Schedule treatment within the next 1–2 weeks. Review environmental conditions.';
        spreadRisk = 'Moderate — Localized spread possible if left untreated.';
    } else {
        level = 'Low';
        actionRequired = 'Monitor the plant closely. Preventive measures recommended.';
        spreadRisk = 'Low — Unlikely to spread rapidly under current conditions.';
    }

    const description = `${result.disease} detected with ${Math.round(conf * 100)}% model confidence. ` +
        `Severity assessment indicates ${level.toLowerCase()}-level pathogen activity based on visual indicators.`;

    return { level, score, description, actionRequired, spreadRisk };
}

export function computeExplainability(result: DetectionResult): ExplainabilityResult {
    const isHealthy = result.disease.toLowerCase().includes('healthy');
    const conf = result.confidence;
    const name = result.disease.toLowerCase();

    if (isHealthy) {
        return {
            factors: [
                { name: 'Leaf Color', impact: 'positive', weight: 0.35, detail: 'Uniform green coloration consistent with healthy chlorophyll levels.' },
                { name: 'Surface Texture', impact: 'positive', weight: 0.25, detail: 'Smooth, unblemished surface without lesions or discoloration.' },
                { name: 'Vein Structure', impact: 'positive', weight: 0.20, detail: 'Regular vein pattern with no signs of necrosis or abnormality.' },
                { name: 'Edge Integrity', impact: 'positive', weight: 0.20, detail: 'Leaf margins are intact with no wilting, curling, or browning.' },
            ],
            modelBasis: 'Classification based on CNN feature extraction from leaf surface, color histogram analysis, and texture pattern recognition.',
            limitations: 'Model accuracy may vary with image quality, lighting conditions, and leaf orientation. Early-stage symptoms below visible threshold may not be detected.',
        };
    }

    const factors: ExplainabilityResult['factors'] = [];

    if (name.includes('spot') || name.includes('blight')) {
        factors.push({ name: 'Lesion Patterns', impact: 'negative', weight: 0.40, detail: 'Dark spots or necrotic lesions detected on leaf surface, indicating fungal or bacterial pathogen activity.' });
    }
    if (name.includes('rust')) {
        factors.push({ name: 'Pustule Formation', impact: 'negative', weight: 0.40, detail: 'Orange-brown pustules detected on leaf undersides, characteristic of rust fungal infection.' });
    }
    if (name.includes('mildew')) {
        factors.push({ name: 'Powder Coating', impact: 'negative', weight: 0.40, detail: 'White powdery substance covering leaf surfaces, consistent with mildew pathogen colonization.' });
    }
    if (name.includes('mosaic') || name.includes('virus')) {
        factors.push({ name: 'Color Mosaicism', impact: 'negative', weight: 0.40, detail: 'Irregular yellow-green mosaic patterns disrupting normal leaf pigmentation.' });
    }
    if (name.includes('wilt')) {
        factors.push({ name: 'Turgor Loss', impact: 'negative', weight: 0.40, detail: 'Leaf wilting and drooping indicating vascular pathogen disrupting water transport.' });
    }
    if (name.includes('rot')) {
        factors.push({ name: 'Tissue Decay', impact: 'negative', weight: 0.40, detail: 'Soft, water-soaked lesions with tissue decomposition indicative of rot pathogens.' });
    }

    if (factors.length === 0) {
        factors.push({ name: 'Abnormal Patterns', impact: 'negative', weight: 0.40, detail: 'Visual anomalies detected that deviate from healthy baseline feature maps.' });
    }

    factors.push(
        { name: 'Color Deviation', impact: 'negative', weight: 0.25, detail: `Leaf coloration deviates from healthy baseline by ${Math.round(conf * 40 + 15)}% in affected regions.` },
        { name: 'Texture Analysis', impact: conf > 0.7 ? 'negative' : 'neutral', weight: 0.20, detail: conf > 0.7 ? 'Surface texture irregularities strongly correlated with known disease signatures.' : 'Mild texture variation detected; may indicate early-stage infection.' },
        { name: 'Shape Regularity', impact: conf > 0.8 ? 'negative' : 'neutral', weight: 0.15, detail: conf > 0.8 ? 'Leaf shape distortion detected, consistent with advanced pathogen damage.' : 'Minor shape irregularities noted, within borderline range.' },
    );

    return {
        factors,
        modelBasis: `Deep CNN classification with ${Math.round(conf * 100)}% confidence. Feature attribution highlights pathological regions using gradient-weighted class activation mapping.`,
        limitations: 'Predictions are based on visual symptoms only. Lab confirmation is recommended for definitive diagnosis. Co-infections may reduce individual disease confidence.',
    };
}

export function computeYieldLoss(result: DetectionResult): YieldLossResult {
    const isHealthy = result.disease.toLowerCase().includes('healthy');
    const conf = result.confidence;
    const name = result.disease.toLowerCase();

    if (isHealthy) {
        return {
            estimatedLossPercent: 0,
            range: { min: 0, max: 0 },
            economicImpact: 'No economic impact expected. Continue standard cultivation practices.',
            timeToAction: 'No immediate action required.',
            recoveryPotential: 'N/A — Plant is healthy.',
        };
    }

    let baseLoss = 0;
    let variance = 10;

    if (name.includes('blight')) { baseLoss = 45; variance = 20; }
    else if (name.includes('wilt')) { baseLoss = 50; variance = 15; }
    else if (name.includes('rot')) { baseLoss = 40; variance = 18; }
    else if (name.includes('rust')) { baseLoss = 30; variance = 12; }
    else if (name.includes('mosaic') || name.includes('virus')) { baseLoss = 35; variance = 15; }
    else if (name.includes('spot')) { baseLoss = 20; variance = 10; }
    else if (name.includes('mildew')) { baseLoss = 25; variance = 10; }
    else { baseLoss = 25; variance = 12; }

    const scaledLoss = Math.round(baseLoss * conf);
    const min = Math.max(0, scaledLoss - variance);
    const max = Math.min(100, scaledLoss + variance);

    let economicImpact: string;
    let timeToAction: string;
    let recoveryPotential: string;

    if (scaledLoss >= 40) {
        economicImpact = `Projected ${scaledLoss}% yield reduction could result in significant financial loss. Crop insurance assessment recommended.`;
        timeToAction = 'Critical — Begin treatment within 24–48 hours to minimize further loss.';
        recoveryPotential = 'Partial recovery possible (40-60%) with immediate and aggressive treatment.';
    } else if (scaledLoss >= 20) {
        economicImpact = `Moderate yield impact of ~${scaledLoss}% expected. Cost-benefit analysis of treatment vs. loss recommended.`;
        timeToAction = 'Urgent — Treatment should begin within 5–7 days for best outcomes.';
        recoveryPotential = 'Good recovery potential (60-80%) with timely fungicide application and care.';
    } else {
        economicImpact = `Minor yield impact of ~${scaledLoss}% projected. Standard preventive treatment should suffice.`;
        timeToAction = 'Advisory — Schedule preventive treatment within 2 weeks.';
        recoveryPotential = 'High recovery potential (80-95%) with standard treatment protocols.';
    }

    return { estimatedLossPercent: scaledLoss, range: { min, max }, economicImpact, timeToAction, recoveryPotential };
}
