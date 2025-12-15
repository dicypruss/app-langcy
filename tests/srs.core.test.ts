import { calculateNextReview, SRSResult } from 'src/core/srs.core';

describe('SRS Core Algorithm', () => {
    test('should handle correct answer (confidence increase)', () => {
        const currentMeta = {
            confidence: 50,
            streak: 2,
            interval: 1440 // 1 day
        };

        const result = calculateNextReview(currentMeta, true);

        expect(result.confidence).toBeGreaterThan(50);
        expect(result.streak).toBe(3);
        expect(result.interval).toBeGreaterThan(1440); // Interval should grow
    });

    test('should handle wrong answer (confidence penalty)', () => {
        const currentMeta = {
            confidence: 50,
            streak: 5,
            interval: 2880 // 2 days
        };

        const result = calculateNextReview(currentMeta, false);

        expect(result.confidence).toBeLessThan(50);
        expect(result.streak).toBe(0); // Reset streak on wrong
        expect(result.interval).toBeLessThan(2880); // Shrink interval
    });

    test('should graduate item if streak reaches 10', () => {
        const currentMeta = {
            confidence: 90,
            streak: 9,
            interval: 5000
        };

        const result = calculateNextReview(currentMeta, true);

        expect(result.streak).toBe(10);
        // We might want a flag for graduation, or just check streak in scheduler
    });

    test('new item should have short interval after first correct', () => {
        const currentMeta = {
            confidence: 0,
            streak: 0,
            interval: 0
        };

        const result = calculateNextReview(currentMeta, true);

        // First review should be short, e.g., 10 minutes or 1 hour
        expect(result.interval).toBeGreaterThan(0);
        expect(result.interval).toBeLessThan(1440);
    });
});
