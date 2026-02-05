import React from 'react';
import { Link } from 'react-router-dom';

interface ParsedContentProps {
  content: string;
  className?: string;
}

// Regex patterns for parsing
const HASHTAG_REGEX = /#(\w+)/g;
const MENTION_REGEX = /@(\w+)(?:@[\w.-]+)?/g;
const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;

interface ContentPart {
  type: 'text' | 'hashtag' | 'mention' | 'url';
  value: string;
  raw: string;
}

function parseContentIntoParts(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  let lastIndex = 0;
  
  // Combined regex to find all special elements
  const combinedRegex = /(#(\w+))|(@(\w+)(?:@[\w.-]+)?)|(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  let match;

  while ((match = combinedRegex.exec(content)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        value: content.slice(lastIndex, match.index),
        raw: content.slice(lastIndex, match.index),
      });
    }

    if (match[1]) {
      // Hashtag
      parts.push({
        type: 'hashtag',
        value: match[2], // The tag without #
        raw: match[1],
      });
    } else if (match[3]) {
      // Mention
      parts.push({
        type: 'mention',
        value: match[4], // The username without @
        raw: match[3],
      });
    } else if (match[5]) {
      // URL
      parts.push({
        type: 'url',
        value: match[5],
        raw: match[5],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      value: content.slice(lastIndex),
      raw: content.slice(lastIndex),
    });
  }

  return parts;
}

export function ParsedContent({ content, className }: ParsedContentProps) {
  const parts = parseContentIntoParts(content);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        switch (part.type) {
          case 'hashtag':
            return (
              <Link
                key={index}
                to={`/search?q=${encodeURIComponent('#' + part.value)}`}
                className="text-primary font-semibold hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                #{part.value}
              </Link>
            );
          
          case 'mention':
            return (
              <Link
                key={index}
                to={`/u/${part.value}`}
                className="text-primary hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                @{part.value}
              </Link>
            );
          
          case 'url':
            return (
              <a
                key={index}
                href={part.value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {part.value.replace(/^https?:\/\//, '').slice(0, 30)}
                {part.value.length > 40 ? '…' : ''}
              </a>
            );
          
          default:
            return <span key={index}>{part.value}</span>;
        }
      })}
    </span>
  );
}

// Helper to extract hashtags from content
export function extractHashtags(content: string): string[] {
  const matches = content.match(HASHTAG_REGEX);
  if (!matches) return [];
  return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
}

// Helper to extract mentions from content
export function extractMentions(content: string): string[] {
  const matches = content.match(MENTION_REGEX);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(1)))];
}
