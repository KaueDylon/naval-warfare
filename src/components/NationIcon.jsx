import { NATION_ICONS } from "../constants/nations";

/**
 * Renderiza o ícone SVG da nação.
 * @param {string} nation - Código da nação (USA, UK, USSR, GERMANY, JAPAN, ITALY)
 * @param {string} className - Classes CSS adicionais
 * @param {number|string} size - Tamanho em px (padrão: 32)
 * @param {"light"|"dark"|"default"} variant - Variante de cor:
 *   - "default": cor original do SVG (para fundos escuros)
 *   - "dark": escurece para uso em fundos claros
 *   - "light": clareia para melhor visibilidade em fundos escuros
 */
export default function NationIcon({ nation, className = "", size = 32, variant = "default" }) {
  const src = NATION_ICONS[nation];
  if (!src) return null;

  // Ícones multi-camada (Alemanha e Itália) precisam de filtro diferente
  // para manter contraste entre as camadas
  const multiLayer = nation === "GERMANY" || nation === "ITALY";

  let filterStyle = {};
  if (variant === "dark") {
    filterStyle = multiLayer
      ? { filter: "brightness(0.2) contrast(1.5)" }
      : { filter: "brightness(0) saturate(100%)" };
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
