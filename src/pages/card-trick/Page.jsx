import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import Annotation from "../../components/Annotation";

const LABELS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const CELL_W = 28;
const CELL_GAP = 2;
const CELL_STEP = CELL_W + CELL_GAP;

function cardColor(rank) {
  const hue = (rank / 13) * 360;
  return `hsl(${hue}, 75%, 55%)`;
}

function makeDeck() {
  return Array.from({ length: 52 }, (_, i) => ({ id: i, rank: i % 13 }));
}

function cutDeck(deck, cutIndex) {
  return [...deck.slice(cutIndex), ...deck.slice(0, cutIndex)];
}

const TOTAL_CUTS = 3;

// Cut stages: null → "split" → "lift" → "swap" → "settle" → null
// split:  gap opens between the two halves
// lift:   back half rises up
// swap:   back half slides left over front, front slides right + down
// settle: merged into new order, flat

export default function CardTrickPage() {
  const [deck, setDeck] = useState(makeDeck);
  const [phase, setPhase] = useState("intro");
  const [cutLine, setCutLine] = useState(null);
  const [cutStage, setCutStage] = useState(null);
  const [highlightRank, setHighlightRank] = useState(null);
  const [cutCount, setCutCount] = useState(0);
  const [dealProgress, setDealProgress] = useState(0);
  const timerRef = useRef(null);

  const clearTimer = () => clearTimeout(timerRef.current);

  const restart = useCallback(() => {
    setDeck(makeDeck());
    setPhase("intro");
    setCutLine(null);
    setCutStage(null);
    setHighlightRank(null);
    setCutCount(0);
    setDealProgress(0);
  }, []);

  useEffect(() => {
    clearTimer();

    if (phase === "intro") {
      timerRef.current = setTimeout(() => setPhase("cutting"), 2500);
    }

    if (phase === "cutting") {
      if (cutCount >= TOTAL_CUTS) {
        setPhase("proof");
        return;
      }
      const idx = Math.floor(Math.random() * 40) + 6;
      setCutLine(idx);
      setCutStage(null);

      // Show cut line
      timerRef.current = setTimeout(() => {
        // 1. Open gap between halves
        setCutStage("split");
        timerRef.current = setTimeout(() => {
          // 2. Back up, front down
          setCutStage("lift");
          timerRef.current = setTimeout(() => {
            // 3. Slide past each other
            setCutStage("swap");
            timerRef.current = setTimeout(() => {
              // 4. Bring both to same height (reverse of lift)
              setCutStage("level");
              timerRef.current = setTimeout(() => {
                // 5. Close the gap (reverse of split)
                setCutStage("merge");
                timerRef.current = setTimeout(() => {
                  // 6. Commit reorder
                  setCutStage("settle");
                  setDeck((d) => cutDeck(d, idx));
                  setCutLine(null);
                  setCutStage(null);
                  setCutCount((c) => c + 1);
                }, 600);
              }, 800);
            }, 800);
          }, 800);
        }, 600);
      }, 600);
    }

    if (phase === "proof") {
      setHighlightRank(0);
      timerRef.current = setTimeout(() => {
        setHighlightRank(null);
        setPhase("deal");
      }, 3500);
    }

    if (phase === "deal") {
      setDealProgress(0);
    }

    if (phase === "result") {
      timerRef.current = setTimeout(restart, 4000);
    }

    return clearTimer;
  }, [phase, cutCount, restart]);

  // Deal one card at a time
  useEffect(() => {
    if (phase !== "deal") return;
    if (dealProgress >= 52) {
      const id = setTimeout(() => setPhase("result"), 600);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setDealProgress((p) => p + 1), 60);
    return () => clearTimeout(id);
  }, [phase, dealProgress]);

  // During deal, keep the full deck rendered (cards fade out in-place)
  const remainingDeck = deck;

  const piles = useMemo(() => {
    if (phase !== "deal" && phase !== "result") return null;
    const p = Array.from({ length: 13 }, () => []);
    const count = phase === "result" ? 52 : dealProgress;
    for (let i = 0; i < count; i++) {
      p[i % 13].push(deck[i]);
    }
    return p;
  }, [phase, dealProgress, deck]);

  const showStrip = phase === "intro" || phase === "cutting" || phase === "proof" || phase === "deal";
  const isCutAnimating = phase === "cutting" && cutLine !== null && cutStage !== null && cutStage !== "settle";

  const annotations = {
    intro: "52 cards: A→K repeated 4 times. Each number has a color.",
    cutting: `Cut the deck… (${Math.min(cutCount + 1, TOTAL_CUTS)}/${TOTAL_CUTS})`,
    proof: "The 4 Aces (red) are still exactly 13 apart. Cutting only rotates — spacing is preserved.",
    deal: "Deal round-robin into 13 piles…",
    result: "Every pile is a four-of-a-kind!",
  };

  // During cut animation, split into two groups
  const frontCards = isCutAnimating ? deck.slice(0, cutLine) : null;
  const backCards = isCutAnimating ? deck.slice(cutLine) : null;

  const frontCount = cutLine ?? 0;
  const backCount = 52 - frontCount;
  const totalWidth = 52 * CELL_STEP - CELL_GAP;

  const stripCards = showStrip ? remainingDeck : [];
  // During deal, keep full width so cards don't shift
  const fullWidth = 52 * CELL_STEP - CELL_GAP;
  const stripWidth = phase === "deal" ? fullWidth : stripCards.length * CELL_STEP - (stripCards.length > 0 ? CELL_GAP : 0);

  // Both groups sit side by side in a flex row (centered by deck-row).
  // Transforms are relative to their natural (side-by-side) position.
  //
  // Sequence:
  //   split → lift → swap → level → merge → settle
  // "level" and "merge" are the reverse of "lift" and "split"
  const gap = 24;
  const swapX = backCount * CELL_STEP;  // how far front moves right
  const swapXBack = frontCount * CELL_STEP; // how far back moves left

  const getFrontTransform = () => {
    switch (cutStage) {
      case "split": return { x: -gap / 2, y: 0 };
      case "lift":  return { x: -gap / 2, y: 60 };
      case "swap":  return { x: swapX + gap / 2, y: 60 };
      case "level": return { x: swapX + gap / 2, y: 0 };
      case "merge": return { x: swapX, y: 0 };
      default:      return { x: 0, y: 0 };
    }
  };
  const getBackTransform = () => {
    switch (cutStage) {
      case "split": return { x: gap / 2, y: 0 };
      case "lift":  return { x: gap / 2, y: -60 };
      case "swap":  return { x: -(swapXBack + gap / 2), y: -60 };
      case "level": return { x: -(swapXBack + gap / 2), y: 0 };
      case "merge": return { x: -swapXBack, y: 0 };
      default:      return { x: 0, y: 0 };
    }
  };

  const springConfig = { type: "spring", stiffness: 70, damping: 16 };

  return (
    <div className="page-container" style={{ maxWidth: 960, justifyContent: (phase === "deal" || phase === "result") ? "flex-start" : undefined, paddingTop: (phase === "deal" || phase === "result") ? "4rem" : undefined }}>
      <AnimatePresence mode="wait">
        <Annotation key={phase} text={annotations[phase]} />
      </AnimatePresence>

      {/* Piles – 2 rows: 6 above, 7 below (rendered before deck so they appear above it) */}
      {piles && (
        <div className="piles">
          {[piles.slice(0, 6), piles.slice(6)].map((row, ri) => (
            <div key={ri} className="piles-row">
              {row.map((pile, ci) => {
                const pi = ri === 0 ? ci : ci + 6;
                return (
                  <div key={pi} className="pile">
                    <span className="pile-label">
                      {pile.length > 0 ? LABELS[pile[0].rank] : ""}
                    </span>
                    <div className="pile-cards">
                      <AnimatePresence initial={false}>
                        {pile.map((card) => (
                          <motion.div
                            key={card.id}
                            className="pile-cell"
                            style={{ backgroundColor: cardColor(card.rank) }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Deck strip — normal (non-cutting) */}
      {showStrip && !isCutAnimating && (
        <motion.div
          className="deck-row"
          animate={{ y: phase === "deal" ? 80 : 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        >
          <LayoutGroup>
            <motion.div
              className="deck-strip"
              animate={{ width: stripWidth }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {stripCards.map((card, i) => {
                const dimmed = highlightRank !== null && card.rank !== highlightRank;
                const isDealt = phase === "deal" && i < dealProgress;
                return (
                  <motion.div
                    key={card.id}
                    layoutId={`card-${card.id}`}
                    className="cell"
                    style={{ backgroundColor: cardColor(card.rank) }}
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{
                      y: 0,
                      opacity: isDealt ? 0 : dimmed ? 0.15 : 1,
                      scale: isDealt ? 0.7 : 1,
                    }}
                    transition={{
                      layout: { type: "spring", stiffness: 120, damping: 20 },
                      opacity: { duration: 0.12 },
                      scale: { duration: 0.12 },
                    }}
                  >
                    <span className="cell-label">{LABELS[card.rank]}</span>
                  </motion.div>
                );
              })}

              {/* Cut line — before animation starts */}
              <AnimatePresence>
                {cutLine !== null && cutStage === null && (
                  <motion.div
                    className="cut-line"
                    style={{ left: cutLine * CELL_STEP - Math.ceil(CELL_GAP / 2) - 1 }}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    exit={{ scaleY: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </AnimatePresence>

              {/* Distance markers */}
              {highlightRank !== null && (() => {
                const positions = [];
                deck.forEach((card, i) => {
                  if (card.rank === highlightRank) positions.push(i);
                });
                return (
                  <div className="distance-markers">
                    {positions.map((pos) => (
                      <motion.div
                        key={`arrow-${pos}`}
                        className="marker"
                        style={{ left: pos * CELL_STEP, width: CELL_W }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        ↑
                      </motion.div>
                    ))}
                    {positions.slice(0, -1).map((pos, idx) => {
                      const nextPos = positions[idx + 1];
                      const left = pos * CELL_STEP + CELL_W / 2;
                      const width = (nextPos - pos) * CELL_STEP;
                      return (
                        <motion.div
                          key={`gap-${idx}`}
                          className="gap-label"
                          style={{ left, width }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                        >
                          13
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })()}
            </motion.div>
          </LayoutGroup>
        </motion.div>
      )}

      {/* Deck strip — cutting animation with two groups */}
      {isCutAnimating && (
        <div className="deck-row">
          <div className="cut-container">
            {/* Front group: slides down then right */}
            <motion.div
              className="cut-group"
              animate={getFrontTransform()}
              transition={springConfig}
            >
              {frontCards.map((card) => (
                <div
                  key={card.id}
                  className="cell"
                  style={{ backgroundColor: cardColor(card.rank) }}
                >
                  <span className="cell-label">{LABELS[card.rank]}</span>
                </div>
              ))}
            </motion.div>

            {/* Back group: lifts up then slides left */}
            <motion.div
              className="cut-group"
              animate={getBackTransform()}
              transition={springConfig}
            >
              {backCards.map((card) => (
                <div
                  key={card.id}
                  className="cell"
                  style={{ backgroundColor: cardColor(card.rank) }}
                >
                  <span className="cell-label">{LABELS[card.rank]}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      )}


    </div>
  );
}
