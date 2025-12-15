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
    };
}

// Minimal interface for Word to avoid importing strict DB types in core
export interface Word {
    id: number;
    original: string;
    translation: string;
    [key: string]: any;
}

/**
 * Generates a "Choose the Right Option" task.
 * @param target The word to learn
 * @param distractors List of at least 3 other words to serve as wrong answers
 */
export function generateOptionsTask(target: Word, distractors: Word[]): Task {
    if (distractors.length < 3) {
        throw new Error('Need at least 3 distractors to generate an options task');
    }

    // 1. Prepare options pool
    const optionsPool = [target, ...distractors];

    // 2. Shuffle options
    // Fisher-Yates shuffle algorithm
    for (let i = optionsPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optionsPool[i], optionsPool[j]] = [optionsPool[j], optionsPool[i]];
    }

    // 3. Extract translation strings
    const optionStrings = optionsPool.map(w => w.translation);

    return {
        type: TaskType.CHOOSE_OPTION,
        question: `How do you translate: "${target.original}"?`,
        options: optionStrings,
        correctAnswer: target.translation,
        meta: {
            wordId: target.id
        }
    };
}
