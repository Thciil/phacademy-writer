'use client';

import { ContentType } from '@/lib/types';

interface ContentTypeSelectorProps {
  value: ContentType;
  onChange: (type: ContentType) => void;
}

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'lesson', label: 'Lesson' },
  { value: 'trick', label: 'Trick' },
  { value: 'combo', label: 'Combo' },
];

export function ContentTypeSelector({ value, onChange }: ContentTypeSelectorProps) {
  return (
    <div className="flex gap-2">
      {CONTENT_TYPES.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => onChange(type.value)}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            value === type.value
              ? 'bg-black text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
