/**
 * Mapeamento de sprites visuais de navios por nação, classe e orientação.
 *
 * Estrutura: SHIP_SPRITES[NATION][SHIP_TYPE] → { h: "horizontal.png", v: "vertical.png" }
 *
 * Convenção de arquivos: /ships/{nacao}/{classe}-h.png e /ships/{nacao}/{classe}-v.png
 *
 * Para adicionar um novo navio:
 * 1. Coloque as duas imagens (horizontal e vertical) em public/ships/{nacao}/
 * 2. Adicione a entrada aqui no mapeamento
 */
export const SHIP_SPRITES = {
  USA: {
    BATTLESHIP: {
      h: "/ships/usa/encouracado-eua-horizontal.png",
      v: "/ships/usa/encouracado-eua-vertical.png",
    },
    // CARRIER: { h: "/ships/usa/carrier-h.png", v: "/ships/usa/carrier-v.png" },
    // CRUISER: { h: "/ships/usa/cruiser-h.png", v: "/ships/usa/cruiser-v.png" },
    // SUBMARINE: { h: "/ships/usa/submarine-h.png", v: "/ships/usa/submarine-v.png" },
    // DESTROYER: { h: "/ships/usa/destroyer-h.png", v: "/ships/usa/destroyer-v.png" },
  },
  // UK: {},
  // USSR: {},
  // GERMANY: {},
  // JAPAN: {},
  // ITALY: {},
};

/**
 * Tamanho de cada classe de navio (em células).
 */
export const SHIP_SIZES = {
  CARRIER: 5,
  BATTLESHIP: 4,
  CRUISER: 3,
  SUBMARINE: 3,
  DESTROYER: 2,
};

/**
 * Retorna o caminho do sprite para uma nação, tipo e orientação.
 * @param {string} nation - Código da nação (ex: "USA")
 * @param {string} shipType - Tipo do navio (ex: "BATTLESHIP")
 * @param {boolean} horizontal - true para horizontal, false para vertical
 * @returns {string|null} Caminho da imagem ou null se não existir
 */
export function getShipSprite(nation, shipType, horizontal = true) {
  const entry = SHIP_SPRITES[nation]?.[shipType];
  if (!entry) return null;
  return horizontal ? entry.h : entry.v;
}
