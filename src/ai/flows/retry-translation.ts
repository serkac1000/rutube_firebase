'use server';
/**
 * @fileOverview A flow to retry translation if it fails the first time.
 *
 * - retryTranslation - A function that handles the retry translation process.
 * - RetryTranslationInput - The input type for the retryTranslation function.
 * - RetryTranslationOutput - The return type for the retryTranslation function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {textToSpeech} from '@/services/text-to-speech';

const RetryTranslationInputSchema = z.object({
  text: z.string().describe('The English text to translate.'),
  attempts: z.number().min(1).max(3).default(3).describe('The number of translation attempts.'),
});
export type RetryTranslationInput = z.infer<typeof RetryTranslationInputSchema>;

const RetryTranslationOutputSchema = z.object({
  translatedText: z.string().describe('The translated Russian text.'),
  audioBlobUrl: z.string().describe('The URL of the translated text audio.'),
});
export type RetryTranslationOutput = z.infer<typeof RetryTranslationOutputSchema>;

export async function retryTranslation(input: RetryTranslationInput): Promise<RetryTranslationOutput> {
  return retryTranslationFlow(input);
}

const translateText = ai.defineTool({
  name: 'translateText',
  description: 'Translates English text to Russian.',
  inputSchema: z.object({
    text: z.string().describe('The English text to translate.'),
  }),
  outputSchema: z.string().describe('The translated Russian text.'),
},
async input => {
    // Simulate translation failure for testing purposes
    if (Math.random() < 0.3) {
      throw new Error('Translation failed.');
    }
    //In real implementation , this function should use actual translation API to translate english to russian
    return `Translated: ${input.text}`;
  }
);

const retryTranslationPrompt = ai.definePrompt({
  name: 'retryTranslationPrompt',
  tools: [translateText],
  input: {
    schema: z.object({
      text: z.string().describe('The English text to translate.'),
    }),
  },
  output: {
    schema: z.object({
      translatedText: z.string().describe('The translated Russian text.'),
    }),
  },
  prompt: `Translate the following English text to Russian. Use the translateText tool.

Text: {{{text}}}`,  
});

const retryTranslationFlow = ai.defineFlow<
  typeof RetryTranslationInputSchema,
  typeof RetryTranslationOutputSchema
>(
  {
    name: 'retryTranslationFlow',
    inputSchema: RetryTranslationInputSchema,
    outputSchema: RetryTranslationOutputSchema,
  },
  async input => {
    let translatedText = '';
    let attempts = 0;
    let success = false;

    while (attempts < input.attempts && !success) {
      try {
        const { output } = await retryTranslationPrompt({ text: input.text });
        translatedText = output!.translatedText;
        success = true;
      } catch (error: any) {
        console.error(`Translation attempt ${attempts + 1} failed: ${error.message}`);
        attempts++;
        // Wait before retrying, implement exponential backoff
        await new Promise(resolve => setTimeout(resolve, attempts * 1000));
      }
    }

    if (!success) {
      throw new Error(`Translation failed after ${input.attempts} attempts.`);
    }

    //Convert translated text to speech
    const audioBlob = await textToSpeech(translatedText);
    const audioBlobUrl = URL.createObjectURL(audioBlob);

    return {
      translatedText: translatedText,
      audioBlobUrl: audioBlobUrl,
    };
  }
);
