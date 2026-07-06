import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

export default function MatchHistory() {
  const navigate = useNavigate();
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
      console.error('Failed to load matches:', err);
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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-outline-variant px-6 h-16 flex items-center bg-surface-container-lowest">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <h1
            className="text-xl stencil-text text-primary"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            OPERATION RECORDS
          </h1>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors px-3 py-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span className="text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
              Return to HQ
            </span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6">
        <div className="dispatch-border shadow-2xl overflow-hidden">
          {/* Table Header */}
          <div
            className="grid grid-cols-[80px_1fr_140px] gap-4 px-4 py-3 border-b-2 border-outline-variant bg-surface-container-high"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Result</span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Operation Details</span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest text-right">Date</span>
          </div>

          {loading ? (
            <div className="p-10 text-center">
              <p className="text-on-surface-variant text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                DECRYPTING RECORDS...
              </p>
            </div>
          ) : matches.length === 0 ? (
            <div className="p-10 text-center">
              <span className="material-symbols-outlined text-4xl text-outline-variant block mb-2">description</span>
              <p className="text-on-surface-variant text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                NO OPERATIONS ON RECORD
              </p>
              <p className="text-on-surface-variant/50 text-xs mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                Complete missions to build your service record
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {matches.map((match, index) => {
                const victory = isVictory(match);
                return (
                  <div
                    key={match.matchId || index}
                    className="grid grid-cols-[80px_1fr_140px] gap-4 px-4 py-4 items-center hover:bg-surface-container-high transition-colors"
                  >
                    {/* Result Badge */}
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
                        {victory ? 'VICTORY' : 'DEFEAT'}
                      </span>
                    </div>

                    {/* Match Details */}
                    <div style={{ fontFamily: 'var(--font-mono)' }}>
                      <p className="text-on-surface text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-outline">
                          {victory ? 'emoji_events' : 'dangerous'}
                        </span>
                        Mission #{(match.matchId || '').slice(0, 8)}
                      </p>
                    </div>

                    {/* Date */}
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
