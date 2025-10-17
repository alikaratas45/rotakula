'use server';
/**
 * @fileOverview A Text-to-Speech (TTS) flow using Genkit.
 *
 * This file defines a Genkit flow that converts a given text string into speech audio.
 * - textToSpeech - The main function to call the TTS flow.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { Stream } from 'genkit';


// This flow now streams the raw PCM audio data directly to the client.
// The client will be responsible for playing this audio using the Web Audio API.
export async function textToSpeech(
  input: string
): Promise<Stream<string>> {
  const { stream: ttsStream } = await ai.generate({
    model: googleAI.model('gemini-2.5-flash-preview-tts'),
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Algenib' },
        },
      },
    },
    prompt: input,
    stream: true,
  });

  async function* processStream(): AsyncGenerator<string> {
    for await (const chunk of ttsStream) {
      if (chunk.media?.url) {
        const pcmData_base64 = chunk.media.url.substring(
          chunk.media.url.indexOf(',') + 1
        );
        yield pcmData_base64;
      }
    }
  }

  return {
    [Symbol.asyncIterator]: processStream,
  };
}
