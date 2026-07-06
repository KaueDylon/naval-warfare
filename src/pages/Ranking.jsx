import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

export default function Ranking() {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState([]);
  const [myRanking, setMyRanking] = useState(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    loadRankings();
    loadMyRanking();
  }, [offset]);

  async function loadRankings() {
    setLoading(true);
    try {
      const data = await api.getRanking(limit, offset);
      setRankings(data || []);
    } catch (err) {
      console.error('Failed to load rankings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMyRanking() {
    try {
      const data = await api.getMyRanking();
      setMyRanking(data);
    } catch (err) {
      console.error('Failed to load my ranking:', err);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-outline-variant px-6 h-16 flex items-center bg-surface-container-lowest">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <h1
            className="text-xl stencil-text text-primary"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            COMMAND HIERARCHY
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

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-6">
        {/* My Position Card */}
        {myRanking !== null && myRanking !== -1 && (
          <div className="dispatch-border p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 border-2 border-secondary flex items-center justify-center bg-secondary/10">
                <span className="material-symbols-outlined text-secondary text-3xl">military_tech</span>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
                  Your Global Position
                </p>
                <p className="text-3xl text-secondary font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                  #{typeof myRanking === 'number' ? myRanking : myRanking.position ?? '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {myRanking === -1 && (
          <div className="dispatch-border p-4 text-center">
            <p className="text-on-surface-variant text-xs uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
              NOT YET RANKED — MINIMUM 5 MISSIONS REQUIRED
            </p>
          </div>
        )}

        {/* Rankings Table */}
        <div className="dispatch-border overflow-hidden shadow-2xl">
          {/* Table Header */}
          <div
            className="grid grid-cols-[50px_1fr_80px_60px_60px_70px] gap-2 px-4 py-3 border-b-2 border-outline-variant bg-surface-container-high"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">#</span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Commander</span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Nation</span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest text-center">W</span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest text-center">L</span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest text-right">Rate</span>
          </div>

          {/* Body */}
          {loading ? (
            <div className="p-10 text-center">
              <p className="text-on-surface-variant text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                LOADING INTELLIGENCE...
              </p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="p-10 text-center">
              <span className="material-symbols-outlined text-4xl text-outline-variant block mb-2">leaderboard</span>
              <p className="text-on-surface-variant text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                NO RECORDS FOUND
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {rankings.map((player, index) => {
                const rank = offset + index + 1;
                return (
                  <div
                    key={player.playerId || index}
                    className="grid grid-cols-[50px_1fr_80px_60px_60px_70px] gap-2 px-4 py-3 items-center hover:bg-surface-container-high transition-colors"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    <span className={`text-sm font-bold ${rank <= 3 ? 'text-secondary' : 'text-on-surface-variant'}`}>
                      {rank <= 3 ? '★' : ''}{rank}
                    </span>
                    <span className="text-on-surface text-sm truncate">
                      {player.name}
                    </span>
                    <span className="text-primary text-xs">
                      {player.nation || '—'}
                    </span>
                    <span className="text-secondary text-sm text-center">
                      {player.wins ?? 0}
                    </span>
                    <span className="text-error text-sm text-center">
                      {player.losses ?? 0}
                    </span>
                    <span className="text-on-surface text-sm text-right font-bold">
                      {player.winrate != null ? `${player.winrate.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="border-t-2 border-outline-variant px-4 py-3 flex items-center justify-between bg-surface-container-high">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="btn-secondary text-xs px-3 py-1 disabled:opacity-30"
            >
              ← PREV
            </button>
            <span className="text-xs text-on-surface-variant" style={{ fontFamily: 'var(--font-mono)' }}>
              {offset + 1}—{offset + rankings.length}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={rankings.length < limit}
              className="btn-secondary text-xs px-3 py-1 disabled:opacity-30"
            >
              NEXT →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
