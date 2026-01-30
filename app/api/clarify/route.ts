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

    // Validate the response
    if (clarifyResponse.needs_clarification && clarifyResponse.questions) {
      // Filter out malformed questions
      const validQuestions = clarifyResponse.questions.filter((q) => {
        const hasRequiredFields = q.id && q.question && q.type;
        const hasValidType = ['short_text', 'long_text', 'select'].includes(q.type);
        const hasOptionsIfSelect = q.type !== 'select' || (q.options && q.options.length > 0);

        if (!hasRequiredFields || !hasValidType || !hasOptionsIfSelect) {
          console.warn('Filtered out malformed question:', q);
          return false;
        }

        // Extra check: don't ask about level for lessons
        if (contentType === 'lesson' && (q.id === 'level' || q.question.toLowerCase().includes('level'))) {
          console.warn('Filtered out level question for lesson:', q);
          return false;
        }

        return true;
      });

      // If all questions were filtered out, skip clarification
      if (validQuestions.length === 0) {
        return NextResponse.json({ needs_clarification: false });
      }

      clarifyResponse.questions = validQuestions;
    }

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
