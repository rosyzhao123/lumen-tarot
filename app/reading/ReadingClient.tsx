"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SoundToggle, useRitualSound } from "../ritual-sound";
import { spreadVisualCards } from "../spread-visuals";
import { defaultQuestion, spreads, tarotDeck, type Spread, type TarotCard } from "../tarot-data";

type DrawnCard = TarotCard & { reversed: boolean; revealed: boolean };
type RitualStep = "idle" | "meditating" | "shuffling" | "choosing" | "placing" | "reading";

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function StarField() {
  return <div className="star-field" aria-hidden="true">{Array.from({ length: 38 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 11) % 97}%`, top: `${(i * 53 + 7) % 94}%`, animationDelay: `${(i % 8) * -.7}s` }} />)}</div>;
}

function CardArtwork({ card }: { card: TarotCard }) {
  return <img src={card.image} alt={card.name} draggable={false} />;
}

function SpreadCard({ card, index, spread, selected, onReveal }: { card: DrawnCard; index: number; spread: Spread; selected: boolean; onReveal: () => void }) {
  const position = spread.positions[index];
  return (
    <article className={`spread-card ${position.y <= 25 ? "top-anchored" : ""} ${card.revealed ? "revealed" : ""} ${selected ? "is-selected" : ""}`} style={{ "--x": `${position.x}%`, "--y": `${position.y}%`, "--delay": `${index * 90}ms` } as React.CSSProperties}>
      <button className="flip-card" onClick={onReveal} aria-label={card.revealed ? `${position.name}：${card.name}，${card.reversed ? "逆位" : "正位"}` : `翻开${position.name}`} data-testid={`card-${index}`}>
        <span className="flip-inner">
          <span className="card-back"><span className="back-sigil">☾</span></span>
          <span className="card-front">
            <span className={card.reversed ? "artwork reversed-art" : "artwork"}><CardArtwork card={card} /></span>
            <span className="reveal-wash" />
          </span>
        </span>
      </button>
      <button className="position-label" onClick={onReveal}><b>{String(index + 1).padStart(2, "0")}</b><span>{position.name}</span></button>
    </article>
  );
}

function RitualOverlay({
  step,
  spread,
  question,
  deck,
  drawn,
  pickedIds,
  onShuffle,
  onPick,
  onClose,
}: {
  step: RitualStep;
  spread: Spread;
  question: string;
  deck: DrawnCard[];
  drawn: DrawnCard[];
  pickedIds: string[];
  onShuffle: () => void;
  onPick: (card: DrawnCard) => void;
  onClose: () => void;
}) {
  if (step === "idle" || step === "reading") return null;
  const nextPosition = spread.positions[pickedIds.length];

  if (step === "choosing") {
    return (
      <section className="ritual-overlay choosing-view" role="dialog" aria-modal="true" aria-label="选择塔罗牌">
        <StarField />
        <header className="selection-header">
          <div className="selection-brand"><span>☾</span><b>LUMEN TAROT</b></div>
          <div className="selection-intention"><small>YOUR INTENTION</small><p>“{question}”</p></div>
          <div className="selection-progress"><b>{pickedIds.length}</b><span>/ {spread.count}</span><small>{nextPosition ? `下一张 · ${nextPosition.name}` : "选择完成"}</small></div>
          <button className="ritual-close" onClick={onClose} aria-label="退出选牌">×</button>
        </header>
        <div className="selection-arc-scroll">
          <div className="selection-arc" aria-label={`78 张牌背，已选择 ${pickedIds.length} 张`}>
            {deck.map((card, index) => {
              const pickedIndex = pickedIds.indexOf(card.id);
              const picked = pickedIndex >= 0;
              const cardsPerRow = Math.ceil(deck.length / 2);
              const row = Math.floor(index / cardsPerRow);
              const rowIndex = index % cardsPerRow;
              const progress = rowIndex / Math.max(cardsPerRow - 1, 1);
              const centered = progress * 2 - 1;
              return (
                <button
                  key={card.id}
                  className={`selection-card ${picked ? "picked" : ""}`}
                  style={{
                    "--card-index": index,
                    "--arc-x": `${6 + progress * 88}%`,
                    "--arc-top": row === 0 ? "30%" : "63%",
                    "--arc-y": `${centered * centered * 44 - 26}px`,
                    "--arc-r": `${centered * 6}deg`,
                    "--deal-order": Math.abs(rowIndex - (cardsPerRow - 1) / 2) + row * 0.75,
                  } as React.CSSProperties}
                  onClick={() => onPick(card)}
                  disabled={picked}
                  aria-label={picked ? `第 ${pickedIndex + 1} 张已选择` : `选择第 ${index + 1} 张牌背`}
                >
                  <span className="selection-card-back"><i>☾</i></span>
                  {picked && <b>{String(pickedIndex + 1).padStart(2, "0")}</b>}
                </button>
              );
            })}
          </div>
        </div>
        <footer className="selection-footer"><span>{spread.name}</span><b>{nextPosition ? nextPosition.prompt : "牌已选齐，准备进入牌阵"}</b></footer>
      </section>
    );
  }

  if (step === "placing") {
    return (
      <section className="ritual-overlay placing-view" role="status" aria-live="polite">
        <StarField />
        <div className="placing-cards" aria-hidden="true">
          {drawn.map((card, index) => <span key={card.id} style={{ "--place-index": index, "--place-count": drawn.length } as React.CSSProperties}><i>☾</i></span>)}
        </div>
        <div className="placing-copy"><small>THE SPREAD RECEIVES YOUR CHOICE</small><h2>牌正在进入阵位</h2><p>{spread.positions.map((position) => position.name).join(" · ")}</p></div>
      </section>
    );
  }

  const shuffling = step === "shuffling";
  return (
    <section className={`ritual-overlay meditation-view ${shuffling ? "shuffle-active" : ""}`} role="dialog" aria-modal="true" aria-label="沉思与洗牌">
      <StarField />
      <div className="meditation-copy">
        <small>{shuffling ? "THE DECK IS LISTENING" : "RETURN TO YOUR QUESTION"}</small>
        <h2>{shuffling ? "让牌回应你的意念" : "闭上眼睛，默念你的问题"}</h2>
        <p>“{question}”</p>
      </div>
      <div className="breath-field" aria-hidden="true"><span /><span /><span /></div>
      <div className="shuffle-ghosts" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ "--ghost-index": index } as React.CSSProperties} />)}</div>
      <button className="meditation-deck" onClick={onShuffle} disabled={shuffling}>
        <span className="meditation-card"><i>☾</i></span>
        <b>{shuffling ? "正在洗牌" : "轻触牌堆"}</b>
        <small>{shuffling ? "78 张牌正在重排" : "准备好时，开始洗牌"}</small>
      </button>
      <div className="breath-copy"><span>吸气</span><i /><span>停留</span><i /><span>呼气</span></div>
    </section>
  );
}

const energyProfiles: Record<string, { label: string; focus: string; movement: string }> = {
  major: { label: "大阿尔卡那", focus: "阶段转折、价值选择与成长课题", movement: "重新定义当前阶段" },
  cups: { label: "圣杯", focus: "感受、依恋、信任与情绪交换", movement: "承认并表达真实感受" },
  swords: { label: "宝剑", focus: "判断、沟通、边界与事实", movement: "澄清信息并作出决定" },
  wands: { label: "权杖", focus: "欲望、主动性、热情与行动节奏", movement: "把意愿转化成行动" },
  pentacles: { label: "星币", focus: "时间、责任、身体与现实投入", movement: "建立可持续的现实安排" },
};

function energyKey(card: DrawnCard) {
  return card.family === "major" ? "major" : card.suit ?? "major";
}

function cardTitle(card: DrawnCard) {
  return `${card.name}（${card.reversed ? "逆位" : "正位"}）`;
}

function cardMeaning(card: DrawnCard) {
  return card.reversed ? card.reversed : card.upright;
}

function describeEnergy(card: DrawnCard) {
  return energyProfiles[energyKey(card)] ?? energyProfiles.major;
}

function orientationSummary(drawn: DrawnCard[], spread: Spread) {
  const reversedPositions = drawn
    .map((card, index) => card.reversed ? spread.positions[index]?.name : null)
    .filter(Boolean);
  if (!reversedPositions.length) return "本次所有牌都处于正位，信息较容易被看见并落实；仍需区分“方向清楚”与“结果必然”之间的差别。";
  if (reversedPositions.length === drawn.length) return "本次所有牌都处于逆位，主题主要发生在内在层面。与其立即推进结果，更适合先处理压抑、误读和尚未准备好的部分。";
  return `逆位集中在“${reversedPositions.join("、")}”。这些位置是整副牌里最可能出现迟疑、阻塞或内外不一致的地方，应优先核实，而不是把逆位简单理解成坏结果。`;
}

function buildSynthesis(drawn: DrawnCard[], spread: Spread) {
  const counts = drawn.reduce<Record<string, number>>((result, card) => {
    const key = energyKey(card);
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const topCount = ranked[0]?.[1] ?? 0;
  const dominantKeys = ranked.filter(([, count]) => count === topCount).map(([key]) => key).slice(0, 2);
  const dominantNames = dominantKeys.map((key) => energyProfiles[key]?.label ?? key).join("与");
  const dominantFocus = dominantKeys.map((key) => energyProfiles[key]?.focus).filter(Boolean).join("，同时涉及");
  const majorCount = counts.major ?? 0;
  const overview = `${dominantNames || "多重"}能量最突出，整组牌首先指向${dominantFocus || "多个层面的共同调整"}。${majorCount ? `其中 ${majorCount} 张大阿尔卡那说明，这不只是短暂情绪，还牵动当前阶段的选择与成长。` : "牌面以小阿尔卡那为主，变化更依赖日常沟通、习惯和具体行动。"}`;
  const caution = orientationSummary(drawn, spread);

  if (spread.id === "daily") {
    const card = drawn[0];
    const energy = describeEnergy(card);
    return {
      headline: card.reversed ? `先松开阻力，再${energy.movement}` : `今天适合${energy.movement}`,
      overview: `今日主题是 ${cardTitle(card)}。它把注意力放在${energy.focus}，当前牌意为“${cardMeaning(card)}”。`,
      dynamic: card.reversed
        ? `${card.name} 以逆位出现，表示这股力量暂时更像内在拉扯、过度使用或表达受阻。今天不必急着证明结果，先辨认自己在哪个环节失去流动，再用一个小行动恢复选择感。`
        : `${card.name} 以正位出现，说明它代表的能力可以被直接调用。今天的重点不是等待征兆，而是把“${card.message}”落实到一个可观察的决定中。`,
      caution,
      actions: [
        `今日行动：${card.advice}`,
        `事实核对：记录一件与“${energy.focus}”有关的真实事件，区分事实与想象。`,
        `晚间复盘：观察 ${card.name} 的能量今天在哪个时刻最明显，以及你的回应带来了什么变化。`,
      ],
    };
  }

  if (spread.id === "timeline") {
    const [past, present, future] = drawn;
    const pastEnergy = describeEnergy(past);
    const presentEnergy = describeEnergy(present);
    const futureEnergy = describeEnergy(future);
    const sameCurrent = energyKey(past) === energyKey(present);
    const sameFuture = energyKey(present) === energyKey(future);
    const headline = future.reversed
      ? `从${pastEnergy.label}走向${futureEnergy.label}，但未来仍需校正`
      : `重心正从${pastEnergy.label}转向${futureEnergy.label}`;
    const transition = sameCurrent && sameFuture
      ? `三张牌都围绕${presentEnergy.focus}展开，同一课题正在不同时间点重复出现；改变未来的关键，是现在采取不同于过去的回应。`
      : `能量先从${pastEnergy.focus}转向${presentEnergy.focus}，随后落到${futureEnergy.focus}。这说明问题的重心正在移动，不能继续只用过去的方式解释未来。`;
    return {
      headline,
      overview,
      dynamic: `过去的 ${cardTitle(past)} 描述了局面的来源：${past.message} 现在的 ${cardTitle(present)} 是真正的转折点：${present.message} 若沿当前方向发展，未来的 ${cardTitle(future)} 提示：${future.message} ${transition}`,
      caution,
      actions: [
        `停止重复：从过去的 ${past.name} 中辨认一个已不再适用的旧反应。`,
        `处理现在：${present.advice}`,
        `校准未来：围绕“${futureEnergy.focus}”设定一个一周内可以验证的变化。`,
      ],
    };
  }

  if (spread.id === "choice") {
    const [core, actionA, trendA, actionB, trendB] = drawn;
    const reverseA = Number(actionA.reversed) + Number(trendA.reversed);
    const reverseB = Number(actionB.reversed) + Number(trendB.reversed);
    const energyA = describeEnergy(trendA);
    const energyB = describeEnergy(trendB);
    const comparison = reverseA < reverseB
      ? "A 路径的能量更外显、更容易进入行动；B 路径并非不可行，但需要先处理更多内在阻力。"
      : reverseB < reverseA
        ? "B 路径的能量更外显、更容易进入行动；A 路径要求先整理动机、条件或尚未解决的阻力。"
        : `两条路径的阻力程度接近，真正差异不在“哪条更好”，而在 A 最终强调${energyA.focus}，B 最终强调${energyB.focus}。`;
    return {
      headline: reverseA === reverseB ? "两条路代价相近，选择取决于你想成为什么" : reverseA < reverseB ? "A 更容易推进，B 更需要准备" : "B 更容易推进，A 更需要准备",
      overview: `当下核心由 ${cardTitle(core)} 定调：${cardMeaning(core)}。${overview}`,
      dynamic: `选择 A 要求以 ${cardTitle(actionA)} 的方式行动，趋势落在 ${cardTitle(trendA)}，意味着${trendA.message} 选择 B 要求以 ${cardTitle(actionB)} 的方式行动，趋势落在 ${cardTitle(trendB)}，意味着${trendB.message} ${comparison}`,
      caution,
      actions: [
        `先守住核心：${core.advice}`,
        `验证 A：用一个低成本尝试检验“${energyA.focus}”是否符合你的真实需要。`,
        `验证 B：用同样时间尺度检验“${energyB.focus}”，再比较身体感受、现实代价与长期方向。`,
      ],
    };
  }

  const [self, other, viewOther, viewSelf, core, lesson, advice] = drawn;
  const selfEnergy = describeEnergy(self);
  const otherEnergy = describeEnergy(other);
  const coreEnergy = describeEnergy(core);
  const aligned = energyKey(self) === energyKey(other);
  const projectionAligned = energyKey(viewOther) === energyKey(viewSelf);
  let headline = core.reversed ? "连接仍在，但核心需求尚未被顺畅表达" : `关系核心要求双方${coreEnergy.movement}`;
  if (lesson.reversed && advice.reversed) headline = "先停止推动结果，关系需要一次诚实校准";
  if (!core.reversed && !lesson.reversed && !advice.reversed) headline = "关系具备推进条件，关键在共同参与";
  const stateComparison = aligned
    ? `你与对方都由${selfEnergy.label}能量主导，说明双方关注的是相近层面；一致能带来共鸣，也可能放大同一种盲点。`
    : `你更关注${selfEnergy.focus}，对方则更关注${otherEnergy.focus}。这不是天然不合，而是双方可能在用不同语言回应同一个关系问题。`;
  const projectionComparison = projectionAligned
    ? `双方对彼此的理解落在相近能量上，说明感知有重叠，但仍需核对具体事实。`
    : `“你眼中的对方”与“对方眼中的你”能量不同，投射与实际接收之间存在落差；这里最需要直接确认，而不是继续猜测。`;
  return {
    headline,
    overview,
    dynamic: `你的状态是 ${cardTitle(self)}，对方的状态是 ${cardTitle(other)}。${stateComparison} 你眼中的对方由 ${cardTitle(viewOther)} 描述，对方眼中的你则是 ${cardTitle(viewSelf)}。${projectionComparison} 关系核心 ${cardTitle(core)} 指向“${core.message}”，关系课题 ${cardTitle(lesson)} 暴露需要处理的阻力，而发展建议 ${cardTitle(advice)} 把下一步落在“${advice.advice}”上。`,
    caution,
    actions: [
      `先处理关系课题：${lesson.advice}`,
      `核对双方视角：各自用一句话说明“我以为你需要什么”，再由对方修正。`,
      `落实发展建议：${advice.advice}`,
    ],
  };
}

type ReadingSynthesis = ReturnType<typeof buildSynthesis>;
type ArchiveRecord = {
  id: string;
  date: string;
  spread: string;
  question: string;
  cards: DrawnCard[];
  synthesis: ReadingSynthesis;
};

const ARCHIVE_KEY = "lumen-tarot-history";

function readArchives(): ArchiveRecord[] {
  try {
    const stored = JSON.parse(localStorage.getItem(ARCHIVE_KEY) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored
      .filter((record) => record?.date && record?.question && record?.synthesis)
      .map((record, index) => ({
        ...record,
        id: record.id ?? `${record.date}-${index}`,
      }))
      .slice(0, 12) as ArchiveRecord[];
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

function HistoryArchive({
  open,
  archives,
  activeId,
  onClose,
  onSelect,
  onDelete,
  onClear,
}: {
  open: boolean;
  archives: ArchiveRecord[];
  activeId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  if (!open) return null;
  const active = archives.find((record) => record.id === activeId) ?? archives[0];

  return (
    <section className="history-overlay" role="dialog" aria-modal="true" aria-label="个人解读存档">
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
                  <button className="archive-select" onClick={() => onSelect(record.id)}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <span><small>{formatArchiveDate(record.date)} · {record.spread}</small><strong>{record.question}</strong></span>
                  </button>
                  <button className="archive-delete" onClick={() => onDelete(record.id)} aria-label={`删除“${record.question}”`}>×</button>
                </div>
              ))}
            </div>

            {active && (
              <article className="archive-detail">
                <header><small>{formatArchiveDate(active.date)}</small><h3>“{active.question}”</h3><p>{active.spread}</p></header>
                <div className="archive-cards" aria-label="存档牌面">
                  {active.cards.map((card, index) => (
                    <figure key={`${active.id}-${card.id}-${index}`}>
                      <div className={card.reversed ? "reversed-art" : ""}><CardArtwork card={card} /></div>
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
                  <ol>{active.synthesis.actions.map((action) => <li key={action}>{action}</li>)}</ol>
                </section>
              </article>
            )}
          </div>
        ) : (
          <div className="archive-empty"><span>☾</span><h3>存档仍是空的</h3><p>完成一次解读后，点击“存档本次解读”，记录就会出现在这里。</p></div>
        )}

        <footer className="history-footer"><span>{archives.length} / 12 条记录</span>{archives.length > 0 && <button onClick={onClear}>清空存档</button>}</footer>
      </div>
    </section>
  );
}

export default function ReadingClient({ initialSpreadId }: { initialSpreadId: string }) {
  const experienceRef = useRef<HTMLElement>(null);
  const spread = spreads.find((item) => item.id === initialSpreadId) ?? spreads[0];
  const [question, setQuestion] = useState(defaultQuestion[spread.id]);
  const [drawn, setDrawn] = useState<DrawnCard[]>([]);
  const [ritualDeck, setRitualDeck] = useState<DrawnCard[]>([]);
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [ritualStep, setRitualStep] = useState<RitualStep>("idle");
  const [selectedCard, setSelectedCard] = useState(0);
  const [saved, setSaved] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [archives, setArchives] = useState<ArchiveRecord[]>([]);
  const [activeArchiveId, setActiveArchiveId] = useState<string | null>(null);
  const sound = useRitualSound();
  const hasReading = ritualStep === "reading" && drawn.length === spread.count;
  const current = drawn[selectedCard];
  const allRevealed = hasReading && drawn.every((card) => card.revealed);
  const sampleCards = (spreadVisualCards[spread.id] ?? spreadVisualCards.venus)
    .map((image) => tarotDeck.find((card) => card.image === image))
    .filter((card): card is TarotCard => Boolean(card));

  useEffect(() => {
    const open = historyOpen || (ritualStep !== "idle" && ritualStep !== "reading");
    document.body.classList.toggle("ritual-open", open);
    return () => document.body.classList.remove("ritual-open");
  }, [historyOpen, ritualStep]);

  useEffect(() => {
    const storedArchives = readArchives();
    setArchives(storedArchives);
    setActiveArchiveId(storedArchives[0]?.id ?? null);
    localStorage.removeItem("lumen-tarot-nickname");
  }, []);

  useEffect(() => {
    if (!historyOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHistoryOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyOpen]);

  const synthesis = useMemo(() => {
    if (!allRevealed) return null;
    return buildSynthesis(drawn, spread);
  }, [allRevealed, drawn, spread]);

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - .5;
    const py = (event.clientY - rect.top) / rect.height - .5;
    experienceRef.current?.style.setProperty("--pointer-x", px.toFixed(3));
    experienceRef.current?.style.setProperty("--pointer-y", py.toFixed(3));
  }

  function startRitual() {
    sound.play("enter");
    const preparedDeck = shuffle(tarotDeck).map((card) => ({
      ...card,
      reversed: Math.random() < .42,
      revealed: false,
    }));
    setRitualDeck(preparedDeck);
    setPickedIds([]);
    setDrawn([]);
    setSelectedCard(0);
    setSaved(false);
    setRitualStep("meditating");
  }

  function beginShuffle() {
    if (ritualStep !== "meditating") return;
    sound.play("shuffle");
    setRitualStep("shuffling");
    window.setTimeout(() => {
      sound.play("transition");
      setRitualStep("choosing");
    }, 1900);
  }

  function closeRitual() {
    setRitualStep("idle");
    setDrawn([]);
    setPickedIds([]);
  }

  function pickCard(card: DrawnCard) {
    if (ritualStep !== "choosing" || pickedIds.includes(card.id) || drawn.length >= spread.count) return;
    sound.play("pick");
    const nextPicked = [...pickedIds, card.id];
    const nextDrawn = [...drawn, card];
    setPickedIds(nextPicked);
    setDrawn(nextDrawn);
    if (nextDrawn.length === spread.count) {
      window.setTimeout(() => sound.play("place"), 240);
      setRitualStep("placing");
      window.setTimeout(() => {
        setRitualStep("reading");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 1250);
    }
  }

  function revealCard(index: number) {
    if (!drawn[index]?.revealed) sound.play("flip");
    setDrawn((cards) => cards.map((card, cardIndex) => cardIndex === index ? { ...card, revealed: true } : card));
    setSelectedCard(index);
  }

  function revealAll() {
    drawn.forEach((_, index) => window.setTimeout(() => revealCard(index), index * 220));
  }

  function saveReading() {
    if (!allRevealed || !synthesis || saved) return;
    sound.play("archive");
    const record: ArchiveRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
      spread: spread.name,
      question,
      cards: drawn,
      synthesis,
    };
    const nextArchives = [record, ...readArchives()].slice(0, 12);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(nextArchives));
    setArchives(nextArchives);
    setActiveArchiveId(record.id);
    setSaved(true);
  }

  function openHistory() {
    sound.play("archive");
    const storedArchives = readArchives();
    setArchives(storedArchives);
    setActiveArchiveId((currentId) => storedArchives.some((record) => record.id === currentId) ? currentId : storedArchives[0]?.id ?? null);
    setHistoryOpen(true);
  }

  function deleteArchive(id: string) {
    const nextArchives = archives.filter((record) => record.id !== id);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(nextArchives));
    setArchives(nextArchives);
    if (activeArchiveId === id) setActiveArchiveId(nextArchives[0]?.id ?? null);
  }

  function clearArchives() {
    localStorage.removeItem(ARCHIVE_KEY);
    setArchives([]);
    setActiveArchiveId(null);
  }

  const meaning = current?.reversed ? current.reversed : current?.upright;
  const shadow = current?.reversed ? `逆位使这张牌的能量更偏向内在或受阻：${current.reversed}。先辨认它是被压抑、被夸大，还是尚未找到合适的表达方式。` : `即使处于正位，也要留意这张牌的阴影面：${current?.reversed}。当优势被过度使用时，它可能成为新的阻力。`;

  return (
    <main className="reading-page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="返回牌阵主页面"><span className="brand-mark">☾</span><span>LUMEN TAROT</span></a>
        <div className="top-arcana">ARCANA · RITUAL · REFLECTION</div>
        <div className="topbar-tools"><SoundToggle enabled={sound.enabled} onToggle={sound.toggle} /><button className={`history-button ${historyOpen ? "is-open" : ""}`} title="解读存档" aria-label="打开解读存档" onClick={openHistory}><span>↺</span><small>HISTORY</small></button></div>
      </header>

      <section ref={experienceRef} className={`experience ${hasReading ? "after-draw" : "before-draw"}`} id="reading" onPointerMove={handlePointerMove}>
        <StarField />
        <span className="ornament corner-one">❦</span><span className="ornament corner-two">❦</span>
        {!hasReading ? (
          <div className="ritual-stage">
            <section className="ritual-copy">
              <div className="eyebrow">{spread.english}</div>
              <h1><span>{spread.name}</span><em>{spread.category}</em></h1>
              <p>{spread.description}{spread.when}</p>
              <div className="question-box">
                <label htmlFor="question">你的问题</label>
                <textarea id="question" rows={2} value={question} onChange={(event) => setQuestion(event.target.value)} />
              </div>
              <div className="ritual-actions">
                <button className="draw-button" onClick={startRitual} data-testid="draw-button"><span>进入抽牌仪式</span><b>✦</b></button>
              </div>
            </section>

            <div className="living-deck" aria-hidden="true">
              <div className="halo-copy"><span>AS ABOVE</span><span>SO BELOW</span></div>
              {sampleCards.map((card, index) => {
                const offset = index - (sampleCards.length - 1) / 2;
                const spacing = sampleCards.length === 1 ? 0 : sampleCards.length === 3 ? 112 : sampleCards.length === 5 ? 92 : 66;
                const rise = sampleCards.length === 7 ? 18 : 30;
                const rotation = sampleCards.length === 7 ? 6 : 10;
                return <div key={card.id} className="fan-card" style={{ "--fan-x": `${offset * spacing}px`, "--fan-y": `${-88 + Math.abs(offset) * rise}px`, "--fan-r": `${offset * rotation}deg`, "--fan-z": Math.max(1, 4 - Math.abs(offset)) } as React.CSSProperties}><CardArtwork card={card} /></div>;
              })}
              <div className="deck-core"><span className="deck-moon">☾</span><small>78 CARDS</small></div>
              <div className="orbit-copy">THE CARDS REMEMBER WHAT THE MIND FORGETS</div>
            </div>

            <aside className="position-index">
              <div className="eyebrow">POSITIONS</div>
              {spread.positions.map((position, index) => <div key={position.name}><b>{String(index + 1).padStart(2, "0")}</b><span><strong>{position.name}</strong><small>{position.prompt}</small></span></div>)}
            </aside>
          </div>
        ) : (
          <div className="reading-stage">
            <div className="reading-heading"><div><div className="eyebrow">{spread.english}</div><h1>{spread.name}</h1><p>“{question}”</p></div></div>
            <div className={`tarot-table layout-${spread.id}`}>
              <div className="table-lines" aria-hidden="true"><span /><span /><span /></div>
              <div className="spread-board" aria-label={`${spread.name}牌面`}>
                {drawn.map((card, index) => <SpreadCard key={card.id} card={card} index={index} spread={spread} selected={card.revealed && selectedCard === index} onReveal={() => revealCard(index)} />)}
              </div>
              <div className="table-actions">{!allRevealed && <button onClick={revealAll}>依次翻开</button>}<button onClick={startRitual}>重新举行仪式</button></div>
            </div>
          </div>
        )}
      </section>

      {hasReading && (
        <section className="interpretation" aria-live="polite">
          <div className="interpret-tabs" role="tablist" aria-label="牌位解析">
            {drawn.map((card, index) => <button key={card.id} role="tab" className={selectedCard === index ? "active" : ""} aria-selected={selectedCard === index} onClick={() => setSelectedCard(index)} disabled={!card.revealed}><b>{String(index + 1).padStart(2, "0")}</b><span>{spread.positions[index].name}</span></button>)}
          </div>
          {current?.revealed ? (
            <div className="interpret-body">
              <aside className="focus-card"><div className={current.reversed ? "focus-art reversed-art" : "focus-art"}><CardArtwork card={current} /></div><div><span>SELECTED CARD</span><h2>{current.name}</h2><p>{spread.positions[selectedCard].name}</p></div></aside>
              <article className="analysis-essay">
                <header><div className="eyebrow">CARD {String(selectedCard + 1).padStart(2, "0")} · DEEP READING</div><h2>这张牌在此处，真正指向什么</h2></header>
                <div className="analysis-grid">
                  <section><b>01</b><div><h3>核心牌意</h3><p>{meaning}。{current.message}</p></div></section>
                  <section><b>02</b><div><h3>画面与象征</h3><p>{current.visual}</p></div></section>
                  <section><b>03</b><div><h3>阵位作用</h3><p>此牌位负责观察“{spread.positions[selectedCard].prompt}”。{current.message}因此，它不是孤立结论，而是整副牌中这一关系维度的切片。</p></div></section>
                  <section><b>04</b><div><h3>关系映射</h3><p>{current.relationship}</p></div></section>
                  <section className="wide"><b>05</b><div><h3>盲点与提醒</h3><p>{shadow}</p></div></section>
                  <section className="wide action-note"><b>06</b><div><h3>下一步行动</h3><p>{current.advice}</p></div></section>
                </div>
              </article>
            </div>
          ) : <div className="locked-reading"><span>☾</span><h2>牌仍然沉默</h2><p>翻开任意一张牌后，这里会出现完整的牌面、象征、阵位和行动解析。</p></div>}

          {allRevealed && synthesis && (
            <article className="synthesis">
              <div className="synthesis-title"><span>✦</span><div><div className="eyebrow">THE WHOLE READING</div><h2>{synthesis.headline}</h2></div></div>
              <div className="synthesis-copy"><p>{synthesis.overview}</p><p>{synthesis.dynamic}</p><p>{synthesis.caution}</p></div>
              <div className="action-list"><div className="eyebrow">THREE GROUNDED STEPS</div>{synthesis.actions.map((action, index) => <div key={action}><b>{index + 1}</b><span>{action}</span></div>)}</div>
              <button className="save-button" onClick={saveReading} disabled={saved}>{saved ? "已存档" : "存档本次解读"}</button>
            </article>
          )}
        </section>
      )}

      <RitualOverlay step={ritualStep} spread={spread} question={question} deck={ritualDeck} drawn={drawn} pickedIds={pickedIds} onShuffle={beginShuffle} onPick={pickCard} onClose={closeRitual} />
      <HistoryArchive open={historyOpen} archives={archives} activeId={activeArchiveId} onClose={() => setHistoryOpen(false)} onSelect={setActiveArchiveId} onDelete={deleteArchive} onClear={clearArchives} />
    </main>
  );
}
