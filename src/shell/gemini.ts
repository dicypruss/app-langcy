import { GoogleGenAI } from '@google/genai';
import { generateWordListPrompt } from '../core/onboarding.core';
import { config } from '../config';
import { parseGeminiResponse, WordEntry } from '../core/content.core';

const apiKey = config.geminiKey;

if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
}

// New SDK Initialization
const genAI = new GoogleGenAI({ apiKey });

export const GeminiService = {
    /**
     * Generates the first 100 words for a user.
     */
    async generateInitialWords(nativeLang: string, targetLang: string): Promise<WordEntry[]> {
        const { prompt, schema } = generateWordListPrompt(nativeLang, targetLang);

        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema
            }
        });

        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) throw new Error('Empty response from Gemini');
        return parseGeminiResponse(responseText);
    },
    /**
     * Analyzes an image to extract words.
     */
    async analyzeImage(prompt: string, schema: any, imageBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<WordEntry[]> {
        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: imageBuffer.toString('base64')
                        }
                    }
                ]
            }],
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema
            }
        });

        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) throw new Error('Empty response from Gemini');
        return parseGeminiResponse(responseText);
    },
    /**
     * Refines the list of extracted words by checking against existing context.
     */
    async refineAnalysis(prompt: string, schema: any): Promise<WordEntry[]> {
        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema
            }
        });

        const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) throw new Error('Empty response from Gemini');
        return parseGeminiResponse(responseText);
    }
};
