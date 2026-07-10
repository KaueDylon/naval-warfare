import { NATION_ICONS, NATION_ICONS_DARK } from "../constants/nations";

/**
 * Renderiza o ícone SVG da nação.
 * @param {string} nation - Código da nação (USA, UK, USSR, GERMANY, JAPAN, ITALY)
 * @param {string} className - Classes CSS adicionais
 * @param {number|string} size - Tamanho em px (padrão: 32)
 * @param {"light"|"dark"|"default"} variant - Variante de cor:
 *   - "default": cor original do SVG (para fundos escuros)
 *   - "dark": versão escura para fundos claros
 *   - "light": clareia para melhor visibilidade em fundos escuros
 */
export default function NationIcon({ nation, className = "", size = 32, variant = "default" }) {
  // Seleciona o SVG correto baseado na variante
  const icons = variant === "dark" ? NATION_ICONS_DARK : NATION_ICONS;
  const src = icons[nation];
  if (!src) return null;

  // Para "dark", ícones que não têm versão _dark dedicada (USA, UK, USSR, JAPAN)
  // usam filtro brightness(0) para ficar preto nítido
  const hasDarkVariant = nation === "GERMANY" || nation === "ITALY";

  let filterStyle = {};
  if (variant === "dark" && !hasDarkVariant) {
    filterStyle = { filter: "brightness(0)" };
  } else if (variant === "light") {
    filterStyle = { filter: "brightness(1.3) saturate(0.8)" };
  }

  return (
    <img
      src={src}
      alt={`${nation} icon`}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size, ...filterStyle }}
    />
  );
}
