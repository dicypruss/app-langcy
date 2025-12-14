import { SchemaType } from '@google/generative-ai';

// Define the shape of the generation request
export interface OnboardingGenerationData {
    prompt: string;
    schema: any; // Using 'any' for schema object to be flexible but validated in tests
}

/**
 * Validates if the user input is a valid language name.
 * @param input User input string
 */
export function validateLanguage(input: string): boolean {
    if (!input || input.trim().length < 2) {
        return false;
    }
    return true;
}

/**
 * Generates the prompt and schema for getting the first 100 words.
 * Pure function: returns the data needed for generation, not the API config itself.
 * @param nativeLang User's native language
 * @param targetLang Language user wants to learn
 */
export function generateWordListPrompt(nativeLang: string, targetLang: string): OnboardingGenerationData {
    const prompt = `Generate a list of the 100 most popular words in ${targetLang} for a ${nativeLang} speaker.`;

    const schema = {
        type: SchemaType.ARRAY,
        items: {
            type: SchemaType.OBJECT,
            properties: {
                original: { type: SchemaType.STRING, description: `The word in ${targetLang}` },
                translation: { type: SchemaType.STRING, description: `The translation in ${nativeLang}` },
                context_sentence: { type: SchemaType.STRING, description: `A simple example sentence using the word in ${targetLang}` }
            },
            required: ["original", "translation", "context_sentence"]
        }
    };

    return {
        prompt,
        schema
    };
}
