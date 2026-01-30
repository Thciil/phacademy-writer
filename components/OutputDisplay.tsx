'use client';

import { useState, useMemo } from 'react';
import { diffWords, Change } from 'diff';
import { parseContentSections, ContentSection } from '@/lib/section-parser';
import { FormData, GenerateResponse } from '@/lib/types';

interface OutputDisplayProps {
  output: string;
  onReset: () => void;
  formData: FormData;
}

export function OutputDisplay({ output, onReset, formData }: OutputDisplayProps) {
  // Copy state
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Amendment state
  const [currentOutput, setCurrentOutput] = useState(output);
  const [originalOutput] = useState(output); // Preserve the original generated output
  const [previousOutput, setPreviousOutput] = useState<string | null>(null);
  const [amendmentInput, setAmendmentInput] = useState('');
  const [isAmending, setIsAmending] = useState(false);
  const [showAmendInput, setShowAmendInput] = useState(false);
  const [viewMode, setViewMode] = useState<'final' | 'comparison' | 'original'>('final');
  const [amendError, setAmendError] = useState<string | null>(null);

  // Parse current output into sections
  const sections = useMemo(
    () => parseContentSections(currentOutput, formData.contentType),
    [currentOutput, formData.contentType]
  );

  // Parse previous output for comparison
  const previousSections = useMemo(
    () => previousOutput ? parseContentSections(previousOutput, formData.contentType) : [],
    [previousOutput, formData.contentType]
  );

  // Parse original output for viewing/reverting
  const originalSections = useMemo(
    () => parseContentSections(originalOutput, formData.contentType),
    [originalOutput, formData.contentType]
  );

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(currentOutput);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopySection = async (section: ContentSection) => {
    // Always include the header when copying individual sections
    const contentToCopy = `${section.label}\n${section.content}`;

    await navigator.clipboard.writeText(contentToCopy);
    setCopiedSection(section.id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleAmendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amendmentInput.trim()) return;

    setIsAmending(true);
    setAmendError(null);

    try {
      const response = await fetch('/api/amend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          originalOutput: currentOutput,
          amendmentInstructions: amendmentInput,
        }),
      });

      const data: GenerateResponse & { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to amend content');
      }

      // Save previous version and update current
      setPreviousOutput(currentOutput);
      setCurrentOutput(data.output);
      setViewMode('comparison');
      setAmendmentInput('');
      setShowAmendInput(false);
    } catch (err) {
      setAmendError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsAmending(false);
    }
  };

  const renderDiffContent = (changes: Change[]) => {
    return changes.map((change, index) => {
      if (change.added) {
        return (
          <span key={index} className="bg-green-200 text-green-900">
            {change.value}
          </span>
        );
      }
      if (change.removed) {
        return (
          <span key={index} className="bg-red-200 text-red-900 line-through">
            {change.value}
          </span>
        );
      }
      return <span key={index}>{change.value}</span>;
    });
  };

  const renderSectionView = (sectionList: ContentSection[], isComparison: boolean, compareWith?: ContentSection[]) => (
    <div className="space-y-3">
      {sectionList.map((section, idx) => {
        const compareSection = compareWith?.[idx];
        const showDiff = isComparison && compareSection;
        const changes = showDiff ? diffWords(compareSection.content, section.content) : [];

        return (
          <div
            key={section.id}
            className={`group relative p-4 rounded-lg transition-colors ${
              isComparison ? 'bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="text-sm leading-relaxed">
              <div className="font-medium text-gray-900 mb-2">{section.label}</div>
              {showDiff ? (
                <div className="whitespace-pre-wrap">{renderDiffContent(changes)}</div>
              ) : (
                <div className="whitespace-pre-wrap">{section.content}</div>
              )}
            </div>
            {!isComparison && (
              <button
                onClick={() => handleCopySection(section)}
                className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded transition-all ${
                  copiedSection === section.id
                    ? 'bg-green-600 text-white opacity-100'
                    : 'bg-white text-gray-700 opacity-0 group-hover:opacity-100 hover:bg-gray-200'
                }`}
              >
                {copiedSection === section.id ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Generated Content</h2>
        <button
          onClick={onReset}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          New Content
        </button>
      </div>

      {/* Toggle between views (if amendment exists) */}
      {previousOutput && (
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setViewMode('final')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'final'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Final
          </button>
          <button
            onClick={() => setViewMode('comparison')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'comparison'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Comparison
          </button>
          <button
            onClick={() => setViewMode('original')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'original'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Original
          </button>
        </div>
      )}

      {/* Content Display */}
      <div className="max-h-[60vh] overflow-y-auto scroll-smooth">
        {viewMode === 'comparison' && previousOutput ? (
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-2 uppercase">
              Changes: <span className="bg-green-200 text-green-900 px-1">Added</span> <span className="bg-red-200 text-red-900 line-through px-1">Removed</span>
            </div>
            {renderSectionView(sections, true, previousSections)}
          </div>
        ) : viewMode === 'original' ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-gray-600 uppercase">Original Version</div>
              {currentOutput !== originalOutput && (
                <button
                  onClick={() => {
                    setPreviousOutput(currentOutput);
                    setCurrentOutput(originalOutput);
                    setViewMode('final');
                  }}
                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Revert to Original
                </button>
              )}
            </div>
            {renderSectionView(originalSections, false)}
          </div>
        ) : (
          renderSectionView(sections, false)
        )}
      </div>

      {/* Amendment Input */}
      {showAmendInput && (
        <form onSubmit={handleAmendSubmit} className="space-y-2 p-4 bg-blue-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700">
            What would you like to change?
          </label>
          <textarea
            value={amendmentInput}
            onChange={(e) => setAmendmentInput(e.target.value)}
            placeholder="E.g., 'make it shorter', 'add more examples about X', 'change the tone to be more casual'"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            rows={3}
            disabled={isAmending}
          />
          {amendError && (
            <div className="text-sm text-red-600">{amendError}</div>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isAmending || !amendmentInput.trim()}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
            >
              {isAmending ? 'Updating...' : 'Update Content'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAmendInput(false);
                setAmendmentInput('');
                setAmendError(null);
              }}
              disabled={isAmending}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCopyAll}
          className={`flex-1 py-3 px-4 font-medium rounded-lg transition-colors ${
            copiedAll
              ? 'bg-green-600 text-white'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {copiedAll ? 'Copied!' : 'Copy All'}
        </button>
        {!showAmendInput && (
          <button
            onClick={() => setShowAmendInput(true)}
            className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Make Changes
          </button>
        )}
      </div>
    </div>
  );
}
