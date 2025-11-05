
'use server';
/**
 * @fileOverview Converts text to speech using a Genkit flow.
 *
 * - textToSpeech - A function that handles the text-to-speech process.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav';

const TextToSpeechInputSchema = z.object({
    text: z.string().describe("The text to be converted to speech."),
    voice: z.string().optional().describe("The voice to use for the speech synthesis (e.g., 'tr-TR-Standard-A', 'en-US-Standard-A').")
});

export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  media: z.string().describe("A base64 encoded WAV audio file as a data URI."),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async ({ text, voice }) => {
    const voiceMap: { [key: string]: string } = {
        'tr-TR': 'tr-TR-Standard-A',
        'en-US': 'en-US-News-K',
        'fr-FR': 'fr-FR-Standard-A',
        'de-DE': 'de-DE-Standard-A'
    };
    
    const mappedVoice = voice ? voiceMap[voice] || 'tr-TR-Standard-A' : 'tr-TR-Standard-A';

    const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: mappedVoice },
                },
            },
        },
        prompt: text,
    });
    if (!media) {
        throw new Error('No media was returned from the text-to-speech model.');
    }
    const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
    );
    const wavBase64 = await toWav(audioBuffer);
    
    return {
        media: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
