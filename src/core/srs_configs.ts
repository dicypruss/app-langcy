export type SRSMode = 'sm2' | 'pimsleur' | 'fsrs' | 'leitner' | 'anki';

export interface SRSConfig {
    name: SRSMode;
    description: string;

    // The "Learning Phase".
    // Number of successful reviews needed = initialIntervals.length.
    // e.g. [1m, 10m] -> Needs 2 successes to "graduate".
    initialIntervals: number[];

    // The "Review Phase" (Exponential).
    // Applied after initialIntervals are exhausted.
    // Multiplier for subsequent intervals (after initials are exhausted)
    multiplier: number;

}

export const SRS_ALGORITHMS: Record<SRSMode, SRSConfig> = {
    'sm2': {
        name: 'sm2',
        description: 'Standard Balanced (SuperMemo 2 style)',
        initialIntervals: [10, 24 * 60, 3 * 24 * 60, 7 * 24 * 60], // 10m, 1d, 3d, 7d
        multiplier: 2.5
    },
    'pimsleur': {
        name: 'pimsleur',
        description: 'Fast Audio (Rapid Fire)',
        initialIntervals: [1, 5, 20, 60, 5 * 60, 24 * 60], // 1m, 5m, 20m, 1h, 5h, 1d
        multiplier: 2.0
    },
    'fsrs': {
        name: 'fsrs',
        description: 'High Efficiency (FSRS inspired)',
        initialIntervals: [24 * 60, 4 * 24 * 60, 14 * 24 * 60], // 1d, 4d, 14d
        multiplier: 3.5
    },
    'leitner': {
        name: 'leitner',
        description: 'Simple Doubling (Box System)',
        initialIntervals: [24 * 60, 2 * 24 * 60, 4 * 24 * 60, 8 * 24 * 60, 16 * 24 * 60],
        multiplier: 2.0
    },
    'anki': {
        name: 'anki',
        description: 'Hardcore Crunch',
        initialIntervals: [1, 10, 24 * 60, 3 * 24 * 60], // 1m, 10m, 1d, 3d
        multiplier: 2.5
    }
};

export const DEFAULT_SRS_MODE: SRSMode = 'sm2';
