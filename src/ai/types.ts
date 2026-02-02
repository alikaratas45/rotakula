import { z } from 'zod';

export const NARRATE_MAX_CHAR_LENGTH = 1000;

export const NarrationInputSchema = z.object({
  text: z
    .string()
    .max(NARRATE_MAX_CHAR_LENGTH)
    .describe('The text to be narrated.'),
  voice: z.string().optional().describe('The voice to use for narration.'),
  language: z.string().optional().default('en').describe('The language of the text.'),
});
export type NarrationInput = z.infer<typeof NarrationInputSchema>;

export const NarrationOutputSchema = z.object({
    audio: z.string().describe("The narrated audio as a Base64 encoded WAV data URI."),
});
export type NarrationOutput = z.infer<typeof NarrationOutputSchema>;
