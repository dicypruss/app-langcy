import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { generateWordListPrompt } from '../core/onboarding.core';
import { config } from '../config';
import { parseGeminiResponse, WordEntry } from '../core/content.core';

const apiKey = config.geminiKey;

if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(config.geminiKey);
const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
});

export const GeminiService = {
    /**
     * Generates the first 100 words for a user.
     */
    async generateInitialWords(nativeLang: string, targetLang: string): Promise<WordEntry[]> {
        const { prompt, schema } = generateWordListPrompt(nativeLang, targetLang);

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: schema
            },
        });

        const responseText = result.response.text();
        return parseGeminiResponse(responseText);
    }
};
