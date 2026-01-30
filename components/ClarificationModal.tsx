'use client';

import { useState, useEffect } from 'react';
import { ClarifyQuestion } from '@/lib/types';

interface ClarificationModalProps {
  questions: ClarifyQuestion[];
  onSubmit: (answers: Record<string, string>) => void;
  isLoading?: boolean;
}

export function ClarificationModal({ questions, onSubmit, isLoading }: ClarificationModalProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Initialize answers when questions change
  useEffect(() => {
    const initial: Record<string, string> = {};
    questions.forEach((q) => {
      initial[q.id] = '';
    });
    setAnswers(initial);
  }, [questions]);

  const handleChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answers);
  };

  const allRequiredFilled = questions
    .filter((q) => q.required)
    .every((q) => answers[q.id]?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-backdrop">
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">A few quick questions</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {questions.map((question, index) => (
            <div key={`${question.id}-${index}`}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {question.question}
                {question.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {question.type === 'select' && question.options ? (
                <select
                  value={answers[question.id] || ''}
                  onChange={(e) => handleChange(question.id, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required={question.required}
                >
                  <option value="">Select...</option>
                  {question.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : question.type === 'long_text' ? (
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleChange(question.id, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                  rows={3}
                  required={question.required}
                />
              ) : (
                <input
                  type="text"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleChange(question.id, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required={question.required}
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={!allRequiredFilled || isLoading}
            className="w-full py-3 px-4 bg-black text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
