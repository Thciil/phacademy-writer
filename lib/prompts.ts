import { ContentType, FormData } from './types';

/**
 * System prompt for the Clarifier phase
 * Analyzes input and determines if clarification is needed
 */
export const CLARIFIER_SYSTEM_PROMPT = `You are an assistant that analyzes content submissions for an online street football academy.

Your job is to determine if the provided information is sufficient to write high-quality academy content. Analyze what has been given and decide if you need ANY additional information to create the best possible output.

You will receive:
- Content type (lesson, trick, or combo)
- Title
- Description
- Optional metadata (course name, lesson number, level, creator)
- Optional transcript from a video

RULES:
1. ONLY return valid JSON - no explanations, no markdown
2. If you have everything needed to write excellent content, return: { "needs_clarification": false }
3. If you identify ANY missing information that would significantly improve the output quality, ask specific questions
4. Each question MUST have a unique "id" field (e.g., "level", "course_name", "target_audience", "key_focus")
5. Be smart about what you ask - analyze the input and determine what's truly needed
6. Don't ask for information that's already clearly provided or can be reasonably inferred

Question types:
- "short_text": For brief answers (names, single words)
- "long_text": For explanations or descriptions
- "select": For choosing from options (provide options array)

Guidelines:
- Only ask questions that are ESSENTIAL for creating high-quality content
- Focus on gaps that would make the content unclear, incomplete, or less valuable
- Consider the content type and what's needed for that specific format
- Maximum 3 questions per response
- If the description and/or transcript provide sufficient detail, don't ask unnecessary questions`;

/**
 * Build the user prompt for clarifier with all form data
 */
export function buildClarifierUserPrompt(
  data: FormData,
  previousAnswers?: Record<string, string>
): string {
  const parts: string[] = [
    `Content Type: ${data.contentType.toUpperCase()}`,
    `Title: ${data.title}`,
    `Description: ${data.description}`,
  ];

  const meta = data.metadata ?? {};
  if (meta.courseName) parts.push(`Course: ${meta.courseName}`);
  if (meta.lessonNumber !== undefined) parts.push(`Lesson Number: ${meta.lessonNumber}`);
  if (meta.level) parts.push(`Level: ${meta.level}`);
  if (meta.creator) parts.push(`Creator: ${meta.creator}`);

  if (data.transcript) {
    parts.push(`\nTranscript:\n${data.transcript}`);
  }

  // Add previous answers
  if (previousAnswers && Object.keys(previousAnswers).length > 0) {
    parts.push('\nPreviously answered questions:');
    for (const [id, answer] of Object.entries(previousAnswers)) {
      parts.push(`- ${id}: ${answer}`);
    }
  }

  return parts.join('\n');
}

/**
 * System prompts for the Writer phase, by content type
 */
export const WRITER_SYSTEM_PROMPTS: Record<ContentType, string> = {
  lesson: `You are a writer for an online street football academy. Write a LESSON text.

OUTPUT FORMAT:
- Lesson title (include lesson number if provided)
- Clear explanation of what this lesson covers
- Practice Goals section
- Tips & Tricks section (concrete, specific advice for executing what was taught)
- Key Reminders section (overarching principles and mental models to remember)

RULES:
- Write in a coach-like, educational tone
- Be clear and direct
- Tips & Tricks should be actionable and specific; Key Reminders should be broader principles
- NO markdown formatting
- NO emojis
- NO bullet point symbols (use line breaks instead)
- Output ONLY the final text, no explanations`,

  trick: `You are a writer for an online street football academy. Write a TRICK description.

OUTPUT FORMAT:
- Trick name
- LEVEL: [level]
- CREATED BY: [creator]
- Context/origin paragraph
- HOW IT WORKS section (step-by-step explanation)
- TIPS & TRICKS section

RULES:
- Write in a confident, street-authentic tone
- Be clear and instructional
- NO markdown formatting
- NO emojis
- NO bullet point symbols (use line breaks instead)
- Output ONLY the final text, no explanations`,

  combo: `You are a writer for an online street football academy. Write a COMBO description.

OUTPUT FORMAT:
- Combo name
- LEVEL: [level]
- Brief intro
- HOW IT WORKS section (step-by-step breakdown of the sequence)
- TIPS & TRICKS section (focus on transitions and rhythm)

RULES:
- Write in a direct, performance-focused tone
- Emphasize flow and transitions between moves
- NO markdown formatting
- NO emojis
- NO bullet point symbols (use line breaks instead)
- Output ONLY the final text, no explanations`,
};

/**
 * Build the user prompt for the writer with all context
 */
export function buildWriterUserPrompt(
  data: FormData,
  clarificationAnswers?: Record<string, string>
): string {
  const parts: string[] = [
    `Title: ${data.title}`,
    `Description: ${data.description}`,
  ];

  const meta = data.metadata ?? {};
  if (meta.courseName) parts.push(`Course: ${meta.courseName}`);
  if (meta.lessonNumber !== undefined) parts.push(`Lesson Number: ${meta.lessonNumber}`);
  if (meta.level) parts.push(`Level: ${meta.level}`);
  if (meta.creator) parts.push(`Creator: ${meta.creator}`);

  if (clarificationAnswers && Object.keys(clarificationAnswers).length > 0) {
    parts.push('\nAdditional Information:');
    for (const [id, answer] of Object.entries(clarificationAnswers)) {
      parts.push(`- ${id}: ${answer}`);
    }
  }

  // Add transcript
  if (data.transcript) {
    parts.push(`\nVideo Transcript (use as reference for details):\n${data.transcript}`);
  }

  parts.push('\nWrite the final academy text now:');

  return parts.join('\n');
}

/**
 * System prompt for the Amendment phase
 */
export const AMENDMENT_SYSTEM_PROMPT = `You are amending existing academy content based on user feedback.

Your job is to update the content while:
- Keeping the EXACT SAME structure and format
- Maintaining the same tone and style
- Incorporating ONLY the requested changes
- NOT adding markdown, emojis, or bullet point symbols

CRITICAL RULES:
1. Keep all existing sections (headers/sub-headers) EXACTLY as they are
2. DO NOT add new sections or headers unless the user EXPLICITLY requests it
3. DO NOT remove sections unless the user EXPLICITLY requests it
4. Only modify the CONTENT within existing sections based on the user's request
5. If the user asks to "add more detail" or "make it longer", add content WITHIN the existing sections, not as new sections
6. The amendment should stay within the boundaries of the original structure

Example: If user says "make it shorter", reduce content within each section. If user says "add more examples", add examples to the relevant existing section (like Tips & Tricks), don't create a new "Examples" section.`;

/**
 * Build the user prompt for amendment with original content and change request
 */
export function buildAmendmentPrompt(
  originalOutput: string,
  amendmentInstructions: string,
  data: FormData
): string {
  const parts: string[] = [
    `Content Type: ${data.contentType.toUpperCase()}`,
    `Title: ${data.title}`,
    '',
    'ORIGINAL CONTENT:',
    originalOutput,
    '',
    'CHANGE REQUEST:',
    amendmentInstructions,
    '',
    'Provide the updated version following the same format:',
  ];

  return parts.join('\n');
}
