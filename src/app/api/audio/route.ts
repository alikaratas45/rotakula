
import { generateAudio, type AudioRequest } from '@/ai/flows/audio-flow';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body: AudioRequest = await req.json();
    
    if (!body.text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const audioResponse = await generateAudio(body);

    return NextResponse.json({ audioDataUri: audioResponse.media });
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to generate audio', details: errorMessage }, { status: 500 });
  }
}
