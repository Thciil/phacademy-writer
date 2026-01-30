import { NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';
import { WRITER_SYSTEM_PROMPTS, buildWriterUserPrompt } from '@/lib/prompts';
import { GenerateRequest, GenerateResponse } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json();

    const contentType = body.contentType;
    const title = body.title;
    const description = body.description;
    const metadata = body.metadata ?? {};
    const transcript = body.transcript;
    const clarificationAnswers = body.clarificationAnswers;

    // Basic validation
    if (!contentType || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the appropriate system prompt
    const systemPrompt = WRITER_SYSTEM_PROMPTS[contentType];

    if (!systemPrompt) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Build the user prompt
    const userPrompt = buildWriterUserPrompt(
      { contentType, title, description, metadata, transcript },
      clarificationAnswers
    );

    // Call OpenAI
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
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
    console.error('Generate API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate content';
    const isConfigError = message.includes('OPENAI_API_KEY');
    return NextResponse.json(
      { error: isConfigError ? 'OpenAI API key missing or invalid. Add OPENAI_API_KEY to .env.local' : message },
      { status: isConfigError ? 503 : 500 }
    );
  }
}
