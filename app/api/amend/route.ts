import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
import { AMENDMENT_SYSTEM_PROMPT, buildAmendmentPrompt } from '@/lib/prompts';
import { AmendRequest, GenerateResponse } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body: AmendRequest = await request.json();

    const { originalOutput, amendmentInstructions, ...formData } = body;

    // Basic validation
    if (!originalOutput || !amendmentInstructions) {
      return NextResponse.json(
        { error: 'Missing original output or amendment instructions' },
        { status: 400 }
      );
    }

    if (!formData.contentType || !formData.title || !formData.description) {
      return NextResponse.json(
        { error: 'Missing required form fields' },
        { status: 400 }
      );
    }

    // Build the amendment prompt
    const userPrompt = buildAmendmentPrompt(
      originalOutput,
      amendmentInstructions,
      formData
    );

    // Call OpenAI
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: AMENDMENT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    const output = completion.choices[0]?.message?.content;

    if (!output) {
      throw new Error('No response from AI');
    }

    const response: GenerateResponse = { output };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Amend API error:', error);

    const message = error instanceof Error ? error.message : 'Failed to process amendment';
    const isConfigError = message.includes('OPENAI_API_KEY');

    return NextResponse.json(
      { error: isConfigError ? 'OpenAI API key missing or invalid. Add OPENAI_API_KEY to .env.local' : message },
      { status: isConfigError ? 503 : 500 }
    );
  }
}
