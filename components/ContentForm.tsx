'use client';

import { useState, useRef, useEffect } from 'react';
import { ContentType, FormData, ClarifyQuestion, ClarifyResponse, GenerateResponse } from '@/lib/types';
import { ContentTypeSelector } from './ContentTypeSelector';
import { TranscriptUpload } from './TranscriptUpload';
import { ClarificationModal } from './ClarificationModal';
import { OutputDisplay } from './OutputDisplay';
import { LoadingSpinner } from './LoadingSpinner';

const MAX_CLARIFICATION_ROUNDS = 3;
const STORAGE_KEY = 'academy-content-form-data';

export function ContentForm() {
  // Form state
  const [contentType, setContentType] = useState<ContentType>('lesson');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseName, setCourseName] = useState('');
  const [lessonNumber, setLessonNumber] = useState('');
  const [level, setLevel] = useState('');
  const [creator, setCreator] = useState('');
  const [transcript, setTranscript] = useState('');
  const [transcriptFilename, setTranscriptFilename] = useState<string | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Flow state
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [error, setError] = useState<string | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarifyQuestion[]>([]);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const [clarificationRound, setClarificationRound] = useState(0);
  const [output, setOutput] = useState<string | null>(null);

  // Load form data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setContentType(data.contentType || 'lesson');
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCourseName(data.courseName || '');
        setLessonNumber(data.lessonNumber || '');
        setLevel(data.level || '');
        setCreator(data.creator || '');
        setTranscript(data.transcript || '');
        setTranscriptFilename(data.transcriptFilename || null);
      } catch (e) {
        // Invalid data, ignore
        console.error('Failed to parse saved form data', e);
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    const data = {
      contentType,
      title,
      description,
      courseName,
      lessonNumber,
      level,
      creator,
      transcript,
      transcriptFilename,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [contentType, title, description, courseName, lessonNumber, level, creator, transcript, transcriptFilename]);

  const buildFormData = (): FormData => ({
    contentType,
    title,
    description,
    metadata: {
      courseName: courseName || undefined,
      lessonNumber: lessonNumber ? parseInt(lessonNumber, 10) : undefined,
      level: level as FormData['metadata']['level'] || undefined,
      creator: creator || undefined,
    },
    transcript: transcript || undefined,
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    setLoadingMessage('Analyzing your input...');

    try {
      const formData = buildFormData();

      // Phase 1: Clarify
      const clarifyRes = await fetch('/api/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          previousAnswers: clarificationAnswers,
        }),
      });

      const clarifyData: ClarifyResponse = await clarifyRes.json();

      if (!clarifyRes.ok) {
        throw new Error((clarifyData as { error?: string }).error ?? 'Failed to analyze input');
      }

      if (clarifyData.needs_clarification && clarifyData.questions) {
        // Check if we've hit max rounds
        if (clarificationRound >= MAX_CLARIFICATION_ROUNDS) {
          // Force generate anyway
          await generateContent(formData);
          return;
        }

        setClarificationQuestions(clarifyData.questions);
        setLoading(false);
        return;
      }

      // Phase 2: Generate
      await generateContent(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const generateContent = async (formData: FormData) => {
    setLoadingMessage('Generating content...');

    const generateRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        clarificationAnswers,
      }),
    });

    const generateData: GenerateResponse & { error?: string } = await generateRes.json();

    if (!generateRes.ok) {
      throw new Error(generateData.error ?? 'Failed to generate content');
    }
    setOutput(generateData.output);
    setLoading(false);
    // Clear saved form data after successful generation
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleClarificationSubmit = (answers: Record<string, string>) => {
    setClarificationAnswers((prev) => ({ ...prev, ...answers }));
    setClarificationQuestions([]);
    setClarificationRound((prev) => prev + 1);
    // Re-trigger submission with new answers
    setTimeout(() => handleSubmit(), 0);
  };

  const handleReset = () => {
    setOutput(null);
    setTitle('');
    setDescription('');
    setCourseName('');
    setLessonNumber('');
    setLevel('');
    setCreator('');
    setTranscript('');
    setTranscriptFilename(null);
    setClarificationAnswers({});
    setClarificationRound(0);
    setError(null);
    // Clear saved form data on reset
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleTranscriptUpload = (content: string, filename: string) => {
    setTranscript(content);
    setTranscriptFilename(filename);
  };

  const handleTranscriptClear = () => {
    setTranscript('');
    setTranscriptFilename(null);
  };

  // Show output if generated
  if (output) {
    return <OutputDisplay output={output} onReset={handleReset} formData={buildFormData()} />;
  }

  // Show loading
  if (loading) {
    return <LoadingSpinner message={loadingMessage} />;
  }

  const formEl = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ContentTypeSelector value={contentType} onChange={setContentType} />

      <div>
        <input
          type="text"
          placeholder="Title / Name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>

      <div className="min-h-[7rem]">
        <textarea
          ref={descriptionRef}
          placeholder="Description / Context"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              const textarea = descriptionRef.current;
              if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newValue = description.slice(0, start) + '\n' + description.slice(end);
                setDescription(newValue);
                requestAnimationFrame(() => {
                  textarea.selectionStart = textarea.selectionEnd = start + 1;
                  textarea.focus();
                });
              }
            }
          }}
          required
          className="w-full min-h-[7rem] max-h-[24rem] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-y overflow-auto"
          style={{ minHeight: '7rem' }}
        />
      </div>

      {/* Conditional metadata fields */}
      {contentType === 'trick' && (
        <div>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="">Level (optional)</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      )}

      {contentType === 'trick' && (
        <div>
          <input
            type="text"
            placeholder="Created by (optional)"
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
      )}

      <TranscriptUpload
        filename={transcriptFilename}
        onUpload={handleTranscriptUpload}
        onClear={handleTranscriptClear}
      />

      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!title.trim() || !description.trim()}
        className="w-full py-3 px-4 bg-black text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Generate Content
      </button>
    </form>
  );

  // Show clarification modal
  if (clarificationQuestions.length > 0) {
    return (
      <>
        <div className="opacity-50 pointer-events-none">
          {formEl}
        </div>
        <ClarificationModal
          questions={clarificationQuestions}
          onSubmit={handleClarificationSubmit}
        />
      </>
    );
  }

  return formEl;
}
