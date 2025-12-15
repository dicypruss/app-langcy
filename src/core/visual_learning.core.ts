import { SchemaType } from '@google/generative-ai';
import { OnboardingGenerationData } from './onboarding.core';
import { WordEntry } from './content.core';

/**
 * Generates the prompt and schema for analyzing an image to extract words.
 */
export function generateImagePrompt(nativeLang: string, targetLang: string): OnboardingGenerationData {
    const prompt = `Analyze this image as a language teacher. Identify ALL visible objects, actions, and concepts (aim for ~50 items). 
    Extract words/phrases for a learner of ${targetLang} (native speaker of ${nativeLang}).
    For each item provide:
    1. The word/phrase in ${targetLang} (original).
    2. The translation in ${nativeLang}.
    3. A simple example sentence using it in ${targetLang} (context_sentence), ideally describing what is in the image.
    4. The translation of that sentence in ${nativeLang} (context_native).`;

    const schema = {
        type: SchemaType.ARRAY,
        items: {
            type: SchemaType.OBJECT,
            properties: {
                original: { type: SchemaType.STRING, description: `The word or phrase in ${targetLang}` },
                translation: { type: SchemaType.STRING, description: `The translation in ${nativeLang}` },
                context_sentence: { type: SchemaType.STRING, description: `Example sentence in ${targetLang}` },
                context_native: { type: SchemaType.STRING, description: `Translation of example sentence in ${nativeLang}` }
            },
            required: ["original", "translation", "context_sentence", "context_native"]
        }
    };

    return {
        prompt,
        schema
    };
}

/**
 * Generates prompt to refine and deduplicate candidates against existing knowledge.
 */
export function generateRefinementPrompt(
    nativeLang: string,
    targetLang: string,
    candidates: WordEntry[],
    existingContexts: { original: string, context_target: string }[]
): OnboardingGenerationData {
    const candidatesJson = JSON.stringify(candidates.map(c => ({
        original: c.original,
        context: c.context_sentence
    })), null, 2);

    const existingJson = JSON.stringify(existingContexts, null, 2);

    const prompt = `I have a list of candidate words extracted from an image, and a list of words the user ALREADY knows (with their specific contexts).
    
    Task:
    1. Compare candidates against existing words.
    2. If a candidate word exists but has a DIFFERENT meaning/context (Polysemy), KEEP IT.
    3. If a candidate is a duplicate (same word, similar context), DISCARD IT.
    4. From the remaining (new) words, select the top 15 most useful/high-frequency words for a learner.

    Candidates:
    ${candidatesJson}

    Existing Known Words:
    ${existingJson}

    Return the final list of selected words (preserving their original fields).`;

    // Reuse same schema as extraction
    const schema = {
        type: SchemaType.ARRAY,
        items: {
            type: SchemaType.OBJECT,
            properties: {
                original: { type: SchemaType.STRING },
                translation: { type: SchemaType.STRING },
                context_sentence: { type: SchemaType.STRING },
                context_native: { type: SchemaType.STRING }
            },
            required: ["original", "translation", "context_sentence", "context_native"]
        }
    };

    return { prompt, schema };
}

/**
 * Deduplicates new words against existing words.
 * @deprecated Use generateRefinementPrompt instead for context-aware deduplication.
 */
export function deduplicateWords(newWords: WordEntry[], existingOriginals: Set<string>): WordEntry[] {
    return newWords.filter(w => {
        const normalized = w.original.toLowerCase().trim();
        return !existingOriginals.has(normalized);
    });
}
