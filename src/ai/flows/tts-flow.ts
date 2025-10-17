'use server';
/**
 * @fileOverview A Text-to-Speech (TTS) flow using Genkit.
 *
 * This file defines a Genkit flow that converts a given text string into speech audio.
 * - textToSpeech - The main function to call the TTS flow.
 * - TtsInputSchema - The Zod schema for the input text.
 * - TtsOutputSchema - The Zod schema for the output audio data URI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav';

export const TtsInputSchema = z.string();
export const TtsOutputSchema = z.object({
  media: z.string().describe("The output audio as a data URI."),
});

export type TtsInput = z.infer<typeof TtsInputSchema>;
export type TtsOutput = z.infer<typeof TtsOutputSchema>;

export async function textToSpeech(text: TtsInput): Promise<TtsOutput> {
  return ttsFlow(text);
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

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const ttsFlow = ai.defineFlow(
  {
    name: 'ttsFlow',
    inputSchema: TtsInputSchema,
    outputSchema: TtsOutputSchema,
  },
  async (query) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Alloy' }, // Using a standard voice
          },
        },
      },
      prompt: query,
    });

    if (!media?.url) {
      throw new Error('No media returned from TTS model');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);

    return {
      media: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
