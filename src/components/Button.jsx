import * as sfx from "../services/sounds";

const VARIANT_CLASSES = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger",
};

/**
 * Botão padrão do design system, com opção de som de clique.
 *
 * Props:
 *   variant   — 'primary' | 'secondary' | 'danger' (default: 'primary')
 *   withSound — toca sfx.playClick() ao clicar (default: false — opt-in,
 *               reservado para ações de decisão: confirmar, criar, entrar,
 *               atacar, se render. Evita ruído em toggles/paginação/hover).
 *   onClick   — handler normal; o som (se ativado) dispara antes dele.
 *
 * Demais props (className, disabled, type, etc.) são repassadas ao <button>.
 */
export default function Button({
  variant = "primary",
  withSound = false,
  onClick,
  className = "",
  children,
  ...rest
}) {
  function handleClick(e) {
    if (withSound) sfx.playClick();
    onClick?.(e);
  }

  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;

  return (
    <button
      onClick={handleClick}
      className={`${variantClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
