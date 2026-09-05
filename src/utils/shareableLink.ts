import { CanvasPage } from '../types';

/**
 * Encodes the entire whiteboard classroom page deck into a compact URL-safe Base64 string.
 */
export function encodeBoardState(pages: CanvasPage[]): string {
  try {
    const jsonStr = JSON.stringify(pages);
    // Use btoa with encodeURIComponent to support non-ASCII characters and UTF-8 drawings
    const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
    // Make it URL-safe
    return encodeURIComponent(b64);
  } catch (err) {
    console.error('Error encoding board state for sharing:', err);
    return '';
  }
}

/**
 * Decodes a URL-safe Base64 string back into the whiteboard classroom page deck structure.
 */
export function decodeBoardState(encoded: string): CanvasPage[] | null {
  try {
    const decodedB64 = decodeURIComponent(encoded);
    const jsonStr = decodeURIComponent(escape(atob(decodedB64)));
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as CanvasPage[];
    }
    return null;
  } catch (err) {
    console.error('Error decoding board state from share link:', err);
    return null;
  }
}
