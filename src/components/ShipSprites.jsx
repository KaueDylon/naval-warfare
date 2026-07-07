/**
 * ShipSprites — SVG sprites para cada tipo de navio.
 * Renderiza o sprite correto sobre as células de um navio afundado,
 * revelando visualmente o tipo da embarcação destruída.
 */

// Cores por tipo de navio
const SHIP_COLORS = {
  carrier: { fill: '#8B9A6B', stroke: '#5C6B3E', accent: '#A4B37A' },
  battleship: { fill: '#7A8899', stroke: '#4A5A6B', accent: '#9AACBF' },
  cruiser: { fill: '#9A8B7A', stroke: '#6B5C4A', accent: '#BFA894' },
  submarine: { fill: '#6B7A6B', stroke: '#3E4A3E', accent: '#8A9A8A' },
  destroyer: { fill: '#8A7A6B', stroke: '#5A4A3E', accent: '#A89A8A' },
};

// Nomes exibidos
const SHIP_NAMES = {
  carrier: 'PORTA-AVIÕES',
  battleship: 'ENCOURAÇADO',
  cruiser: 'CRUZADOR',
  submarine: 'SUBMARINO',
  destroyer: 'DESTROYER',
};

/**
 * Componente individual de célula de navio afundado.
 */
export function ShipCellSprite({ shipType, cellIndex, totalCells, horizontal }) {
  const colors = SHIP_COLORS[shipType] || SHIP_COLORS.destroyer;
  const isFirst = cellIndex === 0;
  const isLast = cellIndex === totalCells - 1;
  const isMid = !isFirst && !isLast;

  const rotation = horizontal ? 0 : 90;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none ship-sprite-reveal"
      style={{ zIndex: 6 }}
    >
      <svg
        viewBox="0 0 32 32"
        className="w-full h-full"
        style={{
          transform: `rotate(${rotation}deg)`,
          opacity: 0.85,
        }}
      >
        {isFirst && <BowSegment colors={colors} shipType={shipType} />}
        {isMid && <MidSegment colors={colors} shipType={shipType} />}
        {isLast && <SternSegment colors={colors} shipType={shipType} />}
        {/* Para navios de tamanho 2, primeira célula é proa e última é popa */}
        {totalCells === 2 && isFirst && null}
        <DamageOverlay />
      </svg>
    </div>
  );
}

function BowSegment({ colors, shipType }) {
  return (
    <g>
      <rect x="4" y="10" width="28" height="12" rx="1" fill={colors.fill} stroke={colors.stroke} strokeWidth="1.5" />
      <polygon points="4,16 0,12 0,20" fill={colors.fill} stroke={colors.stroke} strokeWidth="1" />
      <line x1="6" y1="14" x2="30" y2="14" stroke={colors.accent} strokeWidth="0.5" opacity="0.6" />
      <line x1="6" y1="18" x2="30" y2="18" stroke={colors.accent} strokeWidth="0.5" opacity="0.6" />
      {shipType === 'carrier' && (
        <rect x="10" y="11" width="18" height="2" fill={colors.accent} opacity="0.5" rx="0.5" />
      )}
      {shipType === 'submarine' && (
        <circle cx="8" cy="16" r="2.5" fill="none" stroke={colors.accent} strokeWidth="0.8" opacity="0.7" />
      )}
      {shipType === 'destroyer' && (
        <rect x="6" y="14.5" width="6" height="3" fill={colors.stroke} rx="1" opacity="0.7" />
      )}
    </g>
  );
}

function MidSegment({ colors, shipType }) {
  return (
    <g>
      <rect x="0" y="10" width="32" height="12" fill={colors.fill} stroke={colors.stroke} strokeWidth="1.5" />
      <line x1="0" y1="14" x2="32" y2="14" stroke={colors.accent} strokeWidth="0.5" opacity="0.6" />
      <line x1="0" y1="18" x2="32" y2="18" stroke={colors.accent} strokeWidth="0.5" opacity="0.6" />
      {shipType === 'carrier' && (
        <>
          <rect x="2" y="11" width="28" height="2" fill={colors.accent} opacity="0.5" rx="0.5" />
          <rect x="8" y="20" width="4" height="2" fill={colors.stroke} rx="0.5" />
          <rect x="20" y="20" width="4" height="2" fill={colors.stroke} rx="0.5" />
        </>
      )}
      {shipType === 'battleship' && (
        <>
          <circle cx="10" cy="16" r="3" fill={colors.stroke} opacity="0.6" />
          <circle cx="22" cy="16" r="3" fill={colors.stroke} opacity="0.6" />
        </>
      )}
      {shipType === 'cruiser' && (
        <rect x="12" y="13" width="8" height="6" fill={colors.stroke} rx="1" opacity="0.5" />
      )}
      {shipType === 'submarine' && (
        <>
          <ellipse cx="16" cy="16" rx="6" ry="4" fill={colors.stroke} opacity="0.3" />
          <circle cx="16" cy="16" r="1.5" fill={colors.accent} opacity="0.7" />
        </>
      )}
      {shipType === 'destroyer' && (
        <rect x="12" y="14" width="8" height="4" fill={colors.stroke} rx="1" opacity="0.5" />
      )}
    </g>
  );
}

