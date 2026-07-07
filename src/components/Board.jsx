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
  animatedCell = null, // {row, col, type} — célula com animação ativa
}) {
  const rows = 'ABCDEFGHIJ'.split('');
  const cols = Array.from({ length: 10 }, (_, i) => i + 1);

  // Returns Set of "row-col" strings for the ghost preview
  function getGhostCells() {
    if (!ghostShip || !hoveredCell || isOpponent) return new Set();
    const { size, horizontal } = ghostShip;
    const { row, col } = hoveredCell;
    const cells = new Set();
    for (let i = 0; i < size; i++) {
      const r = horizontal ? row : row + i;
      const c = horizontal ? col + i : col;
      if (r >= 10 || c >= 10) return new Set(); // out of bounds — show nothing, flagged by isGhostValid
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

  // Use inline styles for ghost colors — Tailwind purges dynamic class names at build time
  const GHOST_BG     = ghostValid ? 'rgba(218,199,105,0.28)' : 'rgba(255,180,171,0.28)';
  const GHOST_BORDER = ghostValid ? 'rgba(218,199,105,0.75)' : 'rgba(255,180,171,0.75)';

  function getCellStyle(value, rowIdx, colIdx) {
    if (ghostCells.has(`${rowIdx}-${colIdx}`)) {
      return {
        backgroundColor: GHOST_BG,
        outline: `2px solid ${GHOST_BORDER}`,
        outlineOffset: '-2px',
        position: 'relative',
        zIndex: 5,
      };
    }
    if (sunkCells.has(`${rowIdx}-${colIdx}`)) {
      return {
        backgroundColor: 'rgba(255,140,0,0.18)',
        outline: '2px solid rgba(255,140,0,0.6)',
        outlineOffset: '-2px',
      };
    }
    if (value === 3) return { backgroundColor: 'rgba(255,180,171,0.08)' };
    if (value === 1 && !isOpponent) return { backgroundColor: 'rgba(196,202,167,0.15)' };
    return {};
  }

  function getCellContent(value, rowIdx, colIdx) {
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
      const isSunk = sunkCells.has(`${rowIdx}-${colIdx}`);
      return (
        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: isSunk ? 'rgba(255,140,0,0.9)' : 'rgba(255,180,171,0.9)',
            boxShadow: isSunk
              ? '0 0 10px rgba(255,140,0,0.7)'
              : '0 0 10px rgba(255,180,171,0.6)',
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
        {/* Scanline overlay — pointer-events-none so it doesn't swallow mouse events */}
        <div className="scanline-overlay pointer-events-none" />

        {/* Grid */}
        <div
          className="grid h-full w-full"
          style={{
            gridTemplateColumns: 'auto repeat(10, 1fr)',
            gridTemplateRows: 'auto repeat(10, 1fr)',
          }}
        >
          {/* Empty corner */}
          <div />

          {/* Column headers */}
          {cols.map((col) => (
            <div
              key={`col-${col}`}
              className="flex items-center justify-center text-outline"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}
            >
              {col}
            </div>
          ))}

          {/* Rows */}
          {rows.map((row, rowIdx) => (
            <div key={`row-${row}`} className="contents">
              {/* Row label */}
              <div
                className="flex items-center justify-center text-outline"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}
              >
                {row}
              </div>

              {/* Cells */}
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
