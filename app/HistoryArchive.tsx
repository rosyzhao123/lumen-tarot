"use client";

import { useEffect, useState } from "react";

type ArchiveCard = {
  id: string;
  name: string;
  image: string;
  reversed: boolean;
};

type ArchiveRecord = {
  id: string;
  date: string;
  spread: string;
  question: string;
  cards: ArchiveCard[];
  synthesis: {
    headline: string;
    overview: string;
    dynamic: string;
    caution: string;
    actions: string[];
  };
};

const ARCHIVE_KEY = "lumen-tarot-history";

function readArchives() {
  try {
    const stored = JSON.parse(localStorage.getItem(ARCHIVE_KEY) ?? "[]");
    if (!Array.isArray(stored)) return [];
    const archives = stored
      .filter((record) => record?.date && record?.question && Array.isArray(record?.cards) && record?.synthesis)
      .map((record, index) => ({ ...record, id: record.id ?? `${record.date}-${index}` }))
      .slice(0, 12) as ArchiveRecord[];
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archives));
    return archives;
  } catch {
    return [];
  }
}

function formatArchiveDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function HistoryArchive({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [archives, setArchives] = useState<ArchiveRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const stored = readArchives();
    setArchives(stored);
    setActiveId(stored[0]?.id ?? null);
    document.body.classList.add("ritual-open");
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("ritual-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;
  const active = archives.find((record) => record.id === activeId) ?? archives[0];

  function deleteArchive(id: string) {
    const next = archives.filter((record) => record.id !== id);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(next));
    setArchives(next);
    if (activeId === id) setActiveId(next[0]?.id ?? null);
  }

  function clearArchives() {
    localStorage.removeItem(ARCHIVE_KEY);
    setArchives([]);
    setActiveId(null);
  }

  return (
    <section className="history-overlay" role="dialog" aria-modal="true" aria-label="解读存档">
      <button className="history-scrim" onClick={onClose} aria-label="关闭解读存档" />
      <div className="history-panel">
        <header className="history-header">
          <div><small>PERSONAL ARCHIVE</small><h2>我的解读存档</h2></div>
          <button className="history-close" onClick={onClose} aria-label="关闭解读存档">×</button>
        </header>

        {archives.length ? (
          <div className="history-content">
            <div className="archive-list" role="list" aria-label="历次解读">
              {archives.map((record, index) => (
                <div className={`archive-row ${record.id === active?.id ? "active" : ""}`} role="listitem" key={record.id}>
                  <button className="archive-select" onClick={() => setActiveId(record.id)}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <span><small>{formatArchiveDate(record.date)} · {record.spread}</small><strong>{record.question}</strong></span>
                  </button>
                  <button className="archive-delete" onClick={() => deleteArchive(record.id)} aria-label={`删除“${record.question}”`}>×</button>
                </div>
              ))}
            </div>

            {active && (
              <article className="archive-detail">
                <header><small>{formatArchiveDate(active.date)}</small><h3>“{active.question}”</h3><p>{active.spread}</p></header>
                <div className="archive-cards" aria-label="存档牌面">
                  {active.cards.map((card, index) => (
                    <figure key={`${active.id}-${card.id}-${index}`}>
                      <div className={card.reversed ? "reversed-art" : ""}><img src={card.image} alt={card.name} draggable={false} /></div>
                      <figcaption><b>{String(index + 1).padStart(2, "0")}</b><span>{card.name}<small>{card.reversed ? "逆位" : "正位"}</small></span></figcaption>
                    </figure>
                  ))}
                </div>
                <section className="archive-reading">
                  <small>THE WHOLE READING</small>
                  <h4>{active.synthesis.headline}</h4>
                  <p>{active.synthesis.overview}</p>
                  <p>{active.synthesis.dynamic}</p>
                  <p>{active.synthesis.caution}</p>
                  <ol>{active.synthesis.actions.map((action, index) => <li key={`${index}-${action}`}>{action}</li>)}</ol>
                </section>
              </article>
            )}
          </div>
        ) : (
          <div className="archive-empty"><span>☾</span><h3>存档仍是空的</h3><p>完成一次解读后，点击“存档本次解读”，记录就会出现在这里。</p></div>
        )}

        <footer className="history-footer"><span>{archives.length} / 12 条记录</span>{archives.length > 0 && <button onClick={clearArchives}>清空存档</button>}</footer>
      </div>
    </section>
  );
}
