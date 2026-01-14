
import {NextResponse} from 'next/server';
import {genkit, googleAI} from 'genkit';
import {z} from 'genkit/zod';
import {configureGenkit} from 'genkit/core';
import wav from 'wav';

// Configure Genkit with the Google AI plugin
// This is typically done in a separate configuration file (e.g., genkit.config.ts)
// but can be done here for simplicity in a Next.js API route.
configureGenkit({
  plugins: [
    googleAI({
      // Make sure to set your GEMINI_API_KEY in your .env.local file
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

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
    writer.on('data', (d: any) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {text} = body;

    if (!text) {
      return NextResponse.json({error: 'Text is required'}, {status: 400});
    }

    const {media} = await genkit.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'}, // A standard male voice
          },
        },
      },
      prompt: text,
    });

    if (!media || !media.url) {
      throw new Error('No audio media returned from the model.');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);
    const audioDataUri = `data:audio/wav;base64,${wavBase64}`;

    return NextResponse.json({audio: audioDataUri});
  } catch (error) {
    console.error('TTS API Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      {error: 'Failed to generate speech.', details: errorMessage},
      {status: 500}
    );
  }
}
