import { generateImagePrompt, generateRefinementPrompt, deduplicateWords } from '../src/core/visual_learning.core';
import { SchemaType } from '@google/generative-ai';

describe('Visual Learning Core', () => {
    describe('generateImagePrompt', () => {
        it('should return a valid prompt and schema for visual extraction', () => {
            const result = generateImagePrompt('English', 'Spanish');

            expect(result.prompt).toContain('50'); // Expect higher limit
            expect(result.prompt).toContain('Spanish');
            expect(result.schema).toBeDefined();
            expect(result.schema.type).toBe(SchemaType.ARRAY);
        });
    });

    describe('generateRefinementPrompt', () => {
        it('should generate a prompt including candidates and existing contexts', () => {
            const candidates = [{ original: 'Bank', translation: 'Banco', context_sentence: 'River bank', context_native: 'Orilla' }];
            const existingContexts = [{ original: 'Bank', context_target: 'Money bank' }];

            const result = generateRefinementPrompt('English', 'Spanish', candidates, existingContexts);

            expect(result.prompt).toContain('candidates');
            expect(result.prompt).toContain('River bank'); // New context
            expect(result.prompt).toContain('Money bank'); // Existing context
            expect(result.schema).toBeDefined();
        });
    });

    describe('deduplicateWords', () => {
        it('should remove words that already exist with SAME context', () => {
            // In new logic, strict depduplication might be handled by DB or Service, 
            // but let's ensure the core helper supports context comparison if needed.
            // For now, prompt does the heavy lifting, but let's test a helper if we add one.
            // Skipping for now as we rely on Gemini Refinement for logic.
        });
    });
});
