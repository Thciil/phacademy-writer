/**
 * Parse transcript content from SRT or TXT files
 */
export function parseTranscript(content: string, filename: string): string {
  const isSRT = filename.toLowerCase().endsWith('.srt');

  if (isSRT) {
    return parseSRT(content);
  }

  // TXT files: return as-is, just trim whitespace
  return content.trim();
}

/**
 * Parse SRT subtitle format
 * Strips sequence numbers and timestamps, returns plain text
 */
function parseSRT(content: string): string {
  const lines = content.split('\n');
  const textLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Skip sequence numbers (just digits)
    if (/^\d+$/.test(trimmed)) continue;

    // Skip timestamp lines (00:00:01,000 --> 00:00:04,000)
    if (/^\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,\.]\d{3}$/.test(trimmed)) continue;

    textLines.push(trimmed);
  }

  // Join with spaces, collapse multiple spaces
  return textLines.join(' ').replace(/\s+/g, ' ').trim();
}
