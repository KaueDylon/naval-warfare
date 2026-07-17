import { SHIP_SIZES } from "../constants/ships";

/** Cria uma matriz 10x10 zerada (água). */
export function createEmptyGrid() {
  return Array.from({ length: 10 }, () => Array(10).fill(0));
}

/**
 * Reconstrói o Set de sunkCells a partir de um board e seus shipTypes.
 * Agrupa células com valor 3 que possuem shipType, verifica se o grupo
 * tem o tamanho esperado do navio (= navio completamente afundado).
 */
export function buildSunkCells(board, shipTypes) {
  const sunk = new Set();
  const processed = new Set();
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const key = `${r}-${c}`;
      if (processed.has(key)) continue;
      if (board[r][c] !== 3) continue;
      const type = shipTypes.get(key);
      if (!type) continue;

      const expectedSize = SHIP_SIZES[type] || 1;

      // Tentar horizontal
      const hCells = [[r, c]];
      for (let cc = c + 1; cc < 10 && board[r][cc] === 3 && shipTypes.get(`${r}-${cc}`) === type; cc++) {
        hCells.push([r, cc]);
      }

      // Tentar vertical
      const vCells = [[r, c]];
      for (let rr = r + 1; rr < 10 && board[rr][c] === 3 && shipTypes.get(`${rr}-${c}`) === type; rr++) {
        vCells.push([rr, c]);
      }

      let shipCells = null;
      if (hCells.length === expectedSize) {
        shipCells = hCells;
      } else if (vCells.length === expectedSize) {
        shipCells = vCells;
      }

      if (shipCells) {
        shipCells.forEach(([sr, sc]) => {
          const sk = `${sr}-${sc}`;
          sunk.add(sk);
          processed.add(sk);
        });
      } else {
        processed.add(key);
      }
    }
  }
  return sunk;
}

/**
 * Conta navios afundados via sunkCells (cada grupo conectado = 1 navio),
 * usando flood-fill (4-direções) sobre o Set de células.
 */
export function countSunkShips(sunkCells) {
  if (!sunkCells || sunkCells.size === 0) return 0;
  const visited = new Set();
  let count = 0;
  for (const key of sunkCells) {
    if (visited.has(key)) continue;
    count++;
    const [startR, startC] = key.split("-").map(Number);
    const stack = [[startR, startC]];
    while (stack.length) {
      const [r, c] = stack.pop();
      const k = `${r}-${c}`;
      if (visited.has(k)) continue;
      visited.add(k);
      if (sunkCells.has(k)) {
        [
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1],
        ].forEach(([nr, nc]) => {
          if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10) stack.push([nr, nc]);
        });
      }
    }
  }
  return count;
}

/**
 * Determina as células ocupadas por um navio afundado a partir de uma célula
 * de impacto conhecida, usando o tamanho esperado do navio como limite.
 * Usado ao processar o resultado de um ataque (SUNK) no board do oponente,
 * onde só uma célula "value === 3" acabou de ser marcada e as demais já
 * existiam no grid a partir de HITs anteriores.
 */
export function resolveSunkShipCells(grid, row, col, shipType) {
  const expectedSize = SHIP_SIZES[shipType] || 1;

  // Coletar cells contíguas com valor 3 na mesma LINHA
  const hCells = [[row, col]];
  for (let c = col - 1; c >= 0 && grid[row][c] === 3; c--) hCells.unshift([row, c]);
  for (let c = col + 1; c < 10 && grid[row][c] === 3; c++) hCells.push([row, c]);

  // Coletar cells contíguas com valor 3 na mesma COLUNA
  const vCells = [[row, col]];
  for (let r = row - 1; r >= 0 && grid[r][col] === 3; r--) vCells.unshift([r, col]);
  for (let r = row + 1; r < 10 && grid[r][col] === 3; r++) vCells.push([r, col]);

  if (expectedSize === 1) return [[row, col]];
  if (hCells.length === expectedSize) return hCells;
  if (vCells.length === expectedSize) return vCells;

  if (hCells.length > expectedSize) {
    // Ambiguidade: mais cells que o esperado. Usar segmento centrado no hit.
    const idx = hCells.findIndex(([r, c]) => r === row && c === col);
    const start = Math.max(0, Math.min(idx, hCells.length - expectedSize));
    return hCells.slice(start, start + expectedSize);
  }
  if (vCells.length > expectedSize) {
    const idx = vCells.findIndex(([r, c]) => r === row && c === col);
    const start = Math.max(0, Math.min(idx, vCells.length - expectedSize));
    return vCells.slice(start, start + expectedSize);
  }

  // Nenhum match exato — pegar a direção com mais cells
  return hCells.length >= vCells.length ? hCells : vCells;
}

/**
 * Flood-fill simples para encontrar todas as células conectadas com
 * valor 3 a partir de uma origem — usado no board próprio (onde não
 * temos shipType/tamanho esperado do lado de quem foi atacado).
 */
export function floodFillHitCells(grid, row, col) {
  const found = new Set();
  const visited = new Set();
  const stack = [[row, col]];
  while (stack.length) {
    const [r, c] = stack.pop();
    const key = `${r}-${c}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if ((grid[r]?.[c] ?? 0) === 3) {
      found.add(key);
      [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
      ].forEach(([nr, nc]) => {
        if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10) stack.push([nr, nc]);
      });
    }
  }
  return found;
}
