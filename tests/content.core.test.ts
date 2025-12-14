import { parseGeminiResponse, WordEntry } from '../src/core/content.core';

describe('Content Core', () => {
    describe('parseGeminiResponse', () => {
        it('should parse a raw JSON array', () => {
            const raw = '[{"original": "hola", "translation": "hello", "context_sentence": "test"}]';
            const result = parseGeminiResponse(raw);
            expect(result).toHaveLength(1);
            expect(result[0].original).toBe('hola');
        });

        it('should parse JSON wrapped in markdown code blocks', () => {
            const raw = '```json\n[{"original": "hola", "translation": "hello", "context_sentence": "test"}]\n```';
            const result = parseGeminiResponse(raw);
            expect(result).toHaveLength(1);
            expect(result[0].original).toBe('hola');
        });

        it('should throw an error for invalid JSON', () => {
            const raw = 'invalid json';
            expect(() => parseGeminiResponse(raw)).toThrow();
        });

        it('should filter out invalid entries (missing fields)', () => {
            const raw = '[{"original": "valid", "translation": "ok", "context_sentence": "ok"}, {"original": "invalid"}]';
            const result = parseGeminiResponse(raw);
            expect(result).toHaveLength(1);
            expect(result[0].original).toBe('valid');
        });
    });
});
