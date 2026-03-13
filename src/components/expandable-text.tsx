"use client";

import { useState } from "react";

interface ExpandableTextProps {
  description: string | null;
  history: string | null;
}

export function ExpandableText({ description, history }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  const hasContent = description || history;
  if (!hasContent) return null;

  return (
    <div className="mb-6 border-b border-border/50 pb-6">
      <div className={expanded ? "" : "line-clamp-3"}>
        {description && (
          <p className="leading-relaxed text-muted-foreground">{description}</p>
        )}
        {history && (
          <p className={`leading-relaxed text-muted-foreground whitespace-pre-line ${description ? "mt-4" : ""}`}>
            {history}
          </p>
        )}
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="font-sans mt-2 text-sm font-medium text-primary transition-colors hover:text-primary/70"
      >
        {expanded ? "Show less" : "Read more"}
      </button>
    </div>
  );
}

export function InlineExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  return (
    <div className="mb-6 border-b border-border/50 pb-4">
      <div className="relative">
        <p className={`text-[15px] leading-relaxed text-foreground ${expanded ? "" : "line-clamp-2"}`}>
          {text}
          {expanded && (
            <>
              {" "}
              <button
                onClick={() => setExpanded(false)}
                className="font-sans inline text-sm font-semibold text-primary transition-colors hover:text-primary/70"
              >
                LESS
              </button>
            </>
          )}
        </p>
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="font-sans absolute bottom-0 right-0 bg-background pl-2 text-sm font-semibold text-primary transition-colors hover:text-primary/70"
          >
            ... MORE
          </button>
        )}
      </div>
    </div>
  );
}
