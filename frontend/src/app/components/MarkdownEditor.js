"use client";

import { useState } from "react";
import MarkdownContent from "./MarkdownContent";
import styles from "./MarkdownEditor.module.css";

export default function MarkdownEditor({ value, onChange, placeholder, rows = 12, id }) {
  const [aba, setAba] = useState("escrever");

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={aba === "escrever" ? styles.tabAtiva : styles.tab}
          onClick={() => setAba("escrever")}
        >
          Escrever
        </button>
        <button
          type="button"
          className={aba === "previa" ? styles.tabAtiva : styles.tab}
          onClick={() => setAba("previa")}
        >
          Pré-visualizar
        </button>
        <span className={styles.ajudaMarkdown}>
          Suporta **negrito**, _itálico_, listas, `código`, [links](url)
        </span>
      </div>

      {aba === "escrever" ? (
        <textarea
          id={id}
          className={styles.textarea}
          placeholder={placeholder}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div className={styles.previewBox} style={{ minHeight: `${rows * 1.6}rem` }}>
          {value.trim() ? (
            <MarkdownContent content={value} />
          ) : (
            <p className={styles.previewVazio}>Nada para pré-visualizar ainda.</p>
          )}
        </div>
      )}
    </div>
  );
}