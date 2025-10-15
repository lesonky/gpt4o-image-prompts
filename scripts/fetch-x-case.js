#!/usr/bin/env node

/**
 * CLI helper to fetch prompt cases from an X (Twitter) link.
 *
 * Usage:
 *   node scripts/fetch-x-case.js <x-url>
 *
 * Example:
 *   node scripts/fetch-x-case.js https://x.com/ShreyaYadav___/status/1978324182078517312
 */

const { fetchXCase } = require('./x-utils');

async function main() {
  const [, , rawUrl] = process.argv;
  if (!rawUrl) {
    console.error('Usage: node scripts/fetch-x-case.js <x-url>');
    process.exit(1);
  }

  try {
    const result = await fetchXCase(rawUrl);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Failed to fetch prompt case: ${error.message}`);
    process.exit(1);
  }
}

main();

