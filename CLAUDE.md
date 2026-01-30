# Claude Code Instructions – Academy Content Planner

You are helping build a **personal internal web app** called **Academy Content Planner**.

This app is used by a professional street football player and educator to generate **academy-ready written content** from short inputs and video transcripts.

Your role:
- Act as a **senior product engineer**
- Prioritize **clarity, simplicity, and speed**
- Avoid over-engineering
- Always build for **mobile-first usage**
- Assume the app is used by **one person only**

---

## Core Purpose

The app helps generate **polished academy texts** for three content types:

1. **Lessons** (part of structured courses)
2. **Tricks** (single standalone moves)
3. **Combos** (chains of tricks)

The user provides:
- Content type
- Title / name
- Descriptive context
- Optional metadata (course, level, creator, etc.)
- Optional video transcript (SRT or TXT)

The system:
- Detects missing or unclear information
- Asks **clarifying questions via pop-ups**
- Generates a **final formatted text output**
- Outputs text only (no markdown, no emojis)

---

## Key UX Principles

- **Short forms only**
- **No clutter**
- **Pop-ups are used ONLY when information is missing**
- The user should never have to re-enter everything
- The user stays in control of final wording

---

## AI Interaction Design (Very Important)

The app uses **two AI calls**:

### 1. Clarifier Phase
Purpose:
- Analyze inputs + transcript
- Decide if enough information exists to write final output

Rules:
- DO NOT generate final content here
- ONLY return structured JSON
- If anything essential is missing, ask concise questions

Clarifier response format:

If clarification is needed:
```json
{
  "needs_clarification": true,
  "questions": [
    {
      "id": "level",
      "question": "What level is this? (Beginner / Intermediate / Advanced)",
      "type": "select",
      "options": ["Beginner", "Intermediate", "Advanced"],
      "required": true
    }
  ]
}
```

If no clarification is needed:
```json
{
  "needs_clarification": false
}
```

### 2. Generator Phase
Purpose:
- Generate the final polished academy text
- Use all inputs + clarified answers

Rules:
- Output plain text only (no markdown, no emojis)
- Follow the structure appropriate for the content type
- Keep language clear and professional
- Match the tone of academy educational content

Input to generator:
- Content type
- Title
- Description/context
- Metadata (level, creator, course, etc.)
- Transcript (if provided)
- Clarification answers (if any were asked)

Output:
- Final formatted text ready for copy/paste into academy platform
