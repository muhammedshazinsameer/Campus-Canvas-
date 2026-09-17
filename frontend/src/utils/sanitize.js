import DOMPurify from 'dompurify';

/**
 * Strict allowlist configuration for user-submitted HTML / Rich Text.
 * Disallows scripts, styles, objects, iframes, and dangerous handlers.
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'u', 's',
    'p', 'br', 'span', 'blockquote',
    'pre', 'code',
    'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
  ],
  ALLOWED_ATTR: ['class'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'href', 'src'],
  ALLOW_DATA_ATTR: false
};

/**
 * Sanitizes rich text HTML using DOMPurify with strict allowlist.
 */
export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, SANITIZE_CONFIG);
}

/**
 * Validates and ensures URLs only use safe protocols (http, https, or relative paths).
 * Strictly rejects javascript:, data:, and other injection schemes.
 */
export function safeMediaUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Allow safe relative paths
  if (trimmed.startsWith('/')) {
    // Prevent protocol-relative URL bypasses like //attacker.com
    if (trimmed.startsWith('//')) return null;
    return trimmed;
  }

  // Validate absolute URLs
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
  } catch {
    // If not a valid absolute URL and not starting with safe relative path, reject
    return null;
  }

  return null;
}

/**
 * Escapes characters for safe plain text rendering
 */
export function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
