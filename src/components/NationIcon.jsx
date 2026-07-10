import { NATION_ICONS } from "../constants/nations";

/**
 * Renderiza o ícone SVG da nação.
 * @param {string} nation - Código da nação (USA, UK, USSR, GERMANY, JAPAN, ITALY)
 * @param {string} className - Classes CSS adicionais
 * @param {number|string} size - Tamanho em px (padrão: 32)
 */
export default function NationIcon({ nation, className = "", size = 32 }) {
  const src = NATION_ICONS[nation];
  if (!src) return null;

  return (
    <img
      src={src}
      alt={`${nation} icon`}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
