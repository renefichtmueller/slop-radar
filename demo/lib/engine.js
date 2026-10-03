// Generated from src/engine.ts by scripts/build-demo.mjs. Do not edit.
// Pure detection engine: no Node.js APIs, so the browser demo can run the
// exact same code as the CLI.
const WORD_CHAR = "[\\p{L}\\p{N}_]";
const SEPARATOR = "[\\s,;:\\-]+";
const DE_INDICATORS = /\b(der|die|das|und|ist|ein|eine|nicht|mit|auf|dem|den|des|sich|von|zu|als|es|wird|haben|auch|nach|aus|bei|wie|oder|wenn|noch|nur|kann|sind|sein|hat|ich|aber|diese|einen|keine|dann|schon|wir|sie|man|doch)\b/gi;
const EN_INDICATORS = /\b(the|and|is|a|to|of|in|that|it|for|was|on|are|with|they|be|at|this|have|from|or|had|by|but|not|what|all|were|we|when|your|can|said|there|each|which|do|how|their|if|will|up|other|about|out|many|then|them|these|so|some)\b/gi;
export function detectLanguage(text) {
    const de = text.match(DE_INDICATORS)?.length ?? 0;
    const en = text.match(EN_INDICATORS)?.length ?? 0;
    return de > en ? "de" : "en";
}
/**
 * Maps typographic quotes to ASCII so "here’s" matches "here's".
 * Every replacement is one UTF-16 unit for one, so match positions in the
 * normalized text are valid positions in the original text.
 */
export function normalizeText(text) {
    return text
        .replace(/[‘’‚‛ʼ]/g, "'")
        .replace(/[“”„‟]/g, '"');
}
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const GERMAN_TO_ASCII = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };
const GERMAN_ALTERNATIVES = {
    ae: "(?:ae|ä)",
    oe: "(?:oe|ö)",
    ue: "(?:ue|ü)",
    ss: "(?:ss|ß)",
};
// The German list is written in ASCII (ae/oe/ue/ss); real text uses umlauts.
// Each digraph accepts both spellings. A false "ü" for a genuine "ue" (as in
// "neue") is harmless because that misspelling does not occur in real text.
// German adjectives, articles and nouns inflect almost everywhere
// ("maßgeschneiderte", "einer entscheidenden Rolle"). Entries are reduced to
// a stem and any common ending is accepted, so one entry covers all forms.
const GERMAN_ENDINGS_TO_STRIP = ["ern", "en", "er", "es", "em", "e"];
const GERMAN_ENDING = "(?:e|en|er|ern|es|em|n|r|s)?";
const MIN_GERMAN_STEM = 4;
function germanStem(word) {
    const ending = GERMAN_ENDINGS_TO_STRIP.find((e) => word.endsWith(e) && word.length - e.length >= MIN_GERMAN_STEM);
    return ending ? word.slice(0, -ending.length) : word;
}
function germanWordSource(word) {
    const ascii = germanStem(word.replace(/[äöüß]/g, (c) => GERMAN_TO_ASCII[c]));
    const source = escapeRegex(ascii).replace(/ae|oe|ue|ss/g, (d) => GERMAN_ALTERNATIVES[d]);
    return source + GERMAN_ENDING;
}
// English only needs the plural/third-person -s on the last word
// ("stakeholders", "unlocks"); other forms ("leveraging") are listed as
// separate entries.
const ENGLISH_ENDING = "s?";
function wordSources(words, language) {
    if (language === "de")
        return words.map(germanWordSource);
    const last = words.length - 1;
    return words.map((w, i) => escapeRegex(w) + (i === last ? ENGLISH_ENDING : ""));
}
function phraseSource(phrase, language) {
    const words = phrase.toLowerCase().trim().split(/\s+/);
    // JS \b only knows ASCII letters; lookarounds on \p{L} keep umlauts and
    // accented letters inside a word.
    return `(?<!${WORD_CHAR})${wordSources(words, language).join(SEPARATOR)}(?!${WORD_CHAR})`;
}
const regexCache = new Map();
function phraseRegex(phrase, language) {
    const key = `${language}\u0000${phrase}`;
    let re = regexCache.get(key);
    if (!re) {
        re = new RegExp(phraseSource(phrase, language), "giu");
        regexCache.set(key, re);
    }
    re.lastIndex = 0;
    return re;
}
// One flag per character keeps the overlap check proportional to the match
// length; scanning a list of claimed spans made long texts quadratic.
function isFree(covered, start, end) {
    for (let i = start; i < end; i++) {
        if (covered[i])
            return false;
    }
    return true;
}
/**
 * Longest phrase wins: "a myriad of" claims its span, so "myriad of" and
 * "myriad" inside it are not counted again.
 */
export function matchPhrases(text, phrases, language) {
    const order = phrases
        .map((phrase, index) => ({ phrase, index }))
        .sort((a, b) => b.phrase.length - a.phrase.length || a.index - b.index);
    const covered = new Uint8Array(text.length);
    const hits = new Map();
    for (const { phrase, index } of order) {
        for (const m of text.matchAll(phraseRegex(phrase, language))) {
            const start = m.index ?? 0;
            const end = start + m[0].length;
            if (!isFree(covered, start, end))
                continue;
            covered.fill(1, start, end);
            const spans = hits.get(index);
            if (spans)
                spans.push([start, end - start]);
            else
                hits.set(index, [[start, end - start]]);
        }
    }
    return [...hits.entries()]
        .sort(([a], [b]) => a - b)
        // matchAll yields one phrase's hits in ascending order, so spans are sorted.
        .map(([index, spans]) => ({
        phrase: phrases[index],
        count: spans.length,
        positions: spans.map(([start]) => start),
        lengths: spans.map(([, length]) => length),
    }));
}
export function matchPatterns(text, patterns) {
    const matches = [];
    for (const def of patterns) {
        // Always match globally: without /g, String.match returns capture groups
        // for the first hit instead of every occurrence.
        const flags = def.flags ?? "gi";
        let re;
        try {
            re = new RegExp(def.pattern, flags.includes("g") ? flags : flags + "g");
        }
        catch {
            continue;
        }
        const count = [...text.matchAll(re)].length;
        if (count === 0)
            continue;
        matches.push({
            name: def.name,
            description: def.description,
            count,
            weight: def.weight,
            ...(def.maxCount !== undefined ? { maxCount: def.maxCount } : {}),
        });
    }
    return matches;
}
export function detectWith(db, text, language = "auto") {
    const normalized = normalizeText(text);
    const lang = language === "auto" ? detectLanguage(normalized) : language;
    const phrases = lang === "de" ? db.phrasesDe : db.phrasesEn;
    const phraseMatches = matchPhrases(normalized, phrases, lang);
    const patternMatches = matchPatterns(normalized, db.patterns);
    return {
        text,
        phraseMatches,
        patternMatches,
        totalPhraseHits: phraseMatches.reduce((sum, m) => sum + m.count, 0),
        totalPatternHits: patternMatches.reduce((sum, m) => sum + m.count, 0),
        language: lang,
    };
}
