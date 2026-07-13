import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { getShipSprite } from "../constants/ships";

/**
 * Detecta grupos de navio no grid baseado no shipTypes Map.
 */
function detectShipGroups(grid, shipTypes) {
  if (!shipTypes || shipTypes.size === 0) return [];

  const visited = new Set();
  const groups = [];

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const key = `${r}-${c}`;
      if (visited.has(key)) continue;
      const type = shipTypes.get(key);
      if (!type) continue;

      const cells = [];
      const stack = [[r, c]];
      while (stack.length) {
        const [sr, sc] = stack.pop();
        const sk = `${sr}-${sc}`;
        if (visited.has(sk)) continue;
        if (shipTypes.get(sk) !== type) continue;
        const val = grid?.[sr]?.[sc] ?? 0;
        if (val !== 1 && val !== 3) continue;
        visited.add(sk);
        cells.push({ row: sr, col: sc });
        [[sr - 1, sc], [sr + 1, sc], [sr, sc - 1], [sr, sc + 1]].forEach(
          ([nr, nc]) => {
            if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10) stack.push([nr, nc]);
          }
        );
      }

      if (cells.length === 0) continue;
      cells.sort((a, b) => a.row - b.row || a.col - b.col);
      const horizontal = cells.every((c) => c.row === cells[0].row);
      groups.push({ type, cells, horizontal });
    }
  }

  return groups;
}

