/**
 * LoadingState — spinner de carregamento padronizado.
 *
 * Props:
 *   message — texto exibido abaixo do spinner (default: 'CARREGANDO...')
 *   spinner — se true, exibe o spinner animado em vez de apenas texto (default: false)
 */
export default function LoadingState({ message = 'CARREGANDO...', spinner = false }) {
  return (
    <div className="p-10 text-center">
      {spinner && (
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      )}
      <p className="text-on-surface-variant text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
        {message}
      </p>
    </div>
  );
}
