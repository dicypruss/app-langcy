
import { AudioService } from '../src/shell/services/audio.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
    console.log('Testing AudioService failures...');

    const cases = [
        { text: 'καλός', lang: 'Greek' },
        { text: 'βλέπω', lang: 'Greek' },
        { text: 'για', lang: 'Greek' },
    ];

    for (const c of cases) {
        console.log(`\nTesting prompt "${c.text}"...`);
        try {
            // Bypass service helper to test raw prompt if needed, 
            // but AudioService wraps it. Let's modify AudioService to TAKE raw prompt if we want to test variations?
            // Actually, let's just hack AudioService to PASS THROUGH text if it starts with 'RAW:'
            // No, easier to just quick-edit AudioService to log but NOT wrap, for a moment?
            // Or just use the service as is, assuming we change the service code.

            // Let's change the service code to try a better prompt, then run the original test cases.
        } catch (e: any) {
        }
    }

    for (const c of cases) {
        console.log(`\nTesting "${c.text}" (${c.lang})...`);
        try {
            const buffer = await AudioService.getAudio(c.text, c.lang);
            console.log(`✅ Success! Buffer: ${buffer.length}`);
        } catch (e: any) {
            console.error(`❌ Failed:`, e.message);
        }
    }
}

test();
