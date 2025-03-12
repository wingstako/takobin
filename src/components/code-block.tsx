"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [html, setHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const highlightCode = async () => {
      try {
        setIsLoading(true);
        
        // Use the simpler codeToHtml API
        const highlighted = await codeToHtml(code, {
          lang: language,
          theme: document.documentElement.classList.contains("dark") 
            ? "github-dark" 
            : "github-light",
          // Use default fallback if language isn't supported
          defaultColor: 'inherit'
        });

        setHtml(highlighted);
      } catch (error) {
        console.error("Error highlighting code:", error);
        // Fallback to plain text
        setHtml(`<pre class="shiki" style="background-color: var(--shiki-color-background)"><code>${escapeHtml(code)}</code></pre>`);
      } finally {
        setIsLoading(false);
      }
    };

    highlightCode().catch(console.error);
  }, [code, language]);

  if (isLoading) {
    return (
      <div className="p-4 font-mono text-sm">
        <pre className="whitespace-pre-wrap break-all">{code}</pre>
      </div>
    );
  }

  return (
    <div
      className="shiki-wrapper overflow-auto p-4 text-sm"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Helper function to escape HTML
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
} 