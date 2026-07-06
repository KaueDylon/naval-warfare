export default function Board({
  grid,
  onCellClick,
  onCellHover,
  isOpponent,
  disabled,
  title,
  // Setup ghost preview props
  ghostShip = null,   // { size, horizontal }
  hoveredCell = null, // { row, col }
}) {
  const rows = 'ABCDEFGHIJ'.split('');
  const cols = Array.from({ length: 10 }, (_, i) => i + 1);

  // Compute which cells the ghost ship would occupy
  function getGhostCells() {
    if (!ghostShip || !hoveredCell || isOpponent) return new Set();
    const { size, horizontal } = ghostShip;
    const { row, col } = hoveredCell;
    const cells = new Set();
    let valid = true;
    for (let i = 0; i < size; i++) {
      const r = horizontal ? row : row + i;
      const c = horizontal ? col + i : col;
      if (r >= 10 || c >= 10) { valid = false; break; }
      cells.add(`${r}-${c}`);
    }
    return valid ? cells : new Set([`invalid-${row}-${col}`]);
  }

  function isGhostValid() {
    if (!ghostShip || !hoveredCell || isOpponent) return true;
    const { size, horizontal } = ghostShip;
    const { row, col } = hoveredCell;
    for (let i = 0; i < size; i++) {
      const r = horizontal ? row : row + i;
      const c = horizontal ? col + i : col;
      if (r >= 10 || c >= 10) return false;
      if (grid?.[r]?.[c] === 1) return false; // overlaps existing ship
    }
    return true;
  }

  const ghostCells = getGhostCells();
  const ghostValid = isGhostValid();

  function getCellContent(value) {
    if (value === 2) {
      return (
        <span className="material-symbols-outlined text-on-surface-variant/40 text-sm" style={{ fontVariationSettings: "'opsz' 20" }}>
          close
        </span>
      );
    }
    if (value === 3) {
      return (
        <div className="w-3 h-3 bg-error shadow-[0_0_10px_rgba(255,180,171,0.6)]"></div>
      );
    }
    if (value === 1 && !isOpponent) {
      return <div className="w-full h-full bg-primary/20"></div>;
    }
    return null;
  }

  function getCellBg(value, rowIdx, colIdx) {
    const key = `${rowIdx}-${colIdx}`;
    if (ghostCells.has(key)) {
      return ghostValid ? 'bg-secondary/30' : 'bg-error/30';
    }
    if (value === 3) return 'bg-error/10';
    if (value === 1 && !isOpponent) return 'bg-primary/15';
    return '';
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
      <div className="aspect-square bg-surface-container border-2 border-outline relative p-2 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
        {/* Scanline overlay */}
        <div className="scanline-overlay"></div>

        {/* Grid */}
        <div
          className="grid h-full w-full"
          style={{
            gridTemplateColumns: 'auto repeat(10, 1fr)',
            gridTemplateRows: 'auto repeat(10, 1fr)',
          }}
        >
          {/* Empty corner */}
          <div></div>

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
                const value = grid?.[rowIdx]?.[colIdx] ?? 0;
                const canClick = isOpponent && !disabled && (value === 0 || value === 1);
                const isAttacked = value === 2 || value === 3;
                const isGhostCell = ghostCells.has(`${rowIdx}-${colIdx}`);

                return (
                  <div
                    key={`${row}${col}`}
                    className={`
                      border flex items-center justify-center relative transition-colors
                      ${isOpponent ? 'border-secondary/20' : 'border-outline/10'}
                      ${getCellBg(value, rowIdx, colIdx)}
                      ${canClick ? 'cursor-crosshair hover:bg-secondary/20' : ''}
                      ${!isOpponent && ghostShip && !disabled ? 'cursor-crosshair' : ''}
                      ${isGhostCell ? 'z-10' : ''}
                    `}
                    onClick={() => {
                      if (canClick && onCellClick) {
                        onCellClick(rowIdx, colIdx);
                      } else if (!isOpponent && onCellClick && !disabled) {
                        onCellClick(rowIdx, colIdx);
                      }
                    }}
                    onMouseEnter={() => onCellHover && onCellHover(rowIdx, colIdx)}
                  >
                    {getCellContent(value)}
                    {isGhostCell && (
                      <div
                        className={`absolute inset-0 border-2 ${ghostValid ? 'border-secondary/60' : 'border-error/60'}`}
                      />
                    )}
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
