import { useEffect, useState } from "react";
import * as api from "../services/api";
import { buildSunkCells } from "../utils/gameBoard";

/**
 * Resolve e enriquece os dados do oponente (nação, nome, portrait) durante
 * a partida, e persiste tudo em sessionStorage para sobreviver a um F5.
 *
 * Este hook NÃO é a fonte de verdade do `opponentId` — quem descobre o id
 * pelo protocolo do jogo (WS/REST) é o useGameConnection, que chama
 * `resolveOpponentId` (recebido como argumento) sempre que descobre um id.
 * Aqui apenas reagimos a esse id para buscar o perfil, e cobrimos os casos
 * em que o protocolo não nos disse nada (polling + fallback de board vazio).
 */
export function useOpponentResolver({
  gameId,
  phase,
  userId,
  opponentId,
  resolveOpponentId,
  enemyGrid,
  setEnemyGrid,
  setEnemyShipTypes,
  setSunkEnemyCells,
}) {
  const [opponentNation, setOpponentNation] = useState(() => {
    return sessionStorage.getItem(`game_${gameId}_oppNation`) || null;
  });
  const [opponentName, setOpponentName] = useState(() => {
    return sessionStorage.getItem(`game_${gameId}_oppName`) || null;
  });
  const [opponentPortrait, setOpponentPortrait] = useState(() => {
    return sessionStorage.getItem(`game_${gameId}_oppPortrait`) || null;
  });

  // Persistir dados do oponente no sessionStorage para sobreviver ao F5
  useEffect(() => {
    if (opponentId) sessionStorage.setItem(`game_${gameId}_oppId`, opponentId);
    if (opponentNation) sessionStorage.setItem(`game_${gameId}_oppNation`, opponentNation);
    if (opponentName) sessionStorage.setItem(`game_${gameId}_oppName`, opponentName);
    if (opponentPortrait) sessionStorage.setItem(`game_${gameId}_oppPortrait`, opponentPortrait);
  }, [opponentId, opponentNation, opponentName, opponentPortrait, gameId]);

  function applyProfile(data) {
    if (data?.nation) setOpponentNation(data.nation);
    if (data?.name) setOpponentName(data.name);
    if (data?.portrait) setOpponentPortrait(data.portrait);
  }

  // Sempre que o opponentId mudar e ainda não tivermos a nação em cache,
  // busca o perfil completo do oponente.
  useEffect(() => {
    if (!opponentId || opponentNation) return;
    let cancelled = false;
    api
      .getPlayer(opponentId)
      .then((data) => {
        if (!cancelled) applyProfile(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opponentId]);

  // Se estamos em PLAYING mas opponentId ficou null (F5/reconexão onde
  // getGameState não retorna playerBId), poll até resolver via currentTurn
  // mudando ou getGameState retornando o campo.
  useEffect(() => {
    if (opponentId || phase !== "PLAYING") return;

    let cancelled = false;

    async function resolve() {
      for (let attempt = 0; attempt < 10 && !cancelled; attempt++) {
        await new Promise((r) => setTimeout(r, 1000));
        if (cancelled) return;
        try {
          const state = await api.getGameState(gameId);
          let resolved = null;
          if (state.playerAId && state.playerBId) {
            resolved = state.playerAId === userId ? state.playerBId : state.playerAId;
          } else if (state.playerAId && state.playerAId !== userId) {
            resolved = state.playerAId;
          } else if (state.playerBId && state.playerBId !== userId) {
            resolved = state.playerBId;
          }
          if (!resolved && state.currentTurn && state.currentTurn !== userId) {
            resolved = state.currentTurn;
          }
          if (resolved) {
            if (cancelled) return;
            resolveOpponentId(resolved);
            try {
              const oppData = await api.getPlayer(resolved);
              if (!cancelled) applyProfile(oppData);
            } catch {}
            try {
              const { grid: oppBoard, shipTypes: oppTypes } = await api.getBoard(gameId, resolved);
              if (!cancelled) {
                setEnemyGrid(oppBoard);
                setEnemyShipTypes(oppTypes);
                setSunkEnemyCells(buildSunkCells(oppBoard, oppTypes));
              }
            } catch {}
            return;
          }
        } catch {}
      }
    }

    resolve();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opponentId, phase, gameId, userId]);

  // Fallback extra: se temos opponentId mas enemyGrid está vazio (não
  // carregou no loadGameState), buscar o board inimigo assim que possível.
  useEffect(() => {
    if (!opponentId || phase !== "PLAYING") return;
    const isEmpty = enemyGrid.every((row) => row.every((cell) => cell === 0));
    if (!isEmpty) return;

    let cancelled = false;
    async function loadEnemyBoard() {
      // Pequeno delay para não competir com loadGameState
      await new Promise((r) => setTimeout(r, 200));
      if (cancelled) return;
      try {
        const { grid: oppBoard, shipTypes: oppTypes } = await api.getBoard(gameId, opponentId);
        if (cancelled) return;
        setEnemyGrid(oppBoard);
        setEnemyShipTypes(oppTypes);
        setSunkEnemyCells(buildSunkCells(oppBoard, oppTypes));
      } catch {}
      if (!opponentNation) {
        try {
          const oppData = await api.getPlayer(opponentId);
          if (cancelled) return;
          applyProfile(oppData);
        } catch {}
      }
    }
    loadEnemyBoard();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opponentId, phase, gameId]);

  return { opponentNation, opponentName, opponentPortrait };
}
