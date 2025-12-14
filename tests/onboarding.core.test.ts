import { validateLanguage, generateWordListPrompt } from '../src/core/onboarding.core';
import { SchemaType } from '@google/generative-ai';

describe('Onboarding Core', () => {
    describe('validateLanguage', () => {
        it('should return true for valid inputs', () => {
            expect(validateLanguage('English')).toBe(true);
            expect(validateLanguage('Spanish')).toBe(true);
            expect(validateLanguage('Russian')).toBe(true);
        });

        it('should return false for empty or too short inputs', () => {
            expect(validateLanguage('')).toBe(false);
            expect(validateLanguage('a')).toBe(false);
            expect(validateLanguage('  ')).toBe(false);
        });
    });

    describe('generateWordListPrompt', () => {
        it('should generate a correct prompt and schema', () => {
            const native = 'English';
            const target = 'Spanish';
            const result = generateWordListPrompt(native, target);

            expect(result.prompt).toContain('100 most popular words');
            expect(result.schema).toBeDefined();
            expect(result.schema.type).toBe(SchemaType.ARRAY);
            expect(result.schema.items.properties.original).toBeDefined();
        });
    });
});
