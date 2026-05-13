"use client";

// CC-REACT-ON-SCREEN-LLM-RENDER — minimal markdown renderer for the
// LLM rewrite output. The LLM produces a tightly-scoped subset of
// markdown: section headers (## / ###), bold field labels (**Strength**
// — …), italic openers/closings, blockquotes, and standard paragraphs.
// No code blocks, no lists, no images. This component parses just that
// subset and renders to themed React elements — no new dependencies.
//
// Used by the on-screen body-card replacements + Keystone block when
// the `/api/report-cards` fetch returns a per-section LLM rewrite.
// Falls back to engine prose when no rewrite is provided.

import { type ReactNode } from "react";

interface Props {
  /** Full markdown text for one section (e.g. one Lens card rewrite). */
  markdown: string;
  /** Optional className for outer wrapper styling. */
  className?: string;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // Handle **bold** and *italic* spans inside a paragraph. Markdown's
  // ambiguity is real but the LLM rewrites stay disciplined: pairs of
  // ** for bold and pairs of * for italic.
  const out: ReactNode[] = [];
  let i = 0;
  let buffer = "";
  let token = 0;
  while (i < text.length) {
    if (text.startsWith("**", i)) {
      const end = text.indexOf("**", i + 2);
      if (end > i + 2) {
        if (buffer.length > 0) {
          out.push(buffer);
          buffer = "";
        }
        out.push(
          <strong key={`${keyPrefix}-b-${token++}`}>
            {text.slice(i + 2, end)}
          </strong>
        );
        i = end + 2;
        continue;
      }
    }
    if (text[i] === "*") {
      const end = text.indexOf("*", i + 1);
      if (end > i + 1) {
        if (buffer.length > 0) {
          out.push(buffer);
          buffer = "";
        }
        out.push(
          <em key={`${keyPrefix}-i-${token++}`} style={{ fontStyle: "italic" }}>
            {text.slice(i + 1, end)}
          </em>
        );
        i = end + 1;
        continue;
      }
    }
    buffer += text[i];
    i++;
  }
  if (buffer.length > 0) out.push(buffer);
  return out;
}

export default function LlmProseBlock({ markdown, className }: Props) {
  // Split into block-level segments. The LLM rewrites use blank lines
  // (\n\n) to separate paragraphs; nested newlines inside a paragraph
  // are unusual but harmless to flatten.
  const blocks = markdown
    .split(/\n{2,}/)
    .map((b) => b.replace(/^\s+|\s+$/g, ""))
    .filter((b) => b.length > 0);

  const out: ReactNode[] = [];
  let key = 0;
  for (const block of blocks) {
    // Section heading: ### Header — Subhead  (or ## Path — Gait)
    const headerMatch = block.match(/^(#{2,3})\s+(.+)$/);
    if (headerMatch) {
      const depth = headerMatch[1].length;
      const text = headerMatch[2];
      const Tag = depth === 2 ? "h2" : "h3";
      out.push(
        <Tag
          key={`hdr-${key++}`}
          style={{
            fontSize: depth === 2 ? 18 : 17,
            fontWeight: 600,
            margin: "12px 0 6px",
            color: "var(--ink, #2b2417)",
            lineHeight: 1.3,
          }}
        >
          {text}
        </Tag>
      );
      continue;
    }
    // Standalone blockquote — every line begins with `> `.
    if (block.split("\n").every((l) => /^>\s?/.test(l))) {
      const inner = block
        .split("\n")
        .map((l) => l.replace(/^>\s?/, ""))
        .join(" ")
        .trim();
      out.push(
        <blockquote
          key={`bq-${key++}`}
          className="font-serif italic"
          style={{
            fontSize: 15.5,
            color: "var(--ink-soft, #555)",
            lineHeight: 1.6,
            margin: "12px 0",
            paddingLeft: 14,
            borderLeft: "2px solid var(--umber, #b48a4e)",
          }}
        >
          {inner}
        </blockquote>
      );
      continue;
    }
    // Paragraph that's italicized in its entirety: *whole line*
    if (/^\*[^*\n]+\*$/.test(block)) {
      const inner = block.slice(1, -1);
      out.push(
        <p
          key={`it-${key++}`}
          className="font-serif italic"
          style={{
            fontSize: 14.5,
            color: "var(--ink-soft, #555)",
            lineHeight: 1.6,
            margin: "10px 0",
          }}
        >
          {inner}
        </p>
      );
      continue;
    }
    // Default: paragraph with inline ** / * spans.
    out.push(
      <p
        key={`p-${key++}`}
        className="font-serif"
        style={{
          fontSize: 15,
          color: "var(--ink, #2b2417)",
          lineHeight: 1.6,
          margin: "10px 0",
        }}
      >
        {renderInline(block, `p${key}`)}
      </p>
    );
  }

  return <div className={className}>{out}</div>;
}