export default function Board({
  grid,
  onCellClick,
  onCellHover,
  onMouseLeave,
  isOpponent,
  disabled,
  title,
  ghostShip = null,
  hoveredCell = null,
  sunkCells = new Set(),
  animatedCell = null,
  shipTypes = null,
  nation = null,
}) {
  const rows = 'ABCDEFGHIJ'.split('');
  const cols = Array.from({ length: 10 }, (_, i) => i + 1);
  const boardRef = useRef(null);
  const cellRefs = useRef({}); // "row-col" → DOM element
  const [cellMetrics, setCellMetrics] = useState(null); // { offsetX, offsetY, cellW, cellH }

  const shipGroups = useMemo(() => {
    if (!shipTypes || !nation) return [];
    return detectShipGroups(grid, shipTypes);
  }, [grid, shipTypes, nation]);

  const visibleGroups = useMemo(() => {
    return shipGroups.filter((group) => {
      if (!isOpponent) return true;
      return group.cells.every((c) => sunkCells.has(`${c.row}-${c.col}`));
    });
  }, [shipGroups, isOpponent, sunkCells]);

  const spriteCells = useMemo(() => {
    const set = new Set();
    visibleGroups.forEach((group) => {
      const sprite = getShipSprite(nation, group.type, group.horizontal);
      if (sprite) {
        group.cells.forEach((c) => set.add(`${c.row}-${c.col}`));
      }
    });
    return set;
  }, [visibleGroups, nation]);

  // Measure cell positions after render/resize
  const measureCells = useCallback(() => {
    if (!boardRef.current) return;
    const firstCell = cellRefs.current["0-0"];
    const lastCell = cellRefs.current["9-9"];
    if (!firstCell || !lastCell) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const firstRect = firstCell.getBoundingClientRect();
    const lastRect = lastCell.getBoundingClientRect();

    const offsetX = firstRect.left - boardRect.left;
    const offsetY = firstRect.top - boardRect.top;
    const cellW = (lastRect.right - firstRect.left) / 10;
    const cellH = (lastRect.bottom - firstRect.top) / 10;

    setCellMetrics({ offsetX, offsetY, cellW, cellH });
  }, []);

  useEffect(() => {
    measureCells();
    window.addEventListener("resize", measureCells);
    return () => window.removeEventListener("resize", measureCells);
  }, [measureCells]);

  // Re-measure when grid changes (ships placed)
  useEffect(() => {
    // Small delay to let grid re-render
    const timer = setTimeout(measureCells, 50);
    return () => clearTimeout(timer);
  }, [grid, shipTypes, measureCells]);

  function getGhostCells() {
    if (!ghostShip || !hoveredCell || isOpponent) return new Set();
    const { size, horizontal } = ghostShip;
    const { row, col } = hoveredCell;
    const cells = new Set();
    for (let i = 0; i < size; i++) {
      const r = horizontal ? row : row + i;
      const c = horizontal ? col + i : col;
      if (r >= 10 || c >= 10) return new Set();
      cells.add(`${r}-${c}`);
    }
    return cells;
  }

  function isGhostValid() {
    if (!ghostShip || !hoveredCell || isOpponent) return true;
    const { size, horizontal } = ghostShip;
    const { row, col } = hoveredCell;
    for (let i = 0; i < size; i++) {
      const r = horizontal ? row : row + i;
      const c = horizontal ? col + i : col;
      if (r >= 10 || c >= 10) return false;
      if ((grid?.[r]?.[c] ?? 0) === 1) return false;
    }
    return true;
  }

  const ghostCells = getGhostCells();
  const ghostValid = isGhostValid();

  const GHOST_BG     = ghostValid ? 'rgba(218,199,105,0.28)' : 'rgba(255,180,171,0.28)';
  const GHOST_BORDER = ghostValid ? 'rgba(218,199,105,0.75)' : 'rgba(255,180,171,0.75)';

  function getCellStyle(value, rowIdx, colIdx) {
    const key = `${rowIdx}-${colIdx}`;
    if (ghostCells.has(key)) {
      return {
        backgroundColor: GHOST_BG,
        outline: `2px solid ${GHOST_BORDER}`,
        outlineOffset: '-2px',
        position: 'relative',
        zIndex: 5,
      };
    }
    if (sunkCells.has(key)) {
      return {
        backgroundColor: 'rgba(255,140,0,0.12)',
        outline: '2px solid rgba(255,140,0,0.5)',
        outlineOffset: '-2px',
        position: 'relative',
        overflow: 'hidden',
      };
    }
    if (value === 3) return { backgroundColor: 'rgba(255,180,171,0.08)', position: 'relative' };
    if (value === 1 && !isOpponent && spriteCells.has(key)) return { position: 'relative' };
    if (value === 1 && !isOpponent) return { backgroundColor: 'rgba(196,202,167,0.15)' };
    return {};
  }

  function getCellContent(value, rowIdx, colIdx) {
    const key = `${rowIdx}-${colIdx}`;

    if (sunkCells.has(key)) {
      return (
        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: 'rgba(255,140,0,0.9)',
            boxShadow: '0 0 10px rgba(255,140,0,0.6)',
          }}
        />
      );
    }

    if (value === 2) {
      return (
        <span
          className="material-symbols-outlined text-on-surface-variant/40 text-sm"
          style={{ fontVariationSettings: "'opsz' 20" }}
        >
          close
        </span>
      );
    }
    if (value === 3) {
      return (
        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: 'rgba(255,180,171,0.9)',
            boxShadow: '0 0 10px rgba(255,180,171,0.6)',
          }}
        />
      );
    }
    if (value === 1 && !isOpponent && !spriteCells.has(key)) {
      return <div className="w-full h-full bg-primary/20" />;
    }
    return null;
  }

  function handleBoardMouseLeave() {
    if (onCellHover) onCellHover(null, null);
    if (onMouseLeave) onMouseLeave();
  }

  const setCellRef = useCallback((el, row, col) => {
    if (el) cellRefs.current[`${row}-${col}`] = el;
  }, []);

  return (
    <div className="flex flex-col">
      {title && (
        <div className="flex justify-between items-center mb-3 border-l-4 border-current pl-3">
          <h3
            className="text-lg stencil-text text-on-surface"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            {title}
          </h3>
        </div>
      )}
      <div
        ref={boardRef}
        className="aspect-square bg-surface-container border-2 border-outline relative p-2 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]"
        onMouseLeave={handleBoardMouseLeave}
      >
        <div className="scanline-overlay pointer-events-none" />

        <div
          className="grid h-full w-full"
          style={{
            gridTemplateColumns: 'auto repeat(10, 1fr)',
            gridTemplateRows: 'auto repeat(10, 1fr)',
          }}
        >
          {/* Column headers */}
          <div />
          {cols.map((col) => (
            <div
              key={`col-${col}`}
              className="flex items-center justify-center text-outline"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}
            >
              {col}
            </div>
          ))}

          {/* Grid cells */}
          {rows.map((row, rowIdx) => (
            <div key={`row-${row}`} className="contents">
              <div
                className="flex items-center justify-center text-outline"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}
              >
                {row}
              </div>

              {cols.map((col, colIdx) => {
                const value  = grid?.[rowIdx]?.[colIdx] ?? 0;
                const isAttacked = value === 2 || value === 3;
                const canAttack  = isOpponent && !disabled && !isAttacked;
                const canPlace   = !isOpponent && !disabled && !!ghostShip;
                const interactive = canAttack || canPlace;
                const isAnimating = animatedCell && animatedCell.row === rowIdx && animatedCell.col === colIdx;
                const animClass = isAnimating ? `animate-${animatedCell.type}` : '';

                return (
                  <div
                    key={`${row}${col}`}
                    ref={(el) => setCellRef(el, rowIdx, colIdx)}
                    className={`border flex items-center justify-center relative ${
                      isOpponent ? 'border-secondary/20' : 'border-outline/10'
                    } ${interactive ? 'cursor-crosshair' : ''} ${animClass}`}
                    style={getCellStyle(value, rowIdx, colIdx)}
                    onClick={() => {
                      if (interactive && onCellClick) onCellClick(rowIdx, colIdx);
                    }}
                    onMouseEnter={() => {
                      if (!disabled && onCellHover) onCellHover(rowIdx, colIdx);
                    }}
                  >
                    {getCellContent(value, rowIdx, colIdx)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Ship sprite overlay — absolutely positioned, does NOT affect grid */}
        {cellMetrics && visibleGroups.map((group) => {
          const sprite = getShipSprite(nation, group.type, group.horizontal);
          if (!sprite) return null;

          const origin = group.cells[0];
          const size = group.cells.length;
          const isSunk = isOpponent && group.cells.every((c) => sunkCells.has(`${c.row}-${c.col}`));

          const { offsetX, offsetY, cellW, cellH } = cellMetrics;

          const x = offsetX + origin.col * cellW;
          const y = offsetY + origin.row * cellH;
          const w = group.horizontal ? cellW * size : cellW;
          const h = group.horizontal ? cellH : cellH * size;

          // Não renderizar no board inimigo se não está sunk
          if (isOpponent && !isSunk) return null;

          return (
            <div
              key={`ship-${group.type}-${origin.row}-${origin.col}`}
              className="absolute pointer-events-none"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${w}px`,
                height: `${h}px`,
                zIndex: 2,
              }}
            >
              <img
                src={sprite}
                alt=""
                className="select-none"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: isSunk ? 0.7 : 0.85,
                  filter: isSunk
                    ? 'sepia(0.3) brightness(0.7) saturate(0.8) blur(0.7px)'
                    : 'none',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
