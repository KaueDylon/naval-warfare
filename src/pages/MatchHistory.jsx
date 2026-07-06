import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import PageHeader, { BackToHQButton } from '../components/PageHeader';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

export default function MatchHistory() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    setLoading(true);
    try {
      const data = await api.getMatches();
      setMatches(data || []);
    } catch (err) {
      console.error('Falha ao carregar partidas:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function isVictory(match) {
    return match.victory === true || match.winnerId === user?.id;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader>
        <BackToHQButton />
      </PageHeader>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6">
        <div className="dispatch-border shadow-2xl overflow-hidden">
          {/* Cabeçalho da Tabela */}
          <div
            className="grid grid-cols-[80px_1fr_140px] gap-4 px-4 py-3 border-b-2 border-outline-variant bg-surface-container-high"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Resultado</span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Detalhes da Operação</span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest text-right">Data</span>
          </div>

          {loading ? (
            <LoadingState message="DECIFRANDO REGISTROS..." />
          ) : matches.length === 0 ? (
            <EmptyState
              icon="description"
              message="NENHUMA OPERAÇÃO REGISTRADA"
              hint="Complete missões para construir seu histórico"
            />
          ) : (
            <div className="divide-y divide-outline-variant">
              {matches.map((match, index) => {
                const victory = isVictory(match);
                return (
                  <div
                    key={match.matchId || index}
                    className="grid grid-cols-[80px_1fr_140px] gap-4 px-4 py-4 items-center hover:bg-surface-container-high transition-colors"
                  >
                    {/* Badge de Resultado */}
                    <div
                      className={`text-center py-1.5 border-2 ${
                        victory
                          ? 'border-secondary text-secondary bg-secondary/10'
                          : 'border-error text-error bg-error/10'
                      }`}
                    >
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ fontFamily: 'var(--font-headline)' }}
                      >
                        {victory ? 'VITÓRIA' : 'DERROTA'}
                      </span>
                    </div>

                    {/* Detalhes */}
                    <div style={{ fontFamily: 'var(--font-mono)' }}>
                      <p className="text-on-surface text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-outline">
                          {victory ? 'emoji_events' : 'dangerous'}
                        </span>
                        Missão #{(match.matchId || '').slice(0, 8)}
                      </p>
                    </div>

                    {/* Data */}
                    <div className="text-right">
                      <p className="text-on-surface-variant text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
                        {formatDate(match.playedAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
