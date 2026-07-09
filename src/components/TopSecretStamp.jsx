/**
 * Carimbo "TOP SECRET" estilo militar.
 *
 * Variantes:
 *  - "default"  → canto superior direito do card, borda grossa, texto médio (Login, Register)
 *  - "default"  + size="sm" → mesma posição, texto menor e padding reduzido (SelectNation)
 *  - "mini"     → embutido em elementos menores (ex: retrato no Profile), borda fina, fundo semitransparente
 *
 * O elemento pai precisa ter `position: relative`.
 */
export default function TopSecretStamp({ variant = 'default', size = 'md', className = '' }) {
  if (variant === 'mini') {
    return (
      <div
        className={`absolute top-3 right-[-10px] rotate-[-15deg] border-2 border-error px-2 py-0.5 bg-error/10 ${className}`}
      >
        <span
          className="text-error text-[0.6rem] font-bold uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          TOP SECRET
        </span>
      </div>
    );
  }

  const sizeClasses =
    size === 'sm'
      ? 'top-3 right-4 border-4 border-red-700/50 px-3 py-1'
      : 'top-4 right-4 border-4 border-red-700/50 px-4 py-2';

  const textClasses = size === 'sm' ? 'text-xs' : 'text-lg';

  return (
    <div className={`absolute rotate-[-6deg] ${sizeClasses} ${className}`}>
      <span
        className={`text-red-700/50 font-bold tracking-widest ${textClasses}`}
        style={{ fontFamily: 'var(--font-headline)' }}
      >
        TOP SECRET
      </span>
    </div>
  );
}
