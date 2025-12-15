import { highlightTargetInContext } from '../utils/string.utils';

export enum TaskType {
    CHOOSE_OPTION = 'choose_option',
    FILL_GAP = 'fill_gap' // For future
}

export interface Task {
    type: TaskType;
    question: string;
    options: string[]; // List of possible answers
    correctAnswer: string; // The exact string of the correct answer
    meta: {
        wordId: number;
        direction?: 'target->native' | 'native->target';
    };
}

// Minimal interface for Word to avoid importing strict DB types in core
export interface Word {
    id: number;
    original: string;
    translation: string;
    context_target?: string;
    context_native?: string;
    [key: string]: any;
}

/**
 * Generates a "Choose the Right Option" task.
 * @param target The word to learn
 * @param distractors List of at least 3 other words to serve as wrong answers
 * @param direction Direction of translation (default: target->native)
 */
export type TaskDirection = 'target->native' | 'native->target';

export function generateOptionsTask(target: Word, distractors: Word[], direction: TaskDirection = 'target->native'): Task {
    if (distractors.length < 3) {
        throw new Error('Need at least 3 distractors to generate an options task');
    }

    // 1. Prepare options pool
    const optionsPool = [target, ...distractors];

    // 2. Shuffle options
    for (let i = optionsPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optionsPool[i], optionsPool[j]] = [optionsPool[j], optionsPool[i]];
    }

    // 3. Extract strings based on direction
    let question = '';
    let correctAnswer = '';
    let optionStrings: string[] = [];

    if (direction === 'target->native') {
        // Q: Original (Target) -> A: Translation (Native)
        question = `How do you translate: "${target.original}"?`;
        correctAnswer = target.context_native
            ? `${target.translation} (${target.context_native})`
            : target.translation;

        optionStrings = optionsPool.map(w => {
            if (w.context_native) {
                return `${w.translation} (${w.context_native})`;
            }
            return w.translation;
        });
    } else {
        // Q: Translation (Native) -> A: Original (Target) (with context)
        // If we have context, show it!
        // highlighting doesn't apply to specific word if the question is "Translate X".
        // But the user asked for context bolding.
        // Wait, "Learning word inside context".
        // If question is "How do you translate: Cat?", there is no context shown yet usually.
        // UNLESS we add context to the question: "How do you translate: Cat (The *cat* sat)"?

        // Let's assume we want to bold it in the FEEDBACK (InteractionService) primarily, 
        // or if we show context in question.

        // Current Logic:
        // const qContext = target.context_native ? ` (${target.context_native})` : '';
        // question = `How do you translate: "${target.translation}"${qContext}?`;

        // Let's highlight the word in the context if it appears.

        const qContext = target.context_native
            ? ` (${highlightTargetInContext(target.context_native, target.translation)})`
            : '';

        question = `How do you translate: "${target.translation}"${qContext}?`;
        correctAnswer = target.original;

        // Options are just the original target words
        optionStrings = optionsPool.map(w => w.original);
    }

    return {
        type: TaskType.CHOOSE_OPTION,
        question,
        options: optionStrings,
        correctAnswer,
        meta: {
            wordId: target.id,
            direction
        }
    };
}
