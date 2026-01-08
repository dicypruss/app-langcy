import { GoogleGenAI } from '@google/genai';
import { config } from '../../config';

// Simple valid WAV header generator for PCM data
// PCM: 1 channel, 24kHz, 16-bit (2 bytes per sample)
function createWavHeader(pcmDataLength: number, sampleRate: number = 24000, channels: number = 1): Buffer {
    const header = Buffer.alloc(44);

    // RIFF chunk
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + pcmDataLength, 4); // File size - 8
    header.write('WAVE', 8);

    // fmt subchunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    header.writeUInt16LE(channels, 22); // NumChannels
    header.writeUInt32LE(sampleRate, 24); // SampleRate
    header.writeUInt32LE(sampleRate * channels * 2, 28); // ByteRate
    header.writeUInt16LE(channels * 2, 32); // BlockAlign
    header.writeUInt16LE(16, 34); // BitsPerSample

    // data subchunk
    header.write('data', 36);
    header.writeUInt32LE(pcmDataLength, 40);

    return header;
}


export class AudioService {

    private static genAI = new GoogleGenAI({ apiKey: config.geminiKey });

    /**
     * Generates audio using Gemini 2.5 TTS model.
     * Returns a WAV Buffer (PCM data + Header).
     * 
     * @param text Text to speak
     * @param lang Language (e.g. 'Greek', 'en', 'es')
     * @param voiceName Optional voice name (default: 'Kore')
     */
    static async getAudio(text: string, lang: string, voiceName: string = 'Kore'): Promise<Buffer> {
        // Try multiple prompt strategies to improve reliability
        const prompts = [
            `Pronounce this text in ${lang}: "${text}"`,
            `Say in ${lang}: ${text}`,
            text // Fallback to raw text
        ];

        let lastError;

        for (const promptText of prompts) {
            try {
                // console.log(`[AudioService] Trying prompt: ${promptText}`);
                const response = await this.genAI.models.generateContent({
                    model: "gemini-2.5-flash-preview-tts",
                    contents: [{ parts: [{ text: promptText }] }],
                    config: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: {
                                    voiceName: voiceName
                                },
                            },
                        },
                    },
                });

                // The SDK returns base64 PCM data
                // @ts-ignore
                const dataBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

                if (dataBase64) {
                    const pcmBuffer = Buffer.from(dataBase64, 'base64');
                    const header = createWavHeader(pcmBuffer.length);
                    return Buffer.concat([header, pcmBuffer]);
                }

                // If we get here, no data but no throw (e.g. finishReason OTHER)
                // Continue to next prompt

            } catch (e) {
                lastError = e;
                // Continue to next prompt
            }
        }

        console.error(`[AudioService] All prompts failed for "${text}" (${lang})`);
        throw lastError || new Error('No audio data received from Gemini API after retries');
    }
}
