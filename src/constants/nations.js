/**
 * Fonte única de verdade para dados de nações.
 * Importe daqui em qualquer lugar que precise de labels, flags ou descrições.
 */

export const NATION_LABELS = {
  USA: "Estados Unidos",
  UK: "Reino Unido",
  USSR: "União Soviética",
  GERMANY: "Alemanha",
  JAPAN: "Japão",
  ITALY: "Itália",
};

export const NATION_FLAGS = {
  USA: "🇺🇸",
  UK: "🇬🇧",
  USSR: "☭",
  GERMANY: "🇩🇪",
  JAPAN: "🇯🇵",
  ITALY: "🇮🇹",
};

export const NATION_ICONS = {
  USA: "/icons/nations/usa.svg",
  UK: "/icons/nations/uk.svg",
  USSR: "/icons/nations/ussr.svg",
  GERMANY: "/icons/nations/germany.svg",
  JAPAN: "/icons/nations/japan.svg",
  ITALY: "/icons/nations/italy.svg",
};

export const NATION_ICONS_DARK = {
  USA: "/icons/nations/usa.svg",
  UK: "/icons/nations/uk.svg",
  USSR: "/icons/nations/ussr.svg",
  GERMANY: "/icons/nations/germany-dark.svg",
  JAPAN: "/icons/nations/japan.svg",
  ITALY: "/icons/nations/italy-dark.svg",
};

export const NATION_PORTRAITS = {
  USA: ["USA_GENERAL", "USA_ADMIRAL", "USA_PILOT"],
  UK: ["UK_GENERAL", "UK_ADMIRAL", "UK_PILOT"],
  USSR: ["USSR_GENERAL", "USSR_ADMIRAL", "USSR_PILOT"],
  GERMANY: ["GERMANY_GENERAL", "GERMANY_ADMIRAL", "GERMANY_PILOT"],
  JAPAN: ["JAPAN_GENERAL", "JAPAN_ADMIRAL", "JAPAN_PILOT"],
  ITALY: ["ITALY_GENERAL", "ITALY_ADMIRAL", "ITALY_PILOT"],
};

/**
 * Mapeamento de portrait ID → caminho da imagem.
 * Portraits sem imagem retornam null (usa placeholder).
 */
export const PORTRAIT_IMAGES = {
  ITALY_ADMIRAL: "/portraits/italy-admiral.webp",
  ITALY_PILOT: "/portraits/italy-pilot.webp",
  ITALY_GENERAL: "/portraits/italy-general.webp",
  USA_ADMIRAL: "/portraits/eua-admiral.png",
  USA_PILOT: "/portraits/eua-pilot.png",
  USA_GENERAL: "/portraits/eua-general.png",
  UK_ADMIRAL: "/portraits/uk-admiral.png",
  UK_PILOT: "/portraits/uk-pilot.png",
  UK_GENERAL: "/portraits/uk-general.png",
};

export const NATIONS = [
  {
    id: "USA",
    flag: NATION_FLAGS.USA,
    label: NATION_LABELS.USA,
    description:
      "Em 1941, os EUA abandonam o isolacionismo após Pearl Harbor e mobilizam a maior máquina industrial para a guerra.",
  },
  {
    id: "UK",
    flag: NATION_FLAGS.UK,
    label: NATION_LABELS.UK,
    description:
      "Sozinha contra o Eixo desde 1940, a Royal Navy defende as rotas do Atlântico enquanto resiste aos bombardeios da Blitz.",
  },
  {
    id: "USSR",
    flag: NATION_FLAGS.USSR,
    label: NATION_LABELS.USSR,
    description:
      "Invadida pela Operação Barbarossa em junho de 1941, a URSS enfrenta a maior ofensiva terrestre da história.",
  },
  {
    id: "GERMANY",
    flag: NATION_FLAGS.GERMANY,
    label: NATION_LABELS.GERMANY,
    description:
      "A Kriegsmarine e seus U-Boots dominam o Atlântico Norte, estrangulando as linhas de suprimento aliadas.",
  },
  {
    id: "JAPAN",
    flag: NATION_FLAGS.JAPAN,
    label: NATION_LABELS.JAPAN,
    description:
      "O Império Japonês expande seu domínio pelo Pacífico com ataques devastadores a Pearl Harbor, Filipinas e Papua.",
  },
  {
    id: "ITALY",
    flag: NATION_FLAGS.ITALY,
    label: NATION_LABELS.ITALY,
    description:
      "A Regia Marina disputa o controle do Mediterrâneo contra a Royal Navy, protegendo suas rotas para o Norte da África.",
  },
];
