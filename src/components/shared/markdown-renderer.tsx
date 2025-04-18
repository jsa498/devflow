import { marked } from 'marked';
import 'katex/dist/katex.min.css';

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
      className={`prose dark:prose-invert max-w-none ${className || ''} 
        prose-headings:font-semibold 
        prose-h1:text-3xl prose-h1:mt-6 prose-h1:mb-4
        prose-h2:text-2xl prose-h2:mt-5 prose-h2:mb-3 
        prose-h3:text-xl prose-h3:mt-4 prose-h3:mb-2
        prose-p:my-3 prose-p:leading-relaxed
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-primary-foreground/90 prose-strong:font-semibold
        prose-em:text-primary/80
        prose-ul:my-4 prose-ul:ml-2 prose-li:my-1 prose-li:ml-4
        prose-hr:my-6
        prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm
        prose-pre:bg-muted/50 prose-pre:p-4 prose-pre:rounded-lg
        prose-img:rounded-lg
        prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:my-4 prose-blockquote:bg-muted/30 prose-blockquote:rounded-r-md
      `}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
} 