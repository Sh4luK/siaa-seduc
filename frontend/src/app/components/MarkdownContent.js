"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./MarkdownContent.module.css";

const COLLAPSE_THRESHOLD = 400;

export default function MarkdownContent({ content, collapsible = false }) {
  const [expanded, setExpanded] = useState(false);

  if (!content) return null;
  const canCollapse = collapsible && content.length > COLLAPSE_THRESHOLD;

  return (
    <>
      <div className={`${styles.markdown} ${canCollapse && !expanded ? styles.collapsed : ""}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
      {canCollapse && (
        <button
          type="button"
          className={styles.expandButton}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Ler menos" : "Ler mais"}
        </button>
      )}
    </>
  );
}