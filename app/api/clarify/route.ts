import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
import { CLARIFIER_SYSTEM_PROMPT, buildClarifierUserPrompt } from '@/lib/prompts';
import { ClarifyRequest, ClarifyResponse } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body: ClarifyRequest = await request.json();

    const contentType = body.contentType;
    const title = body.title;
    const description = body.description;
    const metadata = body.metadata ?? {};
    const transcript = body.transcript;
    const previousAnswers = body.previousAnswers;

    // Basic validation
    if (!contentType || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build the user prompt
    const userPrompt = buildClarifierUserPrompt(
      { contentType, title, description, metadata, transcript },
      previousAnswers
    );

    // Call OpenAI
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: CLARIFIER_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    const clarifyResponse: ClarifyResponse = JSON.parse(responseText);

    return NextResponse.json(clarifyResponse);
  } catch (error) {
    console.error('Clarify API error:', error);

    // If JSON parsing failed, return no clarification needed
    if (error instanceof SyntaxError) {
      return NextResponse.json({ needs_clarification: false });
    }

    const message = error instanceof Error ? error.message : 'Failed to process request';
    const isConfigError = message.includes('OPENAI_API_KEY');

    return NextResponse.json(
      { error: isConfigError ? 'OpenAI API key missing or invalid. Add OPENAI_API_KEY to .env.local' : message },
      { status: isConfigError ? 503 : 500 }
    );
  }
}
