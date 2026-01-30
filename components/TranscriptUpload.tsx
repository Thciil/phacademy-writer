'use client';

import { useRef } from 'react';
import { parseTranscript } from '@/lib/transcript-parser';

interface TranscriptUploadProps {
  filename: string | null;
  onUpload: (content: string, filename: string) => void;
  onClear: () => void;
}

export function TranscriptUpload({ filename, onUpload, onClear }: TranscriptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    const parsed = parseTranscript(content, file.name);
    onUpload(parsed, file.name);

    // Reset input so same file can be re-uploaded
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".srt,.txt"
        onChange={handleFileChange}
        className="hidden"
        id="transcript-upload"
      />

      {filename ? (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600 truncate">{filename}</span>
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Remove
          </button>
        </div>
      ) : (
        <label
          htmlFor="transcript-upload"
          className="block w-full p-4 text-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
        >
          <span className="text-gray-600">Upload transcript (.srt or .txt)</span>
        </label>
      )}
    </div>
  );
}
