import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export default function MarkdownView({ content, className = '' }: MarkdownViewProps) {
  return (
    <div className={`prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-white mt-3 mb-1.5 pb-1 border-b border-white/10 flex items-center gap-1.5">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-purple-300 mt-2.5 mb-1 flex items-center gap-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-semibold text-zinc-200 mt-2 mb-1">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 text-zinc-200 leading-relaxed">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white bg-white/5 px-1 py-0.5 rounded border border-white/5">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-purple-200">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1 mb-2 pl-4 list-disc marker:text-purple-400">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1 mb-2 pl-4 list-decimal marker:text-purple-400">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-zinc-300 pl-0.5">{children}</li>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 font-mono text-[11px] border border-purple-500/30">
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-zinc-200 overflow-x-auto my-2">
                <code>{children}</code>
              </pre>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-purple-500 pl-3 my-2 text-zinc-400 italic bg-purple-500/5 py-1 rounded-r-lg">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
