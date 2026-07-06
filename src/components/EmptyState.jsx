/**
 * EmptyState — estado vazio padronizado com ícone + mensagem principal + mensagem secundária opcional.
 *
 * Props:
 *   icon     — nome do material symbol (default: 'inbox')
 *   message  — texto principal
 *   hint     — texto secundário opcional
 */
export default function EmptyState({ icon = 'inbox', message, hint }) {
  return (
    <div className="px-4 py-12 text-center">
      <span className="material-symbols-outlined text-4xl text-outline-variant block mb-2">
        {icon}
      </span>
      <p className="text-on-surface-variant text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
        {message}
      </p>
      {hint && (
        <p className="text-on-surface-variant/50 text-xs mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
          {hint}
        </p>
      )}
    </div>
  );
}
