import { calculateNextReview, SRSMeta } from '../src/core/srs.core';
import { SRS_ALGORITHMS } from '../src/core/srs_configs';

describe('SRS Core Logic (Multi-Algorithm, Failure Modes)', () => {

    const baseMeta: SRSMeta = {
        confidence: 50,
        streak: 0,
        interval: 0
    };

    describe('SM-2 (mode: reset)', () => {
        const config = SRS_ALGORITHMS['sm2'];

        it('should hard reset on failure', () => {
            // Streak was 5, Interval was huge
            const result = calculateNextReview({ ...baseMeta, streak: 5, interval: 10000 }, false, config, 'reset');
            expect(result.interval).toBe(10); // First initial interval
            expect(result.streak).toBe(0);
        });
    });

    describe('Leitner (mode: regress)', () => {
        const config = SRS_ALGORITHMS['leitner'];

        it('should regress one step on failure', () => {
            // Imagine we are at streak 3 (Box 3) -> interval = 4 days
            // initialIntervals: [1d, 2d, 4d, ...]
            // streak 3 means we just passed box 3, interval was 4d.
            // If we fail now?
            const result = calculateNextReview({ ...baseMeta, streak: 3, interval: 4 * 1440 }, false, config, 'regress');

            // Streak should become 2
            expect(result.streak).toBe(2);
            // Interval should correspond to stage 2 (2 days)
            expect(result.interval).toBe(2 * 1440);
        });

        it('should not regress below 0', () => {
            const result = calculateNextReview({ ...baseMeta, streak: 0, interval: 1000 }, false, config, 'regress');
            expect(result.streak).toBe(0);
            expect(result.interval).toBe(config.initialIntervals[0]);
        });
    });

    describe('SRS Override Logic', () => {
        const config = SRS_ALGORITHMS['sm2']; // Default is 'reset'

        it('should respect failureMode override (Regress on SM2)', () => {
            // SM2 usually resets. Let's force it to regress.
            // Streak is 5 (past initials), Interval is 10000.
            // If reset: streak -> 0.
            // If regress: streak -> 4.
            // SM2 Initials: [10, 1440, 4320, 10080 (7d)]
            // Streak 4 corresponds to index 3 (7d).

            const result = calculateNextReview(
                { ...baseMeta, streak: 5, interval: 10000 },
                false,
                config,
                'regress'
            );

            expect(result.streak).toBe(4);
            // Interval should match stage 4 of SM2 (7d = 10080m)
            expect(result.interval).toBe(config.initialIntervals[3]);
        });
    });
});
