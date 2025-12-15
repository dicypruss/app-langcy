export interface WordEntry {
    original: string;
    translation: string;
    context_sentence: string;
    context_native?: string; // Optional because legacy data/prompt might not have it
}

/**
 * Parses and validates the response from Gemini.
 * Handles potential markdown code block wrapping.
 * @param responseText Raw string response from Gemini
 */
export function parseGeminiResponse(responseText: string): WordEntry[] {
    let cleanText = responseText.trim();

    // Remove markdown code blocks if present
    if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }

    let parsed: any;
    try {
        parsed = JSON.parse(cleanText);
    } catch (e) {
        throw new Error('Failed to parse Gemini response as JSON');
    }

    if (!Array.isArray(parsed)) {
        throw new Error('Gemini response is not an array');
    }

    // Validate and filter entries
    return parsed.filter((entry: any) => {
        return (
            entry &&
            typeof entry.original === 'string' &&
            typeof entry.translation === 'string' &&
            typeof entry.context_sentence === 'string'
        );
    }).map((entry: any) => ({
        original: entry.original,
        translation: entry.translation,
        context_sentence: entry.context_sentence,
        context_native: entry.context_native
    }));
}
