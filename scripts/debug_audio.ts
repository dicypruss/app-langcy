
import { AudioService } from '../src/shell/services/audio.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
    console.log('Testing AudioService with Gemini...');
    try {
        const buffer = await AudioService.getAudio('Say in el: θέλω', 'el');
        console.log('Success! Buffer length:', buffer.length);
    } catch (e) {
        console.error('Failed:', e);
    }
}

test();
