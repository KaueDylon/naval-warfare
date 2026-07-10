import { PORTRAIT_IMAGES } from "../constants/nations";

/**
 * Renderiza a imagem do portrait do jogador.
 * Se o portrait não tem imagem mapeada, exibe um placeholder.
 * A caixa mantém o tamanho fixo mesmo sem imagem.
 *
 * @param {string} portrait - ID do portrait (ex: "ITALY_ADMIRAL")
 * @param {"sm"|"md"|"lg"} size - Tamanho responsivo:
 *   - "sm": 48x64 (grid de seleção)
 *   - "md": 64x84 (lista, cards)
 *   - "lg": 100% width, aspect 3/4 (frame principal do perfil)
 * @param {string} className - Classes CSS adicionais
 */
export default function PortraitImage({ portrait, size = "md", className = "" }) {
  const src = portrait ? PORTRAIT_IMAGES[portrait.toUpperCase()] : null;

  const sizeClasses = {
    sm: "w-12 min-h-16",
    md: "w-16 min-h-20",
    lg: "w-full aspect-[3/4]",
  };

  const containerClass = `${sizeClasses[size]} overflow-hidden flex items-center justify-center bg-surface-container-high border border-outline-variant ${className}`;

  if (!src) {
    return (
      <div className={containerClass}>
        <span className={`material-symbols-outlined text-on-surface-variant/40 ${size === "lg" ? "text-7xl" : size === "md" ? "text-3xl" : "text-2xl"}`}>
          person
        </span>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <img
        src={src}
        alt={portrait?.replace(/_/g, " ") || "Portrait"}
        className="w-full h-full object-cover object-top"
        loading="lazy"
      />
    </div>
  );
}
