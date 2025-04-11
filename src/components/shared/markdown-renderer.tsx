import { marked } from 'marked';

interface MarkdownRendererProps {
  markdown: string;
  className?: string; // Allow passing additional classes
}

// Basic sanitize function (consider a more robust library like DOMPurify if needed)
const sanitizeHtml = (html: string): string => {
  // Extremely basic example: Remove script tags. 
  // WARNING: This is NOT sufficient for production environments against XSS.
  // Consider using a dedicated library like DOMPurify for proper sanitization.
  // For now, we'll rely on the fact that our Markdown comes from a trusted source (database).
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

export function MarkdownRenderer({ markdown, className }: MarkdownRendererProps) {
  if (typeof markdown !== 'string') {
    console.error('MarkdownRenderer received non-string input:', markdown);
    return <div className="text-red-500">Error: Invalid content</div>;
  }

  // Parse markdown to HTML. Marked does basic sanitization, but review options.
  // See https://marked.js.org/using_advanced#options -> sanitize (deprecated), sanitizer
  // Using async: false for simplicity in React component
  const rawHtml = marked.parse(markdown, { async: false }) as string;

  // Sanitize the HTML output - IMPORTANT for security if markdown source is untrusted
  const sanitizedHtml = sanitizeHtml(rawHtml);

  return (
    <div
      className={`prose dark:prose-invert max-w-none ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
} 