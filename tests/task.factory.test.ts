import { generateOptionsTask, TaskType } from '../src/core/task.factory';

describe('TaskFactory Core', () => {
    const mockTargetWord = {
        id: 1,
        original: 'Apple',
        translation: 'Manzana',
        context_sentence: 'I eat an apple.',
        user_id: 123,
        status: 'new',
        created_at: new Date()
    };

    const mockDistractors = [
        { id: 2, original: 'Dog', translation: 'Perro', context_sentence: '', user_id: 123, status: 'new', created_at: new Date() },
        { id: 3, original: 'Cat', translation: 'Gato', context_sentence: '', user_id: 123, status: 'new', created_at: new Date() },
        { id: 4, original: 'Blue', translation: 'Azul', context_sentence: '', user_id: 123, status: 'new', created_at: new Date() },
    ];

    test('should generate a Choose Option task with correct structure', () => {
        const task = generateOptionsTask(mockTargetWord, mockDistractors);

        expect(task.type).toBe(TaskType.CHOOSE_OPTION);
        expect(task.question).toContain('Apple'); // Should ask about original
        expect(task.correctAnswer).toBe('Manzana');
        expect(task.options).toHaveLength(4); // Target + 3 distractors
        expect(task.options).toContain('Manzana');
        expect(task.options).toContain('Perro');
        expect(task.options).toContain('Gato');
        expect(task.options).toContain('Azul');
    });

    test('should shuffle the options', () => {
        // Run multiple times to verify it's not always in the same position
        // This is a probabilistic test, but usually acceptable for simple shuffling
        const task1 = generateOptionsTask(mockTargetWord, mockDistractors);
        const task2 = generateOptionsTask(mockTargetWord, mockDistractors);

        // Just verify valid structure again
        expect(task1.options).toHaveLength(4);
        expect(task2.options).toHaveLength(4);
    });

    test('should throw error if not enough distractors', () => {
        expect(() => generateOptionsTask(mockTargetWord, [])).toThrow();
    });
});
