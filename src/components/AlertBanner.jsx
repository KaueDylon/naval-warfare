/**
 * AlertBanner — banner de feedback padronizado.
 *
 * Props:
 *   type     — 'error' | 'success' | 'form-error' (estilo bege p/ Login/Register)
 *   message  — texto a exibir
 *   onClose  — se fornecido, exibe botão de fechar (usado no Game)
 *   className — classes extras (ex: 'mb-6')
 */
export default function AlertBanner({ type = 'error', message, onClose, className = '' }) {
  if (!message) return null;

  if (type === 'form-error') {
    return (
      <div className={`bg-red-900/10 border border-red-700 p-3 ${className}`}>
        <p className="text-red-700 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
          {message}
        </p>
      </div>
    );
  }

  if (type === 'game-error') {
    return (
      <div className={`bg-error/10 border-b border-error px-4 py-2 flex items-center justify-between shrink-0 ${className}`}>
        <p className="text-error text-xs" style={{ fontFamily: 'var(--font-mono)' }}>{message}</p>
        {onClose && (
          <button onClick={onClose} className="text-error">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>
    );
  }

  if (type === 'success') {
    return (
      <div className={`border-2 border-primary bg-primary/10 p-3 ${className}`}>
        <p className="text-primary text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
          ✓ {message}
        </p>
      </div>
    );
  }

  // default: 'error'
  return (
    <div className={`border-2 border-error bg-error/10 p-3 ${className}`}>
      <p className="text-error text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
        ✗ {message}
      </p>
    </div>
  );
}
