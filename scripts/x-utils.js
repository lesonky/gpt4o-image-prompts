#!/usr/bin/env node

/**
 * Minimal helper utilities for grabbing raw X (Twitter) post content.
 * The goal is to capture enough context (text + media URLs) so that an
 * upstream AI agent can perform richer parsing or summarisation.
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

function extractPostText(markdown) {
  if (!markdown) return '';
  const rawLines = markdown.split('\n');
  const trimmedLines = rawLines.map((line) => line.trimEnd());

  let start = trimmedLines.findIndex((line) => /^conversation$/i.test(line.trim()));
  if (start === -1) {
    start = trimmedLines.findIndex((line) => /^post$/i.test(line.trim()));
    if (start !== -1) start += 2;
  } else {
    start += 2; // skip underline row
  }

  if (start < 0) start = 0;

  const collected = [];
  for (let i = start; i < trimmedLines.length; i += 1) {
    const line = trimmedLines[i];
    const normalized = line.trim();
    if (!normalized && collected.length > 0) break;
    if (/^quote$/i.test(normalized)) break;
    if (/^\[!\[/.test(normalized)) continue;
    if (/^\d+\.\d+k?\s*views?/i.test(normalized)) continue;
    collected.push(line);
  }

  const merged = collected.join('\n').trim();
  if (!merged) return '';

  return merged
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[(.*?)\]\((https?:\/\/[^\)]+)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMedia(markdown) {
  if (!markdown) return [];
  const matches = Array.from(markdown.matchAll(/https:\/\/pbs\.twimg\.com\/media\/[^\s)"]+/g)).map((match) => match[0]);
  const unique = Array.from(new Set(matches));
  return unique.map((raw) => {
    try {
      const url = new URL(raw);
      if (url.searchParams.has('name')) {
        url.searchParams.set('name', '4096x4096');
      } else {
        url.searchParams.append('name', '4096x4096');
      }
      return url.toString();
    } catch (error) {
      return raw;
    }
  });
}

async function fetchXCase(rawUrl) {
  const markdown = await fetchXMarkdown(rawUrl);
  const images = extractMedia(markdown);
  const text = extractPostText(markdown);

  return {
    sourceUrl: `https://${normaliseXUrl(rawUrl)}`,
    fetchedAt: new Date().toISOString(),
    text,
    images,
    rawMarkdown: markdown,
  };
}

module.exports = {
  fetchXCase,
  fetchXMarkdown,
  normaliseXUrl,
  extractPostText,
  extractMedia,
};
