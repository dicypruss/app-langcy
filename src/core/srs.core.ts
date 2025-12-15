import { SRSConfig } from './srs_configs';

export interface SRSMeta {
    confidence: number; // 0-100
    streak: number;
    interval: number; // in minutes
}

export interface SRSResult extends SRSMeta {
    nextReviewAt: Date;
}

/**
 * Calculates the next review time based on correctness and a specific algorithm config.
 * @param failureMode Required failure mode ('reset', 'regress', etc.)
 */
export function calculateNextReview(current: SRSMeta, isCorrect: boolean, config: SRSConfig, failureMode: string = 'reset'): SRSResult {
    let { confidence, streak, interval } = current;
    const now = new Date();

    if (isCorrect) {
        // ... (Growth logic unchanged)
        streak = streak + 1;
        confidence = Math.min(100, confidence + 10);

        if (streak <= config.initialIntervals.length) {
            interval = config.initialIntervals[streak - 1];
        } else {
            interval = Math.ceil(interval * config.multiplier);
        }

    } else {
        // Answer is Wrong
        confidence = Math.max(0, confidence - 20);

        // Failure Logic based on User Preference
        if (failureMode === 'regress') {
            streak = Math.max(0, streak - 1);
        } else {
            streak = 0;
        }

        // Recalculate Interval based on NEW streak
        if (streak === 0) {
            interval = config.initialIntervals[0];
        } else if (streak <= config.initialIntervals.length) {
            interval = config.initialIntervals[streak - 1];
        } else {
            // Fallback: If regressed but still above initials, use last initial interval.
            interval = config.initialIntervals[config.initialIntervals.length - 1];
        }
    }

    const nextReviewAt = new Date(now.getTime() + interval * 60000);

    return {
        confidence,
        streak,
        interval,
        nextReviewAt
    };
}
