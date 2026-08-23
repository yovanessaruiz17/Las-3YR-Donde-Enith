import type { ChangeEvent } from 'react';

/**
 * Security & Input Sanitization Utilities
 * Prevents Cross-Site Scripting (XSS), Script Injections, HTML Tag Injections,
 * Dangerous URI Schemes (javascript:, data:text/html, etc.), and Malicious Payloads.
 * 
 * Enforces pure plain-text across all forms, search bars, textareas, and API layers.
 */

// Regex patterns to identify and neutralize malicious script patterns
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const HTML_TAGS_REGEX = /<[^>]*>/g;
const JAVASCRIPT_PROTOCOL_REGEX = /(?:javascript|vbscript|livescript|data:text\/html|data:application\/javascript|blob|file):/gi;
const EVENT_HANDLER_REGEX = /\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi;
const DANGEROUS_ATTRIBUTES_REGEX = /\b(href|src|action|formaction|background|poster)\s*=\s*(['"]?)\s*(?:javascript|data|vbscript):/gi;
const MALICIOUS_FUNCS_REGEX = /\b(eval|alert|prompt|confirm|Function|setTimeout|setInterval|document\.cookie|document\.write|window\.location)\s*\(/gi;
const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

/**
 * Sanitizes any raw string into pure, safe plain text.
 * Strips script tags, HTML markup, dangerous event handlers, and protocol injections.
 */
export function sanitizePlainText(
  value: unknown,
  options?: {
    allowNewlines?: boolean;
    maxLength?: number;
    trim?: boolean;
  }
): string {
  if (value === null || value === undefined) return '';

  let str = String(value);

  // Remove null bytes and non-printable control characters
  str = str.replace(CONTROL_CHARS_REGEX, '');

  // Strip full script blocks first (including content inside <script>...</script>)
  str = str.replace(SCRIPT_TAG_REGEX, '');

  // Strip iframe, style, object, embed, svg tags and their content if present
  str = str.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  str = str.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  str = str.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  str = str.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
  str = str.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');

  // Strip all other HTML/XML opening and closing tags
  str = str.replace(HTML_TAGS_REGEX, '');

  // Strip dangerous URL protocols (e.g., javascript:, data:text/html)
  str = str.replace(JAVASCRIPT_PROTOCOL_REGEX, '');

  // Strip inline event handler patterns (e.g. onload=, onerror=, onclick=)
  str = str.replace(EVENT_HANDLER_REGEX, '');
  str = str.replace(DANGEROUS_ATTRIBUTES_REGEX, '');

  // Strip direct JS function execution patterns
  str = str.replace(MALICIOUS_FUNCS_REGEX, '');

  // Handle newlines
  if (!options?.allowNewlines) {
    str = str.replace(/[\r\n\t]+/g, ' ');
  }

  if (options?.trim !== false) {
    str = str.trim();
  }

  if (options?.maxLength && options.maxLength > 0) {
    str = str.slice(0, options.maxLength);
  }

  return str;
}

/**
 * Sanitizes search input terms, allowing only text, numbers, spaces, and safe punctuation.
 */
export function sanitizeSearchQuery(query: unknown, maxLength = 100): string {
  if (!query) return '';
  const text = sanitizePlainText(query, { allowNewlines: false, maxLength });
  // Remove angle brackets, quotes, braces, and backticks that could break templates
  return text.replace(/[<>{}`[\]\\^]/g, '').trim();
}

/**
 * Sanitizes an email address, removing any dangerous characters or script attempts.
 */
export function sanitizeEmail(email: unknown): string {
  if (!email) return '';
  const text = sanitizePlainText(email, { allowNewlines: false, maxLength: 254 });
  // Remove any whitespace, angle brackets, quotes, and dangerous characters
  return text.replace(/[\s<>"'(){}[\]\\/,:;]/g, '').toLowerCase().trim();
}

/**
 * Sanitizes phone numbers, allowing only digits, +, -, (, ), and spaces.
 */
export function sanitizePhone(phone: unknown): string {
  if (!phone) return '';
  const str = String(phone);
  // Keep only +, numbers, space, and hyphens/parentheses
  return str.replace(/[^0-9+\s\-()]/g, '').trim().slice(0, 25);
}

/**
 * Sanitizes and validates a URL to ensure it is safe (https://, http://, or relative /path).
 * Blocks javascript:, data:, vbscript:, etc.
 */
export function sanitizeUrl(url: unknown, defaultFallback = ''): string {
  if (!url) return defaultFallback;
  const str = String(url).trim();

  // Block dangerous protocols explicitly
  if (JAVASCRIPT_PROTOCOL_REGEX.test(str) || str.toLowerCase().startsWith('vbscript:')) {
    return defaultFallback;
  }

  // Must start with http://, https://, /, or #
  if (
    str.startsWith('http://') ||
    str.startsWith('https://') ||
    str.startsWith('/') ||
    str.startsWith('#') ||
    str.startsWith('mailto:') ||
    str.startsWith('tel:')
  ) {
    // Clean out dangerous characters from the URL string
    return str.replace(/[<>"'\s`]/g, '');
  }

  // If it's a domain without protocol, e.g. "images.unsplash.com/..."
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\//.test(str)) {
    return `https://${str.replace(/[<>"'\s`]/g, '')}`;
  }

  return defaultFallback;
}

/**
 * Sanitizes numbers, converting strings or unknown types safely into numbers.
 */
export function sanitizeNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? fallback : num;
}

/**
 * Recursively cleans and sanitizes all string properties within an object or array.
 */
export function sanitizeObject<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    return sanitizePlainText(data) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeObject(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      const cleanKey = sanitizePlainText(key, { allowNewlines: false });
      if (typeof val === 'string') {
        // Apply specialized sanitizers based on key names
        const lowerKey = cleanKey.toLowerCase();
        if (lowerKey.includes('email')) {
          cleaned[cleanKey] = sanitizeEmail(val);
        } else if (lowerKey.includes('phone') || lowerKey.includes('whatsapp')) {
          cleaned[cleanKey] = sanitizePhone(val);
        } else if (lowerKey.includes('url') || lowerKey.includes('image') || lowerKey.includes('logo')) {
          cleaned[cleanKey] = sanitizeUrl(val);
        } else if (lowerKey.includes('description') || lowerKey.includes('notes') || lowerKey.includes('message')) {
          cleaned[cleanKey] = sanitizePlainText(val, { allowNewlines: true, maxLength: 5000 });
        } else {
          cleaned[cleanKey] = sanitizePlainText(val);
        }
      } else if (typeof val === 'number') {
        cleaned[cleanKey] = sanitizeNumber(val);
      } else if (typeof val === 'boolean') {
        cleaned[cleanKey] = Boolean(val);
      } else if (typeof val === 'object' && val !== null) {
        cleaned[cleanKey] = sanitizeObject(val);
      } else {
        cleaned[cleanKey] = val;
      }
    }
    return cleaned as T;
  }

  return data;
}

/**
 * Event handler helper to clean an input field on change in real-time.
 */
export function sanitizeEventInput(
  e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  type: 'text' | 'search' | 'email' | 'phone' | 'number' | 'url' | 'multiline' = 'text'
): string {
  const rawValue = e.target.value;
  switch (type) {
    case 'search':
      return sanitizeSearchQuery(rawValue);
    case 'email':
      return sanitizeEmail(rawValue);
    case 'phone':
      return sanitizePhone(rawValue);
    case 'url':
      return sanitizeUrl(rawValue);
    case 'multiline':
      return sanitizePlainText(rawValue, { allowNewlines: true });
    case 'number':
      return rawValue.replace(/[^0-9.-]/g, '');
    case 'text':
    default:
      return sanitizePlainText(rawValue, { allowNewlines: false });
  }
}
