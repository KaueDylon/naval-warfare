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
  USA: "/US-Army-Star.svg",
  UK: "/gov-uk.svg",
  USSR: "/Soviet_Hammer_and_Sickle__1923-1924__gold__svg.svg",
  GERMANY: "/Balkenkreuz_svg.svg",
  JAPAN: "/sol-nascente-japones.svg",
  ITALY: "/italia.svg",
};

export const NATION_ICONS_DARK = {
  USA: "/US-Army-Star.svg",
  UK: "/gov-uk.svg",
  USSR: "/Soviet_Hammer_and_Sickle__1923-1924__gold__svg.svg",
  GERMANY: "/Balkenkreuz_dark.svg",
  JAPAN: "/sol-nascente-japones.svg",
  ITALY: "/italia_dark.svg",
};

export const NATION_PORTRAITS = {
  USA: ["USA_GENERAL", "USA_ADMIRAL", "USA_PILOT"],
  UK: ["UK_GENERAL", "UK_ADMIRAL", "UK_PILOT"],
  USSR: ["USSR_GENERAL", "USSR_ADMIRAL", "USSR_PILOT"],
  GERMANY: ["GERMANY_GENERAL", "GERMANY_ADMIRAL", "GERMANY_PILOT"],
  JAPAN: ["JAPAN_GENERAL", "JAPAN_ADMIRAL", "JAPAN_PILOT"],
  ITALY: ["ITALY_GENERAL", "ITALY_ADMIRAL", "ITALY_PILOT"],
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
