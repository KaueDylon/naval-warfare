import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../services/api";
import * as ws from "../services/websocket";
import * as sfx from "../services/sounds";
import {
  createEmptyGrid,
  buildSunkCells,
  resolveSunkShipCells,
  floodFillHitCells,
} from "../utils/gameBoard";
import { useTurnTimer } from "./useTurnTimer";

const SHIP_TYPE_NAMES = {
  CARRIER: "PORTA-AVIÕES",
  BATTLESHIP: "ENCOURAÇADO",
  CRUISER: "CRUZADOR",
  SUBMARINE: "SUBMARINO",
  DESTROYER: "DESTROYER",
};

/**
 * Hook central de conexão e estado de partida — WebSocket (conexão,
 * subscriptions, handlers de mensagens), grids, prontidão, turno, log de
 * batalha, timer de turno com tiro automático, e as ações que o jogador
 * pode disparar (posicionar navio, limpar tabuleiro, pronto, atacar, render).
 *
 * Recebe callbacks para efeitos que pertencem à resolução do oponente
 * (que vive em useOpponentResolver) — o hook nunca resolve oponentId por
 * conta própria além do que já vem nas mensagens que recebe.
 */
export function useGameConnection({ gameId, user, token, onOpponentResolved }) {
  const connectedRef = useRef(false);

  const [phase, setPhase] = useState("SETUP");
  const [myGrid, setMyGrid] = useState(createEmptyGrid());
  const [enemyGrid, setEnemyGrid] = useState(createEmptyGrid());
  const [sunkEnemyCells, setSunkEnemyCells] = useState(new Set());
  const [sunkMyCells, setSunkMyCells] = useState(new Set());
  const [enemyShipTypes, setEnemyShipTypes] = useState(new Map());
  const [myShipTypes, setMyShipTypes] = useState(new Map());
  const [currentTurn, setCurrentTurn] = useState(null);
  const [opponentId, setOpponentId] = useState(null);
  const [winner, setWinner] = useState(null);
  const [myReady, setMyReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [showVersus, setShowVersus] = useState(false);

  const [selectedShip, setSelectedShip] = useState(null);
  const selectedShipRef = useRef(null);
  const [horizontal, setHorizontal] = useState(true);
  const [placedShips, setPlacedShips] = useState([]);
  const placedShipsRef = useRef([]);

  const [battleLog, setBattleLog] = useState([]);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [turnEpoch, setTurnEpoch] = useState(0);
  const enemyGridRef = useRef(createEmptyGrid());
  const [animatedCell, setAnimatedCell] = useState(null);

  // Sync enemyGridRef com state — usado pelo tiro automático (fireRandomShot)
  useEffect(() => {
    enemyGridRef.current = enemyGrid;
  }, [enemyGrid]);

  function addLog(message) {
    setBattleLog((prev) => [...prev.slice(-50), { time: new Date(), message }]);
  }

  function triggerCellAnimation(row, col, type, board) {
    setAnimatedCell({ row, col, type, board });
    setTimeout(() => setAnimatedCell(null), 800);
  }

  const setSelectedShipSync = useCallback((ship) => {
    selectedShipRef.current = ship;
    setSelectedShip(ship);
  }, []);

  const setPlacedShipsSync = useCallback((updater) => {
    setPlacedShips((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      placedShipsRef.current = next;
      return next;
    });
  }, []);

  /** Notifica o resolvedor de oponente externo (useOpponentResolver) quando descobrimos um novo ID aqui dentro. */
  const resolveOpponent = useCallback(
    (id) => {
      if (!id) return;
      setOpponentId(id);
      onOpponentResolved?.(id);
    },
    [onOpponentResolved],
  );

  function fireRandomShot() {
    const grid = enemyGridRef.current;
    const available = [];
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (grid[r][c] === 0) available.push({ row: r, col: c });
      }
    }
    if (available.length === 0) return;
    const target = available[Math.floor(Math.random() * available.length)];
    ws.publish(`/app/game/${gameId}/attack`, {
      row: target.row,
      col: target.col,
    });
    addLog(
      `⏱ TEMPO ESGOTADO — Tiro automático em ${String.fromCharCode(65 + target.row)}${target.col + 1}`,
    );
  }

  const turnTimer = useTurnTimer({
    phase,
    currentTurn,
    userId: user.id,
    turnEpoch,
    onTimeout: fireRandomShot,
  });

  function handleAttackResult(message) {
    const { row, col, attackerId, nextTurn, status, shipType } = message;
    const isMyAttack = attackerId === user.id;
    if (nextTurn) setCurrentTurn(nextTurn);

    // Resolver opponentId se ainda não temos (ex: após F5)
    if (!opponentId) {
      const inferredOppId = !isMyAttack ? attackerId : (nextTurn && nextTurn !== user.id ? nextTurn : null);
      if (inferredOppId) resolveOpponent(inferredOppId);
    }

    // Se o turno continua sendo meu após um ataque, resetar o timer
    if (isMyAttack && (!nextTurn || nextTurn === user.id)) {
      setTurnEpoch((e) => e + 1);
    }

    // Se recebemos um ataque do oponente, ele está de volta
    if (!isMyAttack) setOpponentDisconnected(false);

    switch (status) {
      case "HIT":
      case "SUNK":
        if (isMyAttack) {
          if (shipType && status === "HIT") {
            setEnemyShipTypes((prev) => {
              const next = new Map(prev);
              next.set(`${row}-${col}`, shipType);
              return next;
            });
          }
          setEnemyGrid((prev) => {
            const next = prev.map((r) => [...r]);
            next[row][col] = 3;
            if (status === "SUNK" && shipType) {
              const shipCells = resolveSunkShipCells(next, row, col, shipType);
              const newSunk = new Set(shipCells.map(([r, c]) => `${r}-${c}`));
              setSunkEnemyCells((prev2) => new Set([...prev2, ...newSunk]));
              setEnemyShipTypes((prev2) => {
                const next2 = new Map(prev2);
                newSunk.forEach((key) => next2.set(key, shipType));
                return next2;
              });
            }
            return next;
          });
          addLog(
            `🎯 ${String.fromCharCode(65 + row)}${col + 1} — ${status === "HIT" ? "ACERTOU" : "AFUNDOU"}!`,
          );
        } else {
          setMyGrid((prev) => {
            const next = prev.map((r) => [...r]);
            next[row][col] = 3;
            if (status === "SUNK") {
              const newSunk = floodFillHitCells(next, row, col);
              setSunkMyCells((prev2) => new Set([...prev2, ...newSunk]));
            }
            return next;
          });
          addLog(
            `💥 ATAQUE RECEBIDO — ${String.fromCharCode(65 + row)}${col + 1} — ${status === "HIT" ? "ACERTOU" : "AFUNDOU"}`,
          );
        }
        if (status === "SUNK") {
          const typeName = shipType
            ? SHIP_TYPE_NAMES[shipType] || shipType
            : "EMBARCAÇÃO";
          addLog(`🔥 ${typeName} DESTRUÍDO!`);
        }
        if (status === "SUNK") {
          sfx.playSunk();
          triggerCellAnimation(row, col, "sunk", isMyAttack ? "enemy" : "my");
        } else {
          sfx.playHit();
          triggerCellAnimation(row, col, "hit", isMyAttack ? "enemy" : "my");
        }
        break;
      case "MISS":
        if (isMyAttack) {
          setEnemyGrid((prev) => {
            const c = prev.map((r) => [...r]);
            c[row][col] = 2;
            return c;
          });
          addLog(`💨 ${String.fromCharCode(65 + row)}${col + 1} — ERROU`);
        } else {
          setMyGrid((prev) => {
            const c = prev.map((r) => [...r]);
            c[row][col] = 2;
            return c;
          });
          addLog(
            `🌊 INIMIGO ERROU — ${String.fromCharCode(65 + row)}${col + 1}`,
          );
        }
        sfx.playMiss();
        triggerCellAnimation(row, col, "miss", isMyAttack ? "enemy" : "my");
        break;
      case "GAME_OVER":
        setPhase("FINISHED");
        setWinner(attackerId);
        addLog(`🏁 ${attackerId === user.id ? "VITÓRIA" : "DERROTA"}`);
        if (attackerId === user.id) sfx.playVictory();
        else sfx.playDefeat();
        break;
      case "ATTACKED":
        setError("Posição já atacada");
        break;
      case "NOT_YOUR_TURN":
        setError("Não é sua vez, Comandante");
        break;
      case "INVALID_POSITION":
        setError("Coordenadas de alvo inválidas");
        break;
      default:
        break;
    }
  }

  function handleGameMessage(message) {
    if (message.type) {
      // Qualquer evento do oponente (exceto PLAYER_DISCONNECTED) prova que ele reconectou
      if (
        message.playerId &&
        message.playerId !== user.id &&
        message.type !== "PLAYER_DISCONNECTED"
      ) {
        setOpponentDisconnected(false);
      }
      switch (message.type) {
        case "PLAYER_READY":
          if (message.playerId === user.id) setMyReady(true);
          else {
            setOpponentReady(true);
            if (!opponentId && message.playerId) {
              resolveOpponent(message.playerId);
            }
          }
          addLog(
            `Comandante ${message.playerId === user.id ? "VOCÊ" : "INIMIGO"} pronto para o combate`,
          );
          break;
        case "GAME_STARTED":
          setCurrentTurn(message.playerId);
          addLog("⚓ TODOS OS POSTOS — INICIAR FOGO");
          loadGameState();
          setShowVersus(true);
          break;
        case "GAME_OVER":
          setPhase("FINISHED");
          setWinner(message.playerId);
          addLog(
            `🏁 OPERAÇÃO ENCERRADA — ${message.playerId === user.id ? "VITÓRIA" : "DERROTA"}`,
          );
          break;
        case "PLAYER_SURRENDERED":
          addLog(
            message.playerId !== user.id
              ? "⚐ INIMIGO SE RENDEU"
              : "⚐ VOCÊ ABANDONOU A MISSÃO",
          );
          break;
        case "PLAYER_DISCONNECTED":
          if (message.playerId !== user.id) {
            setOpponentDisconnected(true);
            addLog("⚠ COMUNICAÇÕES INIMIGAS INTERROMPIDAS");
            setTimeout(() => setOpponentDisconnected(false), 600);
          }
          break;
        default:
          break;
      }
    } else if (message.status !== undefined && message.row !== undefined) {
      handleAttackResult(message);
    }
  }

  function handlePlaceResult(result) {
    let status = typeof result === "string" ? result : JSON.stringify(result);
    status = status.replace(/^"|"$/g, "");
    if (status === "OK") {
      const ship = selectedShipRef.current;
      if (ship) {
        setPlacedShipsSync((prev) => [...prev, ship.id]);
        setSelectedShipSync(null);
      }
      setError("");
      api
        .getBoard(gameId, user.id)
        .then(({ grid, shipTypes }) => {
          setMyGrid(grid);
          setMyShipTypes(shipTypes);
        })
        .catch(console.error);
      addLog(`Embarcação posicionada (${placedShipsRef.current.length}/5)`);
    } else if (status === "INVALID") {
      setError(
        "Posicionamento inválido — sobrepõe outra embarcação ou ultrapassa o limite",
      );
    } else if (status === "BOARD_CLEARED") {
      setPlacedShipsSync([]);
      setMyGrid(createEmptyGrid());
      setMyShipTypes(new Map());
      setSelectedShipSync(null);
      setError("");
      addLog("Tabuleiro limpo — todas as embarcações recolhidas");
    }
  }

  function connectWs() {
    if (connectedRef.current) return;
    ws.connect(
      token,
      () => {
        connectedRef.current = true;
        setConnected(true);
        ws.subscribePersistent(`/topic/game/${gameId}`, handleGameMessage);
        ws.subscribePersistent("/user/queue/place-result", handlePlaceResult);
        ws.subscribePersistent("/user/queue/errors", (msg) => {
          setError(
            typeof msg === "string" ? msg : msg.message || "Erro desconhecido",
          );
          addLog(`ERRO: ${typeof msg === "string" ? msg : msg.message}`);
        });
      },
      (err) => {
        console.error("[Game] WS Error:", err);
        connectedRef.current = false;
        setConnected(false);
      },
    );
  }

  /**
   * Carrega o estado do jogo via REST (usado no mount e ao receber GAME_STARTED).
   * Resolve fase, turno, vencedor, prontidão e — quando aplicável — os boards.
   * A resolução de opponentId em si é feita por useOpponentResolver; aqui só
   * repassamos o que o próprio getGameState/getBoard nos disserem.
   */
  const loadGameState = useCallback(async () => {
    try {
      const state = await api.getGameState(gameId);
      if (state.phase) setPhase(state.phase);
      if (state.currentTurn) setCurrentTurn(state.currentTurn);
      if (state.winner) setWinner(state.winner);

      let oppId = null;
      if (state.playerAId && state.playerBId) {
        oppId = state.playerAId === user.id ? state.playerBId : state.playerAId;
      } else if (state.playerAId && state.playerAId !== user.id) {
        oppId = state.playerAId;
      } else if (state.playerBId && state.playerBId !== user.id) {
        oppId = state.playerBId;
      }
      if (!oppId && state.currentTurn && state.currentTurn !== user.id) {
        oppId = state.currentTurn;
      }
      if (!oppId) {
        oppId = sessionStorage.getItem(`game_${gameId}_oppId`) || null;
      }
      if (oppId) resolveOpponent(oppId);

      if (state.playerAId === user.id) {
        setMyReady(state.playerAReady || false);
        setOpponentReady(state.playerBReady || false);
      } else {
        setMyReady(state.playerBReady || false);
        setOpponentReady(state.playerAReady || false);
      }

      if (state.phase === "SETUP") {
        const { grid: myBoard, shipTypes: myTypes } = await api.getBoard(
          gameId,
          user.id,
        );
        setMyGrid(myBoard);
        setMyShipTypes(myTypes);
        const shipCells = myBoard.flat().filter((v) => v === 1).length;
        if (shipCells > 0) {
          const visited = new Set();
          const detectedShipIds = [];
          for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
              if (myBoard[r][c] === 1 && !visited.has(`${r}-${c}`)) {
                const cellType = myTypes.get(`${r}-${c}`);
                const stack = [[r, c]];
                while (stack.length) {
                  const [sr, sc] = stack.pop();
                  const key = `${sr}-${sc}`;
                  if (visited.has(key)) continue;
                  visited.add(key);
                  if (myBoard[sr]?.[sc] === 1) {
                    [
                      [sr - 1, sc],
                      [sr + 1, sc],
                      [sr, sc - 1],
                      [sr, sc + 1],
                    ].forEach(([nr, nc]) => {
                      if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10)
                        stack.push([nr, nc]);
                    });
                  }
                }
                const shipId = cellType ? cellType.toLowerCase() : null;
                if (shipId) detectedShipIds.push(shipId);
              }
            }
          }
          setPlacedShipsSync(detectedShipIds);
        }
      } else if (state.phase === "PLAYING" || state.phase === "FINISHED") {
        const { grid: myBoard, shipTypes: myTypes } = await api.getBoard(
          gameId,
          user.id,
        );
        setMyGrid(myBoard);
        setMyShipTypes(myTypes);

        const newSunkMy = buildSunkCells(myBoard, myTypes);
        setSunkMyCells(newSunkMy);

        if (oppId) {
          const { grid: oppBoard, shipTypes: oppTypes } = await api.getBoard(
            gameId,
            oppId,
          );
          setEnemyGrid(oppBoard);
          setEnemyShipTypes(oppTypes);
          const newSunkEnemy = buildSunkCells(oppBoard, oppTypes);
          setSunkEnemyCells(newSunkEnemy);
        }
      }
    } catch (err) {
      console.error("Failed to load game state:", err);
      setError("Failed to load game state");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, user.id]);

  useEffect(() => {
    loadGameState();
    connectWs();
    return () => {
      connectedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  useEffect(() => {
    function onKeyDown(e) {
      if (phase !== "SETUP" || myReady) return;
      if (e.key === "r" || e.key === "R") {
        setHorizontal((h) => !h);
      }
      if (e.key === "c" || e.key === "C") {
        handleClearBoard();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, myReady]);

  function handlePlaceShip(row, col) {
    const ship = selectedShipRef.current;
    if (!ship || phase !== "SETUP" || myReady) return;
    if (horizontal && col + ship.size > 10) {
      setError(`Embarcação não cabe — ultrapassa o limite do tabuleiro`);
      return;
    }
    if (!horizontal && row + ship.size > 10) {
      setError(`Embarcação não cabe — ultrapassa o limite do tabuleiro`);
      return;
    }
    setError("");
    ws.publish(`/app/game/${gameId}/place`, {
      row,
      col,
      size: ship.size,
      orientation: horizontal,
      shipType: ship.id.toUpperCase(),
    });
  }

  function handleClearBoard() {
    ws.publish(`/app/game/${gameId}/clear`, {});
  }

  function handleReady() {
    if (placedShipsRef.current.length < 5) {
      setError("Posicione todas as 5 embarcações antes de sinalizar prontidão");
      return;
    }
    ws.publish(`/app/game/${gameId}/ready`, {});
    setMyReady(true);
  }

  function handleAttack(row, col) {
    if (phase !== "PLAYING" || currentTurn !== user.id) return;
    ws.publish(`/app/game/${gameId}/attack`, { row, col });
  }

  function confirmSurrender() {
    ws.publish(`/app/game/${gameId}/surrender`, {});
  }

  return {
    // estado
    phase,
    setPhase,
    myGrid,
    enemyGrid,
    setEnemyGrid,
    setEnemyShipTypes,
    setSunkEnemyCells,
    sunkEnemyCells,
    sunkMyCells,
    enemyShipTypes,
    myShipTypes,
    currentTurn,
    opponentId,
    setOpponentId: resolveOpponent,
    winner,
    myReady,
    opponentReady,
    opponentDisconnected,
    showVersus,
    setShowVersus,
    selectedShip,
    setSelectedShip: setSelectedShipSync,
    horizontal,
    setHorizontal,
    placedShips,
    battleLog,
    error,
    setError,
    connected,
    turnTimer,
    animatedCell,
    // ações
    handlePlaceShip,
    handleClearBoard,
    handleReady,
    handleAttack,
    confirmSurrender,
    loadGameState,
  };
}
