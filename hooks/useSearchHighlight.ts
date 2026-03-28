/**
 * useSearchHighlight Hook
 *
 * Returns JSX with the matching portion of text highlighted using a <mark> tag.
 * Used to highlight search terms in search results.
 *
 * Requirements: 28.5
 */

import React from 'react';

/**
 * Highlights occurrences of `query` within `text` by wrapping them in <mark>.
 *
 * @param text  - The full text to search within
 * @param query - The search term to highlight (case-insensitive)
 * @returns A React element with highlighted matches, or a plain span if no match
 */
export function useSearchHighlight(text: string, query: string): React.ReactElement {
  if (!query || !text) {
    return React.createElement('span', null, text);
  }

  // Escape special regex characters in the query
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  if (parts.length === 1) {
    // No match found
    return React.createElement('span', null, text);
  }

  const children = parts.map((part, index) => {
    if (regex.test(part)) {
      // Reset lastIndex after test() call
      regex.lastIndex = 0;
      return React.createElement(
        'mark',
        {
          key: index,
          className: 'bg-yellow-200 text-yellow-900 rounded px-0.5',
        },
        part
      );
    }
    regex.lastIndex = 0;
    return part;
  });

  return React.createElement('span', null, ...children);
}
