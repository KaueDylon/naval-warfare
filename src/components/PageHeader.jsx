import { useNavigate } from 'react-router-dom';

/**
 * PageHeader — cabeçalho padrão de todas as páginas internas.
 *
 * Props:
 *   children  — botões/ações que aparecem à direita do título
 *   shrink    — adiciona shrink-0 (necessário em flex column como no Game)
 */
export default function PageHeader({ children, shrink = false }) {
  return (
    <header
      className={`sticky top-0 z-50 border-b-2 border-outline-variant px-6 h-16 flex items-center bg-surface-container-lowest${shrink ? ' shrink-0' : ''}`}
    >
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
        <h1
          className="text-xl md:text-2xl stencil-text text-primary"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          PACIFIC.COMMAND
        </h1>
        {children && (
          <div className="flex items-center gap-4">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}

/** Separador vertical entre grupos de botões */
export function HeaderDivider() {
  return <div className="h-8 w-px bg-outline-variant mx-1" />;
}

/** Botão de ícone padrão do header */
export function HeaderIconButton({ icon, title, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 text-secondary hover:bg-surface-container transition-colors ${danger ? 'hover:text-error' : 'hover:text-primary'}`}
    >
      <span className="material-symbols-outlined">{icon}</span>
    </button>
  );
}

/** Botão "Voltar ao QG" padrão de Ranking, MatchHistory */
export function BackToHQButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/')}
      className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors px-3 py-2"
    >
      <span className="material-symbols-outlined text-sm">arrow_back</span>
      <span className="text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
        Voltar ao QG
      </span>
    </button>
  );
}
