export interface SRSMeta {
    confidence: number; // 0-100
    streak: number;
    interval: number; // in minutes
}

export interface SRSResult extends SRSMeta {
    nextReviewAt: Date;
}

/**
 * Calculates the next review time based on correctness.
 * Inspired by simplified SM-2 but using minutes/hours for granularity.
 */
export function calculateNextReview(current: SRSMeta, isCorrect: boolean, testMode: boolean = false): SRSResult {
    let { confidence, streak, interval } = current;
    const now = new Date();

    if (isCorrect) {
        // Growth logic
        streak += 1;
        confidence = Math.min(100, confidence + 10);

        if (testMode) {
            // Rapid intervals for testing (integers to satisfy DB)
            if (streak === 1) interval = 1; // 1 minute
            else if (streak === 2) interval = 2; // 2 minutes
            else interval = Math.ceil(interval * 1.5);
        } else {
            // Normal Logic
            if (streak === 1) {
                interval = 60; // 1 hour for first successful review
            } else if (streak === 2) {
                interval = 60 * 12; // 12 hours
            } else {
                // Exponential growth: ~2.5 multiplier
                interval = Math.ceil(interval * 2.5);
            }
        }

    } else {
        // Penalty logic
        confidence = Math.max(0, confidence - 20);
        streak = 0;
        interval = testMode ? 0 : 10; // Reset to 0m (test) or 10m (prod)
    }

    const nextReviewAt = new Date(now.getTime() + interval * 60000);

    return {
        confidence,
        streak,
        interval,
        nextReviewAt
    };
}
