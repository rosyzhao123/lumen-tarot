"use client";

import { useEffect, useState } from "react";
import HistoryArchive from "./HistoryArchive";
import { SoundToggle, useRitualSound } from "./ritual-sound";
import { sitePath } from "./site-path";
import { spreadVisualCards } from "./spread-visuals";
import { spreads } from "./tarot-data";

function HomeStars() {
  return <div className="star-field" aria-hidden="true">{Array.from({ length: 46 }, (_, index) => <i key={index} style={{ left: `${(index * 41 + 7) % 98}%`, top: `${(index * 29 + 9) % 91}%`, animationDelay: `${(index % 9) * -.62}s` }} />)}</div>;
}

export default function Home() {
  const [awake, setAwake] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const sound = useRitualSound();

  useEffect(() => {
    const timer = window.setTimeout(() => setAwake(true), 100);
    return () => window.clearTimeout(timer);
  }, []);

  function enterSpread(spreadId: string) {
    if (leaving) return;
    sound.play("transition");
    setLeaving(spreadId);
    window.setTimeout(() => window.location.assign(sitePath(`/reading?spread=${spreadId}`)), 620);
  }

  return (
    <main className={`home-shell ${awake ? "is-awake" : ""} ${leaving ? "is-leaving" : ""}`}>
      <HomeStars />
      <span className="home-ornament home-ornament-left">❦</span>
      <span className="home-ornament home-ornament-right">❦</span>

      <header className="home-topbar">
        <div className="brand"><span className="brand-mark">☾</span><span>LUMEN TAROT</span></div>
        <div className="top-arcana">ARCANA · RITUAL · REFLECTION</div>
        <div className="home-tools">
          <SoundToggle enabled={sound.enabled} onToggle={sound.toggle} />
          <div className="home-edition">THE FOUR SPREADS</div>
          <button className="home-history-button" onClick={() => { sound.play("archive"); setHistoryOpen(true); }} aria-label="打开解读存档"><span>↺</span><small>HISTORY</small></button>
        </div>
      </header>

      <section className="home-intro" aria-labelledby="home-title">
        <div className="home-sigil" aria-hidden="true">
          <span className="sigil-orbit"><i /><i /><i /><i /></span>
          <span className="sigil-card"><b>☾</b><small>LUMEN</small></span>
        </div>
        <div className="home-heading">
          <div className="eyebrow">CHOOSE THE SHAPE OF YOUR QUESTION</div>
          <h1 id="home-title">选择一座牌阵</h1>
          <p>不同的问题，需要不同的观看方式。</p>
        </div>
      </section>

      <section className="spread-gates" aria-label="选择牌阵">
        {spreads.map((spread, spreadIndex) => {
          const cards = spreadVisualCards[spread.id];
          const active = leaving === spread.id;
          const cardSpacing = cards.length <= 3 ? 30 : cards.length === 5 ? 23 : 18;
          return (
            <button
              key={spread.id}
              className={`spread-gate gate-${spread.id} ${active ? "is-entering" : ""}`}
              style={{ "--gate-delay": `${spreadIndex * 120 + 820}ms` } as React.CSSProperties}
              onClick={() => enterSpread(spread.id)}
              aria-label={`进入${spread.name}`}
            >
              <span className="gate-number">{String(spreadIndex + 1).padStart(2, "0")}</span>
              <span className="gate-visual" aria-hidden="true">
                <span className="gate-ring" />
                {cards.map((image, cardIndex) => {
                  const offset = cardIndex - (cards.length - 1) / 2;
                  return <span key={`${image}-${cardIndex}`} className="gate-card" style={{ "--card-x": `${offset * cardSpacing}px`, "--card-y": `${Math.abs(offset) * 5}px`, "--card-rotation": `${offset * 4}deg` } as React.CSSProperties}><img src={image} alt="" draggable={false} /></span>;
                })}
              </span>
              <span className="gate-copy">
                <small>{spread.english}</small>
                <strong>{spread.name}</strong>
                <em>{spread.count} 张 · {spread.category}</em>
                <span>{spread.description}</span>
              </span>
              <span className="gate-enter"><i>进入牌阵</i><b>→</b></span>
            </button>
          );
        })}
      </section>

      <footer className="home-footer"><span>AS ABOVE, SO BELOW</span><span>THE CARDS MIRROR · YOU DECIDE</span></footer>
      <div className="home-transition" aria-hidden="true"><span>☾</span></div>
      <HistoryArchive open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </main>
  );
}
