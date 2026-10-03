// Generated from src/scorer.ts by scripts/build-demo.mjs. Do not edit.
function getRating(score) {
    if (score >= 90)
        return "HUMAN";
    if (score >= 70)
        return "MOSTLY CLEAN";
    if (score >= 50)
        return "SUSPICIOUS";
    if (score >= 30)
        return "LIKELY AI";
    return "PURE SLOP";
}
function countSentences(text) {
    return text
        .split(/[.!?]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}
function hasVariedSentenceLength(text) {
    const sentences = countSentences(text);
    if (sentences.length < 3)
        return false;
    const lengths = sentences.map((s) => s.split(/\s+/).length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    // High standard deviation = varied sentence length
    return stdDev > 4;
}
// A fixed -2 per hit lets short, dense slop pass as "mostly clean"; density
// separates it from long human texts with a few incidental hits.
const DENSITY_MIN_WORDS = 30;
const DENSITY_STEPS = [
    { hitsPer100Words: 10, deduction: 20 },
    { hitsPer100Words: 5, deduction: 10 },
];
function buzzwordDensityDeduction(text, hits) {
    const words = text.split(/\s+/).filter(Boolean).length;
    if (words < DENSITY_MIN_WORDS)
        return 0;
    const per100 = (hits / words) * 100;
    return DENSITY_STEPS.find((step) => per100 > step.hitsPer100Words)?.deduction ?? 0;
}
// List-style patterns hit once per item; maxCount stops one long list from
// dominating the score.
export function scoredCount(pm) {
    return pm.maxCount !== undefined ? Math.min(pm.count, pm.maxCount) : pm.count;
}
function countQuestions(text) {
    const matches = text.match(/\?/g);
    return matches ? matches.length : 0;
}
export function score(detection) {
    let s = 100;
    // -2 per buzzword hit
    const phraseDeductions = detection.totalPhraseHits * 2;
    s -= phraseDeductions;
    const densityDeduction = buzzwordDensityDeduction(detection.text, detection.totalPhraseHits);
    s -= densityDeduction;
    // -weight per structural pattern match (excluding passive voice and let-me which are handled separately)
    let patternDeductions = 0;
    let passiveVoiceDeduction = 0;
    let letMeDeduction = 0;
    for (const pm of detection.patternMatches) {
        if (pm.name === "passive-voice-density") {
            // Check density: if passive instances > 30% of sentences, deduct 10
            const sentences = countSentences(detection.text);
            const passiveRatio = sentences.length > 0 ? pm.count / sentences.length : 0;
            if (passiveRatio > 0.3) {
                passiveVoiceDeduction = 10;
            }
        }
        else if (pm.name === "let-me-starter" || pm.name === "heres-the-thing") {
            letMeDeduction += scoredCount(pm) * 3;
        }
        else {
            patternDeductions += scoredCount(pm) * pm.weight;
        }
    }
    s -= patternDeductions;
    s -= passiveVoiceDeduction;
    s -= letMeDeduction;
    // Bonuses
    const questionBonus = countQuestions(detection.text) > 0 ? 5 : 0;
    const sentenceLengthBonus = hasVariedSentenceLength(detection.text) ? 5 : 0;
    s += questionBonus;
    s += sentenceLengthBonus;
    // Clamp
    s = Math.max(0, Math.min(100, s));
    return {
        score: s,
        rating: getRating(s),
        breakdown: {
            phraseDeductions,
            patternDeductions,
            passiveVoiceDeduction,
            letMeDeduction,
            densityDeduction,
            questionBonus,
            sentenceLengthBonus,
        },
    };
}
