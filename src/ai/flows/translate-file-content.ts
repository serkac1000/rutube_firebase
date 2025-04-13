'use server';
/**
 * @fileOverview A file content translation AI agent.
 *
 * - translateFileContent - A function that handles the file translation process.
 * - TranslateFileContentInput - The input type for the translateFileContent function.
 * - TranslateFileContentOutput - The return type for the translateFileContent function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const TranslateFileContentInputSchema = z.object({
  fileContent: z.string().describe('The content of the file to be translated.'),
});
export type TranslateFileContentInput = z.infer<typeof TranslateFileContentInputSchema>;

const TranslateFileContentOutputSchema = z.object({
  translatedContent: z.string().describe('The translated content in Russian.'),
  success: z.boolean().describe('Whether the translation was successful.'),
});
export type TranslateFileContentOutput = z.infer<typeof TranslateFileContentOutputSchema>;

export async function translateFileContent(input: TranslateFileContentInput): Promise<TranslateFileContentOutput> {
  return translateFileContentFlow(input);
}

const translationPrompt = ai.definePrompt({
  name: 'translationPrompt',
  input: {
    schema: z.object({
      fileContent: z.string().describe('The content of the file to be translated.'),
    }),
  },
  output: {
    schema: z.object({
      translatedContent: z.string().describe('The translated content in Russian.'),
      success: z.boolean().describe('Whether the translation was successful.'),
    }),
  },
  prompt: `You are a translation expert. You will receive English text and translate it to Russian.

  Source Text:
  {{fileContent}}

  Translation:
  `,
});

const translateFileContentFlow = ai.defineFlow<
  typeof TranslateFileContentInputSchema,
  typeof TranslateFileContentOutputSchema
>(
  {
    name: 'translateFileContentFlow',
    inputSchema: TranslateFileContentInputSchema,
    outputSchema: TranslateFileContentOutputSchema,
  },
  async input => {
    try {
      const {output} = await translationPrompt(input);
      // Added a check to ensure translatedContent exists
      if (output?.translatedContent) {
        return {
          translatedContent: output.translatedContent,
          success: true,
        };
      } else {
        return {
          translatedContent: 'Translation failed.',
          success: false,
        };
      }
    } catch (error) {
      console.error('Translation failed:', error);
      return {
        translatedContent: 'Translation failed due to an error.',
        success: false,
      };
    }
  }
);
