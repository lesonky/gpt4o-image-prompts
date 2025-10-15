#!/usr/bin/env node

/**
 * Utility helpers for importing prompt cases from X (formerly Twitter).
 * The module fetches a post through the r.jina.ai cache endpoint to avoid
 * authentication and returns a structured object with prompt text and media.
 */

const { URL } = require('url');

/**
 * Retrieve a fetch implementation (Node 18+ ships global fetch).
 */
async function getFetch() {
  if (typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis);
  }
  try {
    const { default: fetch } = await import('node-fetch');
    return fetch;
  } catch (error) {
    throw new Error('Global fetch is not available. Please use Node.js 18+ or install node-fetch.');
  }
}

/**
 * Normalise X/Twitter URL into a canonical host/path string.
 */
function normaliseXUrl(rawUrl) {
  if (!rawUrl) {
    throw new Error('No URL provided.');
  }
  let trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  const parsed = new URL(trimmed);
  if (!/^(x\.com|twitter\.com)$/i.test(parsed.hostname)) {
    throw new Error(`Unsupported host: ${parsed.hostname}`);
  }
  parsed.protocol = 'https:';
  parsed.hostname = 'x.com';
  parsed.hash = '';
  return parsed.href.replace(/^https:\/\//, '');
}

/**
 * Fetch the cached markdown representation of an X post via r.jina.ai.
 */
async function fetchXMarkdown(rawUrl) {
  const fetch = await getFetch();
  const normalised = normaliseXUrl(rawUrl);
  const endpoint = `https://r.jina.ai/https://${normalised}`;
  const response = await fetch(endpoint, {
    headers: {
      'user-agent': 'prompt-gallery-fetch/1.0 (+https://github.com/)',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch X content: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

/**
 * Extract basic author info from the markdown payload.
 */
function extractAuthor(markdown) {
  const authorMatch = markdown.match(/\[([^\]]+)\]\((https:\/\/x\.com\/[^\)]+)\)\s*\n\n\[@([^\]]+)\]\(https:\/\/x\.com\/[^\)]+\)/);
  if (!authorMatch) {
    return null;
  }
  return {
    name: authorMatch[1].trim(),
    profileUrl: authorMatch[2].trim(),
    handle: authorMatch[3].trim(),
  };
}

/**
 * Extract the raw tweet text and derive a probable prompt string.
 */
function extractPrompt(markdown) {
  const rawLines = markdown.split('\n');
  const lines = rawLines.map((line) => line.trim());
  const conversationMarker = lines.findIndex((line) => /^conversation$/i.test(line));
  const startIndex = conversationMarker >= 0 ? conversationMarker + 1 : 0;

  const tweetIndex = lines.findIndex((line, idx) => {
    if (!line) return false;
    if (idx < startIndex) return false;
    if (line.startsWith('![') || line.startsWith('[') || line.startsWith('Title:')) return false;
    if (line.startsWith('URL Source:') || line.startsWith('Markdown Content:')) return false;
    if (/^=+$/.test(line) || /^-+$/.test(line)) return false;
    if (line.startsWith('Post')) return false;
    if (/^See new posts/i.test(line)) return false;
    if (/^\d+[\d\s]*[·]/.test(line)) return false;
    return true;
  });
  if (tweetIndex < 0) {
    return { tweetText: '', promptText: '' };
  }

  const collected = [];
  for (let i = tweetIndex; i < lines.length; i += 1) {
    const rawLine = rawLines[i];
    const trimmed = lines[i];
    if (!trimmed) break;
    if (trimmed.startsWith('[![') || trimmed.startsWith('[4:')) break;
    if (trimmed.startsWith('New to X?')) break;
    if (/^\[\d/.test(trimmed) && trimmed.includes('·')) break;
    collected.push(rawLine.trim());
  }

  const tweetText = collected.join(' ').replace(/\s+/g, ' ').trim();
  const sanitizedText = tweetText
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/https:\/\/t\.co\/\S+/gi, '')
    .replace(/" ?\/ ?X$/i, '')
    .replace(/\/ ?X$/i, '')
    .trim()
    .replace(/\s+/g, ' ');

  if (!sanitizedText) {
    return { tweetText: '', promptText: '' };
  }

  const lower = sanitizedText.toLowerCase();
  const keyword = lower.indexOf('prompt');
  const promptText =
    keyword >= 0 ? sanitizedText.slice(keyword).replace(/^prompt[^a-z0-9]*/i, '').trim() : sanitizedText;

  return {
    tweetText: sanitizedText,
    promptText,
  };
}

/**
 * Extract all media URLs from the markdown payload.
 */
function extractMedia(markdown) {
  const matches = Array.from(markdown.matchAll(/https:\/\/pbs\.twimg\.com\/media\/[^\s)"]+/g)).map((match) => match[0]);
  const unique = Array.from(new Set(matches));
  return unique.map((url) => {
    const clean = url.replace(/(\?|&)name=\w+/i, '').replace(/(\?|&)format=\w+/i, '');
    const hasQuery = clean.includes('?');
    const suffix = hasQuery ? '&name=4096x4096' : '?name=4096x4096';
    return `${clean}${suffix}`;
  });
}

/**
 * Extract timestamp text (if available).
 */
function extractTimestamp(markdown) {
  const match = markdown.match(/\[(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*·\s*[^\]]+)\]\(https:\/\/x\.com\/[^\)]+\)/i);
  return match ? match[1].trim() : null;
}

/**
 * Fetch and parse an X post into a structured prompt case object.
 */
async function fetchXCase(rawUrl) {
  const markdown = await fetchXMarkdown(rawUrl);
  const author = extractAuthor(markdown);
  const { tweetText, promptText } = extractPrompt(markdown);
  const images = extractMedia(markdown);
  const timestamp = extractTimestamp(markdown);

  return {
    sourceUrl: `https://${normaliseXUrl(rawUrl)}`,
    fetchedAt: new Date().toISOString(),
    author,
    tweetText,
    promptText,
    images,
    timestamp,
    rawMarkdown: markdown,
  };
}

module.exports = {
  fetchXCase,
  fetchXMarkdown,
  normaliseXUrl,
  extractPrompt,
  extractMedia,
  extractAuthor,
  extractTimestamp,
};
