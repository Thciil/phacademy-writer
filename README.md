# Academy Content Planner

A personal web app for generating academy-ready written content from short inputs and video transcripts. Built for professional street football educators to create polished content for lessons, tricks, and combos.

## Features

- **AI-Powered Content Generation**: Generate structured academy content for lessons, tricks, and combos
- **Smart Clarification**: AI analyzes inputs and asks for missing information only when needed
- **Amendment System**: Refine generated content with natural language instructions
- **Diff View**: See exactly what changed with inline diff highlighting
- **Section-Based Copying**: Copy entire content or individual sections
- **Version History**: View original, final, and comparison versions
- **Auto-Save**: Form data persists through page refreshes

## Getting Started

### Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

4. Add your OpenAI API key to `.env.local`:
```
OPENAI_API_KEY=your-openai-api-key-here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Deploy on Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Add your `OPENAI_API_KEY` environment variable in Vercel settings
4. Deploy

## Technology Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- OpenAI API (GPT-4o)
- React

## Project Structure

```
/app
  /api
    /clarify   - Analyzes input and asks clarifying questions
    /generate  - Generates final content
    /amend     - Amends existing content
/components    - React components
/lib           - Utilities and types
```

## License

Private project for personal use.
