// use server'

/**
 * @fileOverview Reads the translated Russian text aloud using a text-to-speech engine.
 *
 * - readTranslatedText - A function that handles the text-to-speech process.
 * - ReadTranslatedTextInput - The input type for the readTranslatedText function.
 * - ReadTranslatedTextOutput - The return type for the readTranslatedText function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {textToSpeech} from '@/services/text-to-speech';

const ReadTranslatedTextInputSchema = z.object({
  translatedText: z.string().describe('The translated Russian text to be read aloud.'),
});
export type ReadTranslatedTextInput = z.infer<typeof ReadTranslatedTextInputSchema>;

const ReadTranslatedTextOutputSchema = z.object({
  audioBlobUrl: z.string().describe('The URL of the audio blob containing the spoken text.'),
});
export type ReadTranslatedTextOutput = z.infer<typeof ReadTranslatedTextOutputSchema>;

export async function readTranslatedText(input: ReadTranslatedTextInput): Promise<ReadTranslatedTextOutput> {
  return readTranslatedTextFlow(input);
}

const readTranslatedTextFlow = ai.defineFlow<
  typeof ReadTranslatedTextInputSchema,
  typeof ReadTranslatedTextOutputSchema
>(
  {
    name: 'readTranslatedTextFlow',
    inputSchema: ReadTranslatedTextInputSchema,
    outputSchema: ReadTranslatedTextOutputSchema,
  },
  async input => {
    const audioBlob = await textToSpeech(input.translatedText);
    const audioBlobUrl = URL.createObjectURL(audioBlob);

    return {
      audioBlobUrl: audioBlobUrl,
    };
  }
);
