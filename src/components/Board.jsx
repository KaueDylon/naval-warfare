import { useMemo } from 'react';
import { ShipCellSprite, ShipTypeLabel, detectSunkShipsWithTypes } from './ShipSprites';

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
  sunkCells = new Set(), // Set de "row-col" — células de navios afundados
  shipTypesMap = new Map(), // Map de "row-col" → "CARRIER" etc. (do backend)
  animatedCell = null, // {row, col, type} — célula com animação ativa
}) {
  const rows = 'ABCDEFGHIJ'.split('');
  const cols = Array.from({ length: 10 }, (_, i) => i + 1);

  // Detectar navios afundados e mapear cada célula ao seu sprite info
  const sunkShipMap = useMemo(() => {
    const ships = detectSunkShipsWithTypes(sunkCells, shipTypesMap);
    const map = new Map(); // key "row-col" → { shipType, cellIndex, totalCells, horizontal, isCenter }
    for (const ship of ships) {
      const centerIdx = Math.floor(ship.cells.length / 2);
      ship.cells.forEach((cell, idx) => {
        map.set(`${cell.row}-${cell.col}`, {
          shipType: ship.shipType,
          cellIndex: idx,
          totalCells: ship.size,
          horizontal: ship.horizontal,
          isCenter: idx === centerIdx,
        });
      });
    }
    return map;
  }, [sunkCells, shipTypesMap]);

  // Returns Set of "row-col" strings for the ghost preview
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
    if (value === 1 && !isOpponent) return { backgroundColor: 'rgba(196,202,167,0.15)' };
    return {};
  }

  function getCellContent(value, rowIdx, colIdx) {
    const key = `${rowIdx}-${colIdx}`;
    const spriteInfo = sunkShipMap.get(key);

    // Se é célula de navio afundado — mostrar sprite do navio
    if (spriteInfo) {
      return (
        <>
          <ShipCellSprite
            shipType={spriteInfo.shipType}
            cellIndex={spriteInfo.cellIndex}
            totalCells={spriteInfo.totalCells}
            horizontal={spriteInfo.horizontal}
          />
          {spriteInfo.isCenter && (
            <ShipTypeLabel shipType={spriteInfo.shipType} />
          )}
        </>
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
    if (value === 1 && !isOpponent) {
      return <div className="w-full h-full bg-primary/20" />;
    }
    return null;
  }

  function handleBoardMouseLeave() {
    if (onCellHover) onCellHover(null, null);
    if (onMouseLeave) onMouseLeave();
  }

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
      </div>
    </div>
  );
}
