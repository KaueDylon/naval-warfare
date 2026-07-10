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
    CARRIER: {
      h: "/ships/usa/porta-aviao-eua-horizontal.png",
      v: "/ships/usa/porta-aviao-eua-vertical.png",
    },
    BATTLESHIP: {
      h: "/ships/usa/encouracado-eua-horizontal.png",
      v: "/ships/usa/encouracado-eua-vertical.png",
    },
    CRUISER: {
      h: "/ships/usa/cruzador-eua-horizontal.png",
      v: "/ships/usa/cruzador-eua-vertical.png",
    },
    SUBMARINE: {
      h: "/ships/usa/submarino-eua-horizontal.png",
      v: "/ships/usa/submarino-eua-vertical.png",
    },
    DESTROYER: {
      h: "/ships/usa/destroyer-eua-horizontal.png",
      v: "/ships/usa/destroyer-eua-vertical.png",
    },
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
