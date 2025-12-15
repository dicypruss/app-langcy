
/**
 * Highlights occurrences of a target word within a context sentence using Markdown bold syntax (*word*).
 * Case-insensitive matching. Preserves original casing.
 * 
 * @param context The full sentence (e.g. "I have a cat")
 * @param target The word to highlight (e.g. "Cat")
 * @returns The formatted string (e.g. "I have a *cat*")
 */
export function highlightTargetInContext(context: string | undefined, target: string): string {
    if (!context || !target) return context || '';

    // Escape regex characters in target
    const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Regex to match whole words if possible, or just the string
    // Using simple replacement for now. 
    // \b might break for non-latin scripts (like Greek/Russian sometimes), but usually safe enough.
    // Let's try flexible matching.

    const regex = new RegExp(`(${escapedTarget})`, 'gi');

    // Bold with * for MarkdownV2 or Markdown (Telegram usually supports *text* for bold in MD)
    // Actually, in default Markdown, * is Italic, ** is Bold.
    // In Telegram MarkdownV2, *bold* is Bold.
    // In Telegram Markdown (Legacy), *bold* is Bold.
    // Let's assume we use standard parse_mode='Markdown' which uses *bold*.
    // However, InteractionService sends raw text usually? Scheduler sends keys.
    // Scheduler `sendTaskToUser` uses `sendMessage` without parse_mode arg!
    // We need to add parse_mode: 'Markdown' to `sendMessage`.

    return context.replace(regex, '*$1*');
}
