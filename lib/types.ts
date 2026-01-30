// Content types
export type ContentType = 'lesson' | 'trick' | 'combo';

// Form data structure
export interface FormData {
  contentType: ContentType;
  title: string;
  description: string;
  metadata: {
    courseName?: string;
    lessonNumber?: number;
    level?: 'Beginner' | 'Intermediate' | 'Advanced';
    creator?: string;
  };
  transcript?: string;
}

// Clarification question types
export interface ClarifyQuestion {
  id: string;
  question: string;
  type: 'short_text' | 'long_text' | 'select';
  options?: string[];
  required: boolean;
}

// Clarifier API response
export interface ClarifyResponse {
  needs_clarification: boolean;
  questions?: ClarifyQuestion[];
}

// Generate API request
export interface GenerateRequest extends FormData {
  clarificationAnswers?: Record<string, string>;
}

// Generate API response
export interface GenerateResponse {
  output: string;
}

// Clarify API request
export interface ClarifyRequest extends FormData {
  previousAnswers?: Record<string, string>;
}

// Amend API request
export interface AmendRequest extends GenerateRequest {
  originalOutput: string;
  amendmentInstructions: string;
}
