import { useState, useEffect } from "react";
import * as api from "../services/api";
import PageHeader, { BackToHQButton } from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { NATION_FLAGS, NATION_LABELS } from "../constants/nations";

export default function Ranking() {
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
      console.error("Falha ao carregar ranking:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMyRanking() {
    try {
      const data = await api.getMyRanking();
      setMyRanking(data);
    } catch (err) {
      console.error("Falha ao carregar minha posição:", err);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader>
        <BackToHQButton />
      </PageHeader>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-6">
        {/* Minha Posição */}
        {myRanking !== null && myRanking !== -1 && (
          <div className="dispatch-border p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 border-2 border-secondary flex items-center justify-center bg-secondary/10">
                <span className="material-symbols-outlined text-secondary text-3xl">
                  military_tech
                </span>
              </div>
              <div>
                <p
                  className="text-[10px] text-on-surface-variant uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Sua Posição Global
                </p>
                <p
                  className="text-3xl text-secondary font-bold"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  #
                  {typeof myRanking === "number"
                    ? myRanking
                    : (myRanking.position ?? "—")}
                </p>
              </div>
            </div>
          </div>
        )}

        {myRanking === -1 && (
          <div className="dispatch-border p-4 text-center">
            <p
              className="text-on-surface-variant text-xs uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              SEM CLASSIFICAÇÃO — MÍNIMO DE 5 MISSÕES NECESSÁRIO
            </p>
          </div>
        )}

        {/* Tabela de Ranking */}
        <div className="dispatch-border overflow-hidden shadow-2xl">
          {/* Cabeçalho */}
          <div
            className="hidden sm:grid grid-cols-[40px_1fr_70px_50px_50px_65px] gap-2 px-4 py-3 border-b-2 border-outline-variant bg-surface-container-high"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
              #
            </span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
              Comandante
            </span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
              Nação
            </span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest text-center">
              V
            </span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest text-center">
              D
            </span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest text-right">
              Taxa
            </span>
          </div>

          {/* Corpo */}
          {loading ? (
            <LoadingState message="CARREGANDO INTELIGÊNCIA..." />
          ) : rankings.length === 0 ? (
            <EmptyState
              icon="leaderboard"
              message="NENHUM REGISTRO ENCONTRADO"
            />
          ) : (
            <div className="divide-y divide-outline-variant">
              {rankings.map((player, index) => {
                const rank = offset + index + 1;
                return (
                  <div
                    key={player.playerId || index}
                    className="flex sm:grid sm:grid-cols-[40px_1fr_70px_50px_50px_65px] gap-2 px-4 py-3 items-center hover:bg-surface-container-high transition-colors"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    <span
                      className={`text-sm font-bold shrink-0 w-8 ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-300" : rank === 3 ? "text-amber-600" : "text-on-surface-variant"}`}
                    >
                      {rank <= 3 ? "★" : rank}
                    </span>
                    <span className="text-on-surface text-sm truncate flex-1">
                      {player.name}
                    </span>
                    <span className="text-primary text-xs shrink-0 hidden sm:block">
                      {player.nation ? `${NATION_FLAGS[player.nation]}` : "—"}
                    </span>
                    <span className="text-secondary text-sm text-center shrink-0 hidden sm:block">
                      {player.wins ?? 0}
                    </span>
                    <span className="text-error text-sm text-center shrink-0 hidden sm:block">
                      {player.losses ?? 0}
                    </span>
                    <span className="text-on-surface text-sm text-right font-bold shrink-0 ml-auto sm:ml-0">
                      {player.winrate != null
                        ? `${player.winrate.toFixed(1)}%`
                        : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginação */}
          <div className="border-t-2 border-outline-variant px-4 py-3 flex items-center justify-between bg-surface-container-high">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="btn-secondary text-xs px-3 py-1 disabled:opacity-30"
            >
              ← ANTERIOR
            </button>
            <span
              className="text-xs text-on-surface-variant"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {offset + 1}—{offset + rankings.length}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={rankings.length < limit}
              className="btn-secondary text-xs px-3 py-1 disabled:opacity-30"
            >
              PRÓXIMO →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
