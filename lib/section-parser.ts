import { ContentType } from './types';

export interface ContentSection {
  id: string;
  label: string;
  content: string;
  startLine: number;
}

/**
 * Parse plain text content into sections for display and copying
 * Uses hybrid detection: known headers + standalone paragraphs
 */
export function parseContentSections(
  text: string,
  contentType: ContentType
): ContentSection[] {
  const sections: ContentSection[] = [];
  const lines = text.split('\n');

  // Known section header patterns (case-insensitive)
  const headerPatterns = {
    practiceGoals: /^practice\s+goals:?\s*$/i,
    tipsAndTricks: /^tips?\s*&?\s*tricks?:?\s*$/i,
    keyReminders: /^key\s+reminders:?\s*$/i,
    howItWorks: /^how\s+it\s+works:?\s*$/i,
    level: /^level:\s*(.+)$/i,
    createdBy: /^created\s+by:\s*(.+)$/i,
  };

  let currentSectionStart = 0;
  let currentHeader: string | null = null;
  let sectionId = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if line matches a known header
    let matchedHeader: string | null = null;
    for (const [key, pattern] of Object.entries(headerPatterns)) {
      if (pattern.test(line)) {
        matchedHeader = line;
        break;
      }
    }

    if (matchedHeader) {
      // Save previous section if exists
      if (currentHeader !== null || currentSectionStart < i) {
        const sectionContent = lines
          .slice(currentSectionStart, i)
          .join('\n')
          .trim();

        if (sectionContent) {
          sections.push({
            id: `section-${sectionId++}`,
            label: currentHeader || 'Introduction',
            content: sectionContent,
            startLine: currentSectionStart,
          });
        }
      }

      // Start new section
      currentHeader = matchedHeader;
      currentSectionStart = i + 1; // Skip the header line
    }
  }

  // Add final section
  const finalContent = lines.slice(currentSectionStart).join('\n').trim();
  if (finalContent) {
    sections.push({
      id: `section-${sectionId++}`,
      label: currentHeader || (sections.length === 0 ? 'Content' : 'Additional'),
      content: finalContent,
      startLine: currentSectionStart,
    });
  }

  // If no sections detected, treat entire content as one section
  if (sections.length === 0) {
    sections.push({
      id: 'section-0',
      label: 'Full Content',
      content: text.trim(),
      startLine: 0,
    });
  }

  return sections;
}