function SternSegment({ colors, shipType }) {
  return (
    <g>
      <rect x="0" y="10" width="28" height="12" rx="1" fill={colors.fill} stroke={colors.stroke} strokeWidth="1.5" />
      <rect x="26" y="11" width="6" height="10" fill={colors.fill} stroke={colors.stroke} strokeWidth="1" rx="2" />
      <line x1="0" y1="14" x2="26" y2="14" stroke={colors.accent} strokeWidth="0.5" opacity="0.6" />
      <line x1="0" y1="18" x2="26" y2="18" stroke={colors.accent} strokeWidth="0.5" opacity="0.6" />
      {shipType === 'carrier' && (
        <rect x="2" y="11" width="22" height="2" fill={colors.accent} opacity="0.5" rx="0.5" />
      )}
      {shipType === 'battleship' && (
        <circle cx="14" cy="16" r="3" fill={colors.stroke} opacity="0.6" />
      )}
      {shipType === 'submarine' && (
        <>
          <ellipse cx="24" cy="16" rx="4" ry="3" fill={colors.stroke} opacity="0.3" />
          <line x1="28" y1="13" x2="31" y2="11" stroke={colors.accent} strokeWidth="0.8" opacity="0.6" />
          <line x1="28" y1="19" x2="31" y2="21" stroke={colors.accent} strokeWidth="0.8" opacity="0.6" />
        </>
      )}
    </g>
  );
}

function DamageOverlay() {
  return (
    <g opacity="0.7">
      <circle cx="16" cy="12" r="3" fill="#333" opacity="0.3" />
      <circle cx="14" cy="10" r="2" fill="#444" opacity="0.2" />
      <circle cx="16" cy="16" r="4" fill="rgba(255,140,0,0.4)" />
      <circle cx="16" cy="16" r="2" fill="rgba(255,80,0,0.5)" />
      <circle cx="18" cy="14" r="1" fill="rgba(255,220,100,0.8)" />
    </g>
  );
}

/**
 * Label do tipo do navio exibido na célula central.
 */
export function ShipTypeLabel({ shipType }) {
  const name = SHIP_NAMES[shipType] || 'NAVIO';
  const colors = SHIP_COLORS[shipType] || SHIP_COLORS.destroyer;

  return (
    <div
      className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-20 ship-label-reveal"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <span
        className="text-[8px] px-1 py-0.5 border uppercase tracking-wider font-bold"
        style={{
          backgroundColor: 'rgba(23,19,5,0.9)',
          color: colors.accent,
          borderColor: colors.stroke,
        }}
      >
        {name}
      </span>
    </div>
  );
}

/**
 * Detecta navios afundados usando o mapa de tipos do backend.
 * @param {Set} sunkCells - Set de "row-col" com células afundadas
 * @param {Map} shipTypesMap - Map de "row-col" → "CARRIER" etc. (vindo do backend)
 * @returns {Array} navios: { cells, size, shipType, horizontal }
 */
export function detectSunkShipsWithTypes(sunkCells, shipTypesMap = new Map()) {
  if (!sunkCells || sunkCells.size === 0) return [];

  const visited = new Set();
  const ships = [];

  for (const key of sunkCells) {
    if (visited.has(key)) continue;

    const [startR, startC] = key.split('-').map(Number);
    const cells = [];
    const stack = [[startR, startC]];
    let detectedType = null;

    while (stack.length) {
      const [r, c] = stack.pop();
      const k = `${r}-${c}`;
      if (visited.has(k)) continue;
      if (!sunkCells.has(k)) continue;
      visited.add(k);
      cells.push({ row: r, col: c });

      // Pegar o tipo do backend se disponível
      if (!detectedType && shipTypesMap.has(k)) {
        detectedType = shipTypesMap.get(k);
      }

      [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([nr, nc]) => {
        if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10) {
          stack.push([nr, nc]);
        }
      });
    }

    // Determinar orientação
    const rows = cells.map(c => c.row);
    const horizontal = new Set(rows).size === 1;

    // Ordenar células
    if (horizontal) {
      cells.sort((a, b) => a.col - b.col);
    } else {
      cells.sort((a, b) => a.row - b.row);
    }

    // Determinar tipo: prioridade ao backend, fallback por tamanho
    const size = cells.length;
    let shipType;
    if (detectedType) {
      shipType = detectedType.toLowerCase();
    } else {
      switch (size) {
        case 5: shipType = 'carrier'; break;
        case 4: shipType = 'battleship'; break;
        case 3: shipType = 'cruiser'; break;
        case 2: shipType = 'destroyer'; break;
        default: shipType = 'destroyer'; break;
      }
    }

    ships.push({ cells, size, shipType, horizontal });
  }

  return ships;
}
