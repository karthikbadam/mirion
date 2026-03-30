import type { CSSProperties } from "react";

interface CodeProps {
  children: string;
  language?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Minimal code block. Renders <pre><code> with a language class
 * for external syntax highlighters (Prism, Shiki, highlight.js).
 */
export function Code({
  children,
  language,
  className = "",
  style,
}: CodeProps) {
  return (
    <pre
      className={`mirion-code ${className}`}
      style={{
        margin: 0,
        padding: "1.5em",
        borderRadius: "0.5em",
        overflow: "auto",
        fontSize: "0.85em",
        lineHeight: 1.6,
        ...style,
      }}
    >
      <code className={language ? `language-${language}` : undefined}>
        {children}
      </code>
    </pre>
  );
}
