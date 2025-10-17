'use server';
/**
 * @fileOverview A Text-to-Speech (TTS) flow using Genkit.
 *
 * This file defines a Genkit flow that converts a given text string into speech audio.
 * - textToSpeech - The main function to call the TTS flow.
 * - TtsInput - The input type for the textToSpeech function.
 * - TtsOutput - The return type for the textToSpeech function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import wav from 'wav';
import { TtsInput, TtsOutput } from '@/lib/types';


// Helper to convert raw PCM data to a WAV file in memory
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

    let bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

// Genkit flow definition
const ttsFlow = ai.defineFlow(
  {
    name: 'textToSpeech',
    inputSchema: z.string(),
    outputSchema: z.object({ media: z.string() }),
  },
  async (query) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: query,
    });

    if (!media?.url) {
      throw new Error('No media returned from TTS model.');
    }
    
    // The model returns raw PCM data as a base64 string.
    const pcmData_base64 = media.url.substring(media.url.indexOf(',') + 1);
    const audioBuffer = Buffer.from(pcmData_base64, 'base64');
    
    // Convert PCM to WAV
    const wavBase64 = await toWav(audioBuffer);

    return {
      media: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);


// Exported function to be called from the client
export async function textToSpeech(input: TtsInput): Promise<TtsOutput> {
  return ttsFlow(input);
}
