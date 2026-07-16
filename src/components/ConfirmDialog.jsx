import { useEffect, useRef } from 'react';

/**
 * ConfirmDialog — modal de confirmação estilizado no padrão militar.
 *
 * Props:
 *   open        — boolean, controla visibilidade
 *   title       — título do diálogo (ex: "ABANDONAR MISSÃO?")
 *   message     — texto descritivo
 *   confirmText — texto do botão de confirmar (default: "CONFIRMAR")
 *   cancelText  — texto do botão de cancelar (default: "CANCELAR")
 *   variant     — 'danger' | 'warning' (default: 'danger')
 *   onConfirm   — callback ao confirmar
 *   onCancel    — callback ao cancelar
 */
export default function ConfirmDialog({
  open,
  title = 'CONFIRMAR AÇÃO',
  message = '',
  confirmText = 'CONFIRMAR',
  cancelText = 'CANCELAR',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);

  // Foca no botão de cancelar ao abrir (segurança: ação destrutiva não é default)
  useEffect(() => {
    if (open) {
      // Pequeno delay para garantir que o DOM renderizou
      setTimeout(() => dialogRef.current?.focus(), 50);
    }
  }, [open]);

  // Fecha com Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === 'Escape') {
        onCancel?.();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-sm bg-surface-container border-2 border-outline shadow-2xl animate-in"
      >
        {/* Corner markers */}
        <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-primary/50"></div>
        <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-primary/50"></div>
        <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-primary/50"></div>
        <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-primary/50"></div>

        {/* Header */}
        <div className={`px-6 py-4 border-b-2 ${isDanger ? 'border-error bg-error/10' : 'border-secondary bg-secondary/10'}`}>
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined text-2xl ${isDanger ? 'text-error' : 'text-secondary'}`}>
              {isDanger ? 'warning' : 'help'}
            </span>
            <h2
              id="confirm-dialog-title"
              className={`text-base stencil-text ${isDanger ? 'text-error' : 'text-secondary'}`}
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {title}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p
            className="text-on-surface text-sm leading-relaxed"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-outline-variant bg-surface-container-high flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="btn-secondary text-xs px-5 py-2.5"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`text-xs px-5 py-2.5 font-bold uppercase tracking-wider border-2 transition-colors ${
              isDanger
                ? 'bg-error/20 border-error text-error hover:bg-error hover:text-on-error'
                : 'bg-secondary/20 border-secondary text-secondary hover:bg-secondary hover:text-on-secondary'
            }`}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
