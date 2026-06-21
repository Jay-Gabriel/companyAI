import { Fragment } from 'react';

interface MarkdownRendererProps {
  content: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseInlineCode(text: string): (string | { type: 'code'; content: string })[] {
  const parts: (string | { type: 'code'; content: string })[] = [];
  let lastIndex = 0;
  const regex = /`([^`]+)`/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push({ type: 'code', content: match[1] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
}

function parseInlineFormatting(text: string): (string | { type: 'code'; content: string } | { type: 'bold' | 'italic' | 'strikethrough'; content: string })[] {
  const segments: (string | { type: 'code'; content: string } | { type: 'bold' | 'italic' | 'strikethrough'; content: string })[] = [];

  // Split by inline code first, then parse formatting in text segments
  const codeSplit = text.split(/(`[^`]+`)/g);
  for (const segment of codeSplit) {
    if (segment.startsWith('`') && segment.endsWith('`')) {
      segments.push({ type: 'code', content: segment.slice(1, -1) });
    } else if (segment) {
      // Bold, italic, strikethrough
      const formattingRegex = /(\*\*\*(.*?)\*\*\*|\*\*(.*?)\*\*|__(.*?)__|\*(.*?)\*|_(.*?)_|~~(.*?)~~)/g;
      let lastIdx = 0;
      let fm: RegExpExecArray | null;
      while ((fm = formattingRegex.exec(segment)) !== null) {
        if (fm.index > lastIdx) {
          segments.push(segment.slice(lastIdx, fm.index));
        }
        if (fm[2]) {
          segments.push({ type: 'bold', content: fm[2] });
        } else if (fm[3]) {
          segments.push({ type: 'bold', content: fm[3] });
        } else if (fm[4]) {
          segments.push({ type: 'bold', content: fm[4] });
        } else if (fm[5]) {
          segments.push({ type: 'italic', content: fm[5] });
        } else if (fm[6]) {
          segments.push({ type: 'italic', content: fm[6] });
        } else if (fm[7]) {
          segments.push({ type: 'strikethrough', content: fm[7] });
        }
        lastIdx = formattingRegex.lastIndex;
      }
      if (lastIdx < segment.length) {
        segments.push(segment.slice(lastIdx));
      }
    }
  }

  return segments;
}

// Convert single newlines within a paragraph to <br/>, double newlines are paragraph breaks
function processParagraphLines(line: string, idx: number): React.ReactNode {
  const segments = parseInlineFormatting(line);
  const children = segments.map((seg, i) => {
    if (typeof seg === 'string') {
      const escaped = escapeHtml(seg);
      return <Fragment key={i}>{escaped}</Fragment>;
    }
    switch (seg.type) {
      case 'code':
        return (
          <code key={i} className="px-1 py-0.5 bg-gray-700 text-emerald-300 rounded text-xs font-mono">
            {escapeHtml(seg.content)}
          </code>
        );
      case 'bold':
        return <strong key={i} className="font-semibold text-gray-100">{parseInlineCodeToNode(seg.content, i)}</strong>;
      case 'italic':
        return <em key={i} className="italic text-gray-100">{parseInlineCodeToNode(seg.content, i)}</em>;
      case 'strikethrough':
        return <del key={i} className="text-gray-500">{parseInlineCodeToNode(seg.content, i)}</del>;
    }
  });

  return <Fragment key={idx}>{children}</Fragment>;
}

function parseInlineCodeToNode(text: string, keyBase: number): React.ReactNode {
  const parts = parseInlineCode(text);
  return parts.map((part, i) => {
    if (typeof part === 'string') {
      return <Fragment key={`${keyBase}-${i}`}>{escapeHtml(part)}</Fragment>;
    }
    return (
      <code key={`${keyBase}-${i}`} className="px-1 py-0.5 bg-gray-700 text-emerald-300 rounded text-xs font-mono">
        {escapeHtml(part.content)}
      </code>
    );
  });
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];
  let codeBlockKey = 0;

  const flushCodeBlock = () => {
    if (codeBlockLines.length > 0) {
      elements.push(
        <pre key={`cb-${codeBlockKey}`} className="bg-gray-850 border border-gray-700 rounded-lg overflow-x-auto my-2">
          {codeBlockLang && (
            <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-700 font-mono">
              {codeBlockLang}
            </div>
          )}
          <code className="block p-3 text-sm font-mono leading-relaxed text-gray-200">
            {codeBlockLines.join('\n')}
          </code>
        </pre>
      );
      codeBlockKey++;
    }
    codeBlockLines = [];
    codeBlockLang = '';
  };

  // Track if we're in a list for proper indentation
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block fences
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushCodeBlock();
        inCodeBlock = true;
        codeBlockLang = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Empty line = paragraph break
    if (trimmed === '') {
      if (inList) inList = false;
      continue;
    }

    // Headers
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = headerMatch[2];
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      elements.push(
        <Tag key={i} className={`text-${level === 1 ? 'lg' : level === 2 ? 'base' : 'sm'} font-bold text-gray-100 mt-3 mb-1`}>
          {parseInlineCodeToNode(text, i)}
        </Tag>
      );
      continue;
    }

    // Unordered list
    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      inList = true;
      elements.push(
        <li key={i} className="text-sm text-gray-200 ml-4 list-disc">
          {processParagraphLines(ulMatch[1], i)}
        </li>
      );
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      inList = true;
      elements.push(
        <li key={i} className="text-sm text-gray-200 ml-4 list-decimal">
          {processParagraphLines(olMatch[1], i)}
        </li>
      );
      continue;
    }

    // Blockquote
    const bqMatch = trimmed.match(/^>\s+(.+)$/);
    if (bqMatch) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-gray-600 pl-3 my-1 text-sm text-gray-400 italic">
          {processParagraphLines(bqMatch[1], i)}
        </blockquote>
      );
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      elements.push(<hr key={i} className="border-gray-700 my-2" />);
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm text-gray-200 leading-relaxed">
        {processParagraphLines(line, i)}
      </p>
    );
  }

  // Flush any remaining code block
  if (inCodeBlock) {
    flushCodeBlock();
  }

  return <div className="space-y-1">{elements}</div>;
}
