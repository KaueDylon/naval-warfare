/**
 * SectionCard — card de seção padronizado com título stencil.
 *
 * Props:
 *   title          — texto do cabeçalho (pode ser JSX)
 *   children       — conteúdo interno
 *   variant        — 'default' (dispatch-border) | 'danger' (border-error)
 *   className      — classes extras no container
 *   titleClassName — classes extras no título
 */
export default function SectionCard({
  title,
  children,
  variant = 'default',
  className = '',
  titleClassName = '',
}) {
  const containerClass =
    variant === 'danger'
      ? `border-2 border-error p-6 ${className}`
      : `dispatch-border p-6 ${className}`;

  const headingClass =
    variant === 'danger'
      ? `stencil-text text-sm text-error border-b border-error/30 pb-2 mb-4 ${titleClassName}`
      : `stencil-text text-sm text-primary border-b border-outline-variant pb-2 mb-4 ${titleClassName}`;

  return (
    <section className={containerClass}>
      <h2 className={headingClass} style={{ fontFamily: 'var(--font-headline)' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
