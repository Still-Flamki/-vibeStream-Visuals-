'use server';
/**
 * @fileOverview An AI mood detection agent.
 *
 * - detectMood - A function that handles the mood detection process.
 * - DetectMoodInput - The input type for the detectMood function.
 * - DetectMoodOutput - The return type for the detectMood function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectMoodInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectMoodInput = z.infer<typeof DetectMoodInputSchema>;

const DetectMoodOutputSchema = z.object({
  mood: z
    .string()
    .describe("The detected mood of the music (e.g., happy, dark, chill)."),
  colorPalette: z
    .string()
    .describe(
      'A color palette that matches the mood, as a comma-separated list of hex color codes (e.g., #RRGGBB,#RRGGBB,#RRGGBB).'
    ),
  shapes: z
    .string()
    .describe(
      'Shapes that match the mood, as a comma-separated list of shape names (e.g., circles,squares,triangles).'
    ),
});
export type DetectMoodOutput = z.infer<typeof DetectMoodOutputSchema>;

export async function detectMood(input: DetectMoodInput): Promise<DetectMoodOutput> {
  return detectMoodFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectMoodPrompt',
  input: {schema: DetectMoodInputSchema},
  output: {schema: DetectMoodOutputSchema},
  prompt: `You are an AI music mood detection expert.

You will analyze the music and detect its mood.
You will also suggest a color palette and shapes that match the mood.

Analyze the following music:

{{media url=audioDataUri}}

Output the mood, color palette, and shapes in a JSON format.

Example:
{
  "mood": "happy",
  "colorPalette": "#FF0000,#00FF00,#0000FF",
  "shapes": "circles,squares,triangles"
}
`,
});

const detectMoodFlow = ai.defineFlow(
  {
    name: 'detectMoodFlow',
    inputSchema: DetectMoodInputSchema,
    outputSchema: DetectMoodOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
