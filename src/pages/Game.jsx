import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import * as api from "../services/api";
import * as ws from "../services/websocket";
import * as sfx from "../services/sounds";
import Board from "../components/Board";
import VersusScreen from "../components/VersusScreen";
import { SHIP_SIZES } from "../constants/ships";
import PageHeader, { HeaderDivider } from "../components/PageHeader";
import AlertBanner from "../components/AlertBanner";


const SHIPS = [
  { name: "Porta-Aviões", size: 5, id: "carrier" },
  { name: "Encouraçado", size: 4, id: "battleship" },
  { name: "Cruzador", size: 3, id: "cruiser" },
  { name: "Submarino", size: 3, id: "submarine" },
  { name: "Destroyer", size: 2, id: "destroyer" },
];

export default function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const connectedRef = useRef(false);

  const [phase, setPhase] = useState("SETUP");
  const [myGrid, setMyGrid] = useState(createEmptyGrid());
  const [enemyGrid, setEnemyGrid] = useState(createEmptyGrid());
  const prevEnemyGridRef = useRef(createEmptyGrid());
  const [sunkEnemyCells, setSunkEnemyCells] = useState(new Set()); // "row-col"
  const [sunkMyCells, setSunkMyCells] = useState(new Set());
  const [enemyShipTypes, setEnemyShipTypes] = useState(new Map()); // "row-col" → "CARRIER" etc.
  const [myShipTypes, setMyShipTypes] = useState(new Map());
  const [currentTurn, setCurrentTurn] = useState(null);
  const [opponentId, setOpponentId] = useState(() => {
    return sessionStorage.getItem(`game_${gameId}_oppId`) || null;
  });
  const [opponentNation, setOpponentNation] = useState(() => {
    return sessionStorage.getItem(`game_${gameId}_oppNation`) || null;
  });
  const [opponentName, setOpponentName] = useState(() => {
    return sessionStorage.getItem(`game_${gameId}_oppName`) || null;
  });
  const [opponentPortrait, setOpponentPortrait] = useState(() => {
    return sessionStorage.getItem(`game_${gameId}_oppPortrait`) || null;
  });
  const [winner, setWinner] = useState(null);

  // Persistir dados do oponente no sessionStorage para sobreviver ao F5
  useEffect(() => {
    if (opponentId) sessionStorage.setItem(`game_${gameId}_oppId`, opponentId);
    if (opponentNation) sessionStorage.setItem(`game_${gameId}_oppNation`, opponentNation);
    if (opponentName) sessionStorage.setItem(`game_${gameId}_oppName`, opponentName);
    if (opponentPortrait) sessionStorage.setItem(`game_${gameId}_oppPortrait`, opponentPortrait);
  }, [opponentId, opponentNation, opponentName, opponentPortrait, gameId]);
  const [myReady, setMyReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [showVersus, setShowVersus] = useState(false);

  const [selectedShip, setSelectedShip] = useState(null);
  const selectedShipRef = useRef(null);
  const [horizontal, setHorizontal] = useState(true);
  const [placedShips, setPlacedShips] = useState([]);
  const placedShipsRef = useRef([]);
  const [setupHoveredCell, setSetupHoveredCell] = useState(null);

  const [battleLog, setBattleLog] = useState([]);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [turnTimer, setTurnTimer] = useState(15);
  const turnTimerRef = useRef(null);
  const [turnEpoch, setTurnEpoch] = useState(0); // incrementa a cada novo turno do jogador para forçar reset do timer
  const enemyGridRef = useRef(createEmptyGrid());
  const [animatedCell, setAnimatedCell] = useState(null); // {row, col, type, board}

  function createEmptyGrid() {
    return Array.from({ length: 10 }, () => Array(10).fill(0));
  }

  /**
   * Reconstrói o Set de sunkCells a partir de um board e seus shipTypes.
   * Agrupa células com valor 3 que possuem shipType, verifica se o grupo
   * tem o tamanho esperado do navio (= navio completamente afundado).
   */
  function buildSunkCells(board, shipTypes) {
    const sunk = new Set();
    const processed = new Set();
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const key = `${r}-${c}`;
        if (processed.has(key)) continue;
        if (board[r][c] !== 3) continue;
        const type = shipTypes.get(key);
        if (!type) continue;

        const expectedSize = SHIP_SIZES[type] || 1;

        // Tentar horizontal
        const hCells = [[r, c]];
        for (let cc = c + 1; cc < 10 && board[r][cc] === 3 && shipTypes.get(`${r}-${cc}`) === type; cc++) {
          hCells.push([r, cc]);
        }

        // Tentar vertical
        const vCells = [[r, c]];
        for (let rr = r + 1; rr < 10 && board[rr][c] === 3 && shipTypes.get(`${rr}-${c}`) === type; rr++) {
          vCells.push([rr, c]);
        }

        let shipCells = null;
        if (hCells.length === expectedSize) {
          shipCells = hCells;
        } else if (vCells.length === expectedSize) {
          shipCells = vCells;
        }

        if (shipCells) {
          shipCells.forEach(([sr, sc]) => {
            const sk = `${sr}-${sc}`;
            sunk.add(sk);
            processed.add(sk);
          });
        } else {
          processed.add(key);
        }
      }
    }
    return sunk;
  }

  const loadGameState = useCallback(async () => {
    try {
      const state = await api.getGameState(gameId);
      if (state.phase) setPhase(state.phase);
      if (state.currentTurn) setCurrentTurn(state.currentTurn);
      if (state.winner) setWinner(state.winner);

      // Resolver o ID do oponente
      // O backend pode não retornar playerBId em getGameState.
      // Usamos múltiplas estratégias para descobrir quem é o oponente.
      let oppId = null;
      if (state.playerAId && state.playerBId) {
        // Caso ideal: ambos IDs disponíveis
        oppId = state.playerAId === user.id ? state.playerBId : state.playerAId;
      } else if (state.playerAId && state.playerAId !== user.id) {
        oppId = state.playerAId;
      } else if (state.playerBId && state.playerBId !== user.id) {
        oppId = state.playerBId;
      }
      // Fallback: usar currentTurn se não é meu ID
      if (!oppId && state.currentTurn && state.currentTurn !== user.id) {
        oppId = state.currentTurn;
      }
      // Fallback final: sessionStorage (salvo de antes do F5)
      if (!oppId) {
        oppId = sessionStorage.getItem(`game_${gameId}_oppId`) || null;
      }
      setOpponentId(oppId || null);

      // Se oppId é null mas o jogo está em andamento, o useEffect de polling cuidará
      if (oppId && (state.phase === "PLAYING" || state.phase === "FINISHED")) {
        // oppId já foi resolvido (via API ou sessionStorage) - buscar dados que faltam
        const cachedNation = sessionStorage.getItem(`game_${gameId}_oppNation`);
        if (!cachedNation) {
          try {
            const oppData = await api.getPlayer(oppId);
            if (oppData?.nation) setOpponentNation(oppData.nation);
            if (oppData?.name) setOpponentName(oppData.name);
            if (oppData?.portrait) setOpponentPortrait(oppData.portrait);
          } catch {}
        }
      }

      if (state.playerAId === user.id) {
        setMyReady(state.playerAReady || false);
        setOpponentReady(state.playerBReady || false);
      } else {
        setMyReady(state.playerBReady || false);
        setOpponentReady(state.playerAReady || false);
      }

      if (state.phase === "SETUP") {
        // Recupera navios já posicionados no backend (ex: reload da página)
        const { grid: myBoard, shipTypes: myTypes } = await api.getBoard(
          gameId,
          user.id,
        );
        setMyGrid(myBoard);
        setMyShipTypes(myTypes);
        // Conta navios já posicionados (células com valor 1)
        const shipCells = myBoard.flat().filter((v) => v === 1).length;
        if (shipCells > 0) {
          // Detecta navios individuais via flood-fill para saber quantos foram colocados
          const visited = new Set();
          const detectedShipIds = [];
          for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
              if (myBoard[r][c] === 1 && !visited.has(`${r}-${c}`)) {
                // Pegar o shipType da primeira célula deste navio
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
                // Mapear o shipType do backend para o id local
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

        // Reconstruir sunkMyCells (meu board — sempre disponível)
        const newSunkMy = buildSunkCells(myBoard, myTypes);
        setSunkMyCells(newSunkMy);

        // Reconstruir enemy board (depende de ter o oppId)
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
  }, [gameId, user.id]);

  useEffect(() => {
    loadGameState();
    connectWs();
    return () => {
      connectedRef.current = false;
    };
  }, [gameId]);

  // Se estamos em PLAYING mas opponentId ficou null (F5/reconexão onde getGameState não retorna playerBId),
  // poll até resolver via currentTurn mudando ou getGameState retornando o campo
  useEffect(() => {
    if (opponentId || phase !== "PLAYING") return;

    let cancelled = false;

    async function resolveOpponent() {
      for (let attempt = 0; attempt < 10 && !cancelled; attempt++) {
        await new Promise((r) => setTimeout(r, 1000));
        if (cancelled) return;
        try {
          const state = await api.getGameState(gameId);
          let resolved = null;
          if (state.playerAId && state.playerBId) {
            resolved = state.playerAId === user.id ? state.playerBId : state.playerAId;
          } else if (state.playerAId && state.playerAId !== user.id) {
            resolved = state.playerAId;
          } else if (state.playerBId && state.playerBId !== user.id) {
            resolved = state.playerBId;
          }
          if (!resolved && state.currentTurn && state.currentTurn !== user.id) {
            resolved = state.currentTurn;
          }
          if (resolved) {
            if (cancelled) return;
            setOpponentId(resolved);
            // Buscar perfil
            try {
              const oppData = await api.getPlayer(resolved);
              if (!cancelled) {
                if (oppData?.nation) setOpponentNation(oppData.nation);
                if (oppData?.name) setOpponentName(oppData.name);
                if (oppData?.portrait) setOpponentPortrait(oppData.portrait);
              }
            } catch {}
            // Buscar enemy board
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

    resolveOpponent();
    return () => { cancelled = true; };
  }, [opponentId, phase, gameId, user.id]);

  // Fallback extra: se temos opponentId mas enemyGrid está vazio (não carregou no loadGameState),
  // buscar o board inimigo assim que possível
  useEffect(() => {
    if (!opponentId || phase !== "PLAYING") return;
    // Verifica se o enemy grid está todo zerado (não carregou)
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
      // Buscar nação se não temos
      if (!opponentNation) {
        try {
          const oppData = await api.getPlayer(opponentId);
          if (cancelled) return;
          if (oppData?.nation) setOpponentNation(oppData.nation);
          if (oppData?.name) setOpponentName(oppData.name);
          if (oppData?.portrait) setOpponentPortrait(oppData.portrait);
        } catch {}
      }
    }
    loadEnemyBoard();
    return () => { cancelled = true; };
  }, [opponentId, phase, gameId]);

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
  }, [phase, myReady]);

  // Sync enemyGridRef com state
  useEffect(() => {
    enemyGridRef.current = enemyGrid;
  }, [enemyGrid]);

  // Timer de turno — 15s para jogar, senão tiro aleatório
  useEffect(() => {
    if (turnTimerRef.current) {
      clearInterval(turnTimerRef.current);
      turnTimerRef.current = null;
    }

    if (phase !== "PLAYING" || currentTurn !== user.id) {
      setTurnTimer(15);
      return;
    }

    setTurnTimer(15);
    turnTimerRef.current = setInterval(() => {
      setTurnTimer((prev) => {
        if (prev <= 1) {
          clearInterval(turnTimerRef.current);
          turnTimerRef.current = null;
          fireRandomShot();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (turnTimerRef.current) {
        clearInterval(turnTimerRef.current);
        turnTimerRef.current = null;
      }
    };
  }, [phase, currentTurn, user.id, turnEpoch]);

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
            // Se o oponente deu ready mas ainda não sabemos quem ele é, resolver agora
            if (!opponentId && message.playerId) {
              setOpponentId(message.playerId);
              api.getPlayer(message.playerId)
                .then((data) => {
                  if (data?.nation) setOpponentNation(data.nation);
                  if (data?.name) setOpponentName(data.name);
                  if (data?.portrait) setOpponentPortrait(data.portrait);
                })
                .catch(() => {});
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
            // Auto-dismiss após 0.6s — se o oponente reconectou sem gerar evento
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

  function handleAttackResult(message) {
    const { row, col, attackerId, nextTurn, status, shipType } = message;
    const isMyAttack = attackerId === user.id;
    if (nextTurn) setCurrentTurn(nextTurn);

    // Resolver opponentId se ainda não temos (ex: após F5)
    if (!opponentId) {
      const inferredOppId = !isMyAttack ? attackerId : (nextTurn && nextTurn !== user.id ? nextTurn : null);
      if (inferredOppId) {
        setOpponentId(inferredOppId);
        api.getPlayer(inferredOppId)
          .then((data) => {
            if (data?.nation) setOpponentNation(data.nation);
            if (data?.name) setOpponentName(data.name);
            if (data?.portrait) setOpponentPortrait(data.portrait);
          })
          .catch(() => {});
        // Buscar enemy board que pode ter ficado vazio
        api.getBoard(gameId, inferredOppId)
          .then(({ grid: oppBoard, shipTypes: oppTypes }) => {
            setEnemyGrid(oppBoard);
            setEnemyShipTypes(oppTypes);
            setSunkEnemyCells(buildSunkCells(oppBoard, oppTypes));
          })
          .catch(() => {});
      }
    }

    // Se o turno continua sendo meu após um ataque, resetar o timer
    if (isMyAttack && (!nextTurn || nextTurn === user.id)) {
      setTurnEpoch((e) => e + 1);
    }

    // Se recebemos um ataque do oponente, ele está de volta
    if (!isMyAttack) setOpponentDisconnected(false);

    // Nomes legíveis dos tipos de navio
    const SHIP_TYPE_NAMES = {
      CARRIER: "PORTA-AVIÕES",
      BATTLESHIP: "ENCOURAÇADO",
      CRUISER: "CRUZADOR",
      SUBMARINE: "SUBMARINO",
      DESTROYER: "DESTROYER",
    };

    switch (status) {
      case "HIT":
      case "SUNK":
        if (isMyAttack) {
          // Registrar o shipType no mapa de tipos do inimigo
          // (para HIT, registra só a célula atingida; para SUNK, propaga para todas depois)
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
              // Determinar as células do navio afundado via propagação LINEAR
              // usando o tamanho do navio como limite
              const expectedSize = SHIP_SIZES[shipType] || 1;

              // Coletar cells contíguas com valor 3 na mesma LINHA
              const hCells = [[row, col]];
              for (let c = col - 1; c >= 0 && next[row][c] === 3; c--) hCells.unshift([row, c]);
              for (let c = col + 1; c < 10 && next[row][c] === 3; c++) hCells.push([row, c]);

              // Coletar cells contíguas com valor 3 na mesma COLUNA
              const vCells = [[row, col]];
              for (let r = row - 1; r >= 0 && next[r][col] === 3; r--) vCells.unshift([r, col]);
              for (let r = row + 1; r < 10 && next[r][col] === 3; r++) vCells.push([r, col]);

              // Escolher a direção correta
              let shipCells;
              if (expectedSize === 1) {
                shipCells = [[row, col]];
              } else if (hCells.length === expectedSize) {
                shipCells = hCells;
              } else if (vCells.length === expectedSize) {
                shipCells = vCells;
              } else if (hCells.length > expectedSize) {
                // Ambiguidade: mais cells que o esperado. Usar segmento centrado no hit.
                const idx = hCells.findIndex(([r, c]) => r === row && c === col);
                const start = Math.max(0, Math.min(idx, hCells.length - expectedSize));
                shipCells = hCells.slice(start, start + expectedSize);
              } else if (vCells.length > expectedSize) {
                const idx = vCells.findIndex(([r, c]) => r === row && c === col);
                const start = Math.max(0, Math.min(idx, vCells.length - expectedSize));
                shipCells = vCells.slice(start, start + expectedSize);
              } else {
                // Nenhum match exato — pegar a direção com mais cells
                shipCells = hCells.length >= vCells.length ? hCells : vCells;
              }

              const newSunk = new Set(shipCells.map(([r, c]) => `${r}-${c}`));
              setSunkEnemyCells((prev2) => new Set([...prev2, ...newSunk]));
              // Propagar shipType para TODAS as células do navio afundado
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
              const newSunk = new Set();
              const visited = new Set();
              const stack = [[row, col]];
              while (stack.length) {
                const [r, c] = stack.pop();
                const key = `${r}-${c}`;
                if (visited.has(key)) continue;
                visited.add(key);
                if ((next[r]?.[c] ?? 0) === 3) {
                  newSunk.add(key);
                  [
                    [r - 1, c],
                    [r + 1, c],
                    [r, c - 1],
                    [r, c + 1],
                  ].forEach(([nr, nc]) => {
                    if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10)
                      stack.push([nr, nc]);
                  });
                }
              }
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
        // Sound + animation
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

  function setSelectedShipSync(ship) {
    selectedShipRef.current = ship;
    setSelectedShip(ship);
  }

  function setPlacedShipsSync(updater) {
    setPlacedShips((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      placedShipsRef.current = next;
      return next;
    });
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

  function addLog(message) {
    setBattleLog((prev) => [...prev.slice(-50), { time: new Date(), message }]);
  }

  function triggerCellAnimation(row, col, type, board) {
    setAnimatedCell({ row, col, type, board });
    setTimeout(() => setAnimatedCell(null), 800);
  }

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

  function handleSurrender() {
    if (!confirm("ABANDONAR A MISSÃO? Esta ação não pode ser desfeita."))
      return;
    ws.publish(`/app/game/${gameId}/surrender`, {});
  }

  const isMyTurn = currentTurn === user.id;
  const isVictory = winner === user.id;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {showVersus && (
        <VersusScreen
          myName={user?.name}
          myNation={user?.nation}
          myPortrait={user?.portrait}
          opponentName={opponentName}
          opponentNation={opponentNation}
          opponentPortrait={opponentPortrait}
          onComplete={() => {
            setShowVersus(false);
            setPhase("PLAYING");
          }}
        />
      )}
      <PageHeader shrink>
        <div className="flex flex-col items-end">
          <span
            className="text-[10px] text-on-surface-variant uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Conexão
          </span>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 ${connected ? "bg-primary animate-pulse" : "bg-error"}`}
            ></div>
            <span
              className={`text-[10px] uppercase ${connected ? "text-primary" : "text-error"}`}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {connected ? "Linha Segura Ativa" : "Desconectado"}
            </span>
          </div>
        </div>
        {phase !== "FINISHED" && (
          <>
            <HeaderDivider />
            <button
              onClick={handleSurrender}
              className="btn-danger text-xs px-3 py-1.5"
            >
              Se Render
            </button>
          </>
        )}
      </PageHeader>

      <AlertBanner
        type="game-error"
        message={error}
        onClose={() => setError("")}
      />

      {/* Opponent Disconnected Warning */}
      {opponentDisconnected && phase !== "FINISHED" && (
        <div className="bg-secondary-container/20 border-b border-secondary px-4 py-2 flex items-center justify-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-secondary text-sm animate-pulse">
            wifi_off
          </span>
          <p
            className="text-secondary text-xs uppercase tracking-wider"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Comunicação com o inimigo interrompida — aguardando reconexão...
          </p>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 overflow-auto p-4">
        {phase === "SETUP" && (
          <SetupPhase
            myGrid={myGrid}
            ships={SHIPS}
            selectedShip={selectedShip}
            setSelectedShip={setSelectedShipSync}
            placedShips={placedShips}
            horizontal={horizontal}
            setHorizontal={setHorizontal}
            hoveredCell={setupHoveredCell}
            setHoveredCell={setSetupHoveredCell}
            onPlaceShip={handlePlaceShip}
            onClear={handleClearBoard}
            onReady={handleReady}
            myReady={myReady}
            opponentReady={opponentReady}
            myShipTypes={myShipTypes}
            myNation={user?.nation}
          />
        )}
        {phase === "PLAYING" && (
          <PlayingPhase
            myGrid={myGrid}
            enemyGrid={enemyGrid}
            isMyTurn={isMyTurn}
            onAttack={handleAttack}
            battleLog={battleLog}
            hoveredCell={hoveredCell}
            setHoveredCell={setHoveredCell}
            sunkMyCells={sunkMyCells}
            sunkEnemyCells={sunkEnemyCells}
            turnTimer={turnTimer}
            animatedCell={animatedCell}
            myShipTypes={myShipTypes}
            enemyShipTypes={enemyShipTypes}
            myNation={user?.nation}
            opponentNation={opponentNation}
            myName={user?.name}
            opponentName={opponentName}
          />
        )}
        {phase === "FINISHED" && (
          <FinishedPhase
            isVictory={isVictory}
            onReturn={() => {
              ws.disconnect();
              sessionStorage.removeItem(`game_${gameId}_oppId`);
              sessionStorage.removeItem(`game_${gameId}_oppNation`);
              sessionStorage.removeItem(`game_${gameId}_oppName`);
              sessionStorage.removeItem(`game_${gameId}_oppPortrait`);
              navigate("/", { replace: true });
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="flex justify-between items-center px-4 py-1 w-full bg-surface-container-lowest border-t-2 border-outline shrink-0 h-8">
        <span
          className="text-[10px] text-outline uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          © 1942 INTEL NAVAL. // CRIPTOGRAFIA: AES-256-MIL
        </span>
        <div className="flex gap-4 items-center">
          <span
            className="text-[10px] text-secondary uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            VER: 1.4.2-ALPHA
          </span>
          <span
            className="text-[10px] text-primary flex items-center gap-1"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="material-symbols-outlined text-[12px]">lock</span>
            LINHA SEGURA
          </span>
        </div>
      </footer>
    </div>
  );
}

// ===================== SETUP PHASE =====================
function SetupPhase({
  myGrid,
  ships,
  selectedShip,
  setSelectedShip,
  placedShips,
  horizontal,
  setHorizontal,
  hoveredCell,
  setHoveredCell,
  onPlaceShip,
  onClear,
  onReady,
  myReady,
  opponentReady,
  myShipTypes,
  myNation,
}) {
  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-4 lg:gap-6 h-full">
      {/* Main Board Area */}
      <section className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 flex justify-between items-end border-b-2 border-outline pb-2">
          <div>
            <h1
              className="text-lg stencil-text text-primary"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              Gráfico Tático: Setor 7-B
            </h1>
            <div className="flex gap-4 mt-1">
              <span
                className="text-[10px] text-secondary bg-secondary-container/30 px-2 py-0.5 border border-secondary/50"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                COORDINATES: NAV-SYNC
              </span>
              <span
                className="text-[10px] text-outline"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                STATUS: {myReady ? "PRONTO" : "PLANEJANDO"}
              </span>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-lg">
            <Board
              grid={myGrid}
              onCellClick={onPlaceShip}
              onCellHover={
                !myReady
                  ? (r, c) =>
                      setHoveredCell(r != null ? { row: r, col: c } : null)
                  : undefined
              }
              isOpponent={false}
              disabled={myReady}
              ghostShip={
                selectedShip && !myReady
                  ? { size: selectedShip.size, horizontal }
                  : null
              }
              hoveredCell={hoveredCell}
              shipTypes={myShipTypes}
              nation={myNation}
            />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="mt-4 p-4 border-2 border-outline-variant bg-surface-container flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span
                className="text-[10px] text-outline uppercase"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Comandos
              </span>
              <div className="flex gap-3 mt-1">
                <button
                  onClick={() => setHorizontal(!horizontal)}
                  disabled={myReady}
                  className="text-on-surface text-xs flex items-center gap-1 disabled:opacity-40"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <kbd className="bg-surface-variant px-1.5 py-0.5 border border-outline text-[10px]">
                    R
                  </kbd>
                  {horizontal ? "HORIZONTAL" : "VERTICAL"}
                </button>
                <button
                  onClick={onClear}
                  disabled={myReady}
                  className="text-on-surface text-xs flex items-center gap-1 disabled:opacity-40"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <kbd className="bg-surface-variant px-1.5 py-0.5 border border-outline text-[10px]">
                    C
                  </kbd>
                  LIMPAR
                </button>
              </div>
            </div>
            <div className="flex flex-col">
              <span
                className="text-[10px] text-outline uppercase"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Status
              </span>
              <div className="flex gap-2 items-center mt-1">
                <div
                  className={`w-2 h-2 ${opponentReady ? "bg-primary" : "bg-secondary animate-pulse"}`}
                  style={{ opacity: 0.6 }}
                ></div>
                <span
                  className="text-secondary text-xs"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {opponentReady ? "INIMIGO PRONTO" : "AGUARDANDO INIMIGO..."}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onReady}
            disabled={myReady || placedShips.length < 5}
            className="btn-primary px-8 py-3 text-base disabled:opacity-40"
          >
            {myReady
              ? "EM ESPERA"
              : `POSICIONAR FROTA (${placedShips.length}/5)`}
          </button>
        </div>
      </section>

      {/* Right Panel - Vessel Manifest */}
      <aside className="w-full lg:w-64 xl:w-72 bg-surface-container border-2 border-outline flex flex-col shrink-0">
        <div className="p-3 lg:p-4 border-b-2 border-outline bg-surface-container-high">
          <h3
            className="stencil-text text-on-surface text-sm"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            Manifesto de Embarcações
          </h3>
          <p
            className="text-[10px] text-secondary uppercase mt-0.5"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            AGUARDANDO POSICIONAMENTO
          </p>
        </div>
        <div className="flex lg:flex-col flex-row overflow-x-auto lg:overflow-y-auto p-2 lg:p-3 gap-2 lg:gap-3 lg:flex-1">
          {ships.map((ship) => {
            const isPlaced = placedShips.includes(ship.id);
            const isSelected = selectedShip?.id === ship.id;
            return (
              <button
                key={ship.id}
                onClick={() =>
                  !isPlaced &&
                  !myReady &&
                  setSelectedShip(isSelected ? null : ship)
                }
                disabled={isPlaced || myReady}
                className={`shrink-0 lg:w-full w-32 p-2 lg:p-3 border-2 text-left transition-all relative ${
                  isSelected
                    ? "border-secondary bg-secondary/10"
                    : isPlaced
                      ? "border-outline/30 opacity-50"
                      : "border-outline hover:bg-surface-variant"
                }`}
              >
                {isPlaced && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-secondary text-on-secondary px-2 py-0.5 text-[10px] font-bold">
                      POSICIONADO
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-xs text-on-surface uppercase tracking-wider font-bold"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {ship.name}
                    </p>
                    <p
                      className="text-[10px] text-outline uppercase"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      Tamanho: {ship.size} Unidades
                    </p>
                  </div>
                  <span
                    className="text-xs text-outline"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {isPlaced ? "0" : "1"}/1
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="p-3 border-t-2 border-outline bg-surface-container-low">
          <div className="p-2 border-2 border-dashed border-outline-variant text-center">
            <p
              className="text-[10px] text-outline uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Nota Tática
            </p>
            <p
              className="text-[11px] text-on-surface mt-1 italic"
              style={{ fontFamily: "var(--font-body)" }}
            >
              "Selecione uma embarcação e clique no tabuleiro para
              posicioná-la."
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ===================== PLAYING PHASE =====================
function PlayingPhase({
  myGrid,
  enemyGrid,
  isMyTurn,
  onAttack,
  battleLog,
  hoveredCell,
  setHoveredCell,
  sunkMyCells,
  sunkEnemyCells,
  turnTimer,
  animatedCell,
  myShipTypes,
  enemyShipTypes,
  myNation,
  opponentNation,
  myName,
  opponentName,
}) {
  const logEndRef = useRef(null);

  // Conta navios afundados via sunkCells (cada grupo conectado = 1 navio)
  function countSunkShips(sunkCells) {
    if (!sunkCells || sunkCells.size === 0) return 0;
    const visited = new Set();
    let count = 0;
    for (const key of sunkCells) {
      if (visited.has(key)) continue;
      count++;
      const [startR, startC] = key.split("-").map(Number);
      const stack = [[startR, startC]];
      while (stack.length) {
        const [r, c] = stack.pop();
        const k = `${r}-${c}`;
        if (visited.has(k)) continue;
        visited.add(k);
        if (sunkCells.has(k)) {
          [
            [r - 1, c],
            [r + 1, c],
            [r, c - 1],
            [r, c + 1],
          ].forEach(([nr, nc]) => {
            if (nr >= 0 && nr < 10 && nc >= 0 && nc < 10) stack.push([nr, nc]);
          });
        }
      }
    }
    return count;
  }

  const mySunkCount = countSunkShips(sunkMyCells);
  const enemySunkCount = countSunkShips(sunkEnemyCells);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Battle Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-2 border-outline pb-4 gap-2">
        <div className="flex flex-col">
          <span
            className="text-[10px] text-outline uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Status de Combate
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span
              className={`text-2xl stencil-text ${isMyTurn ? "text-primary" : "text-on-surface-variant"}`}
              style={{ fontFamily: "var(--font-headline)" }}
            >
              {isMyTurn ? "SUA VEZ" : "VEZ DO INIMIGO"}
            </span>
            {isMyTurn && (
              <div
                className={`flex items-center justify-center w-10 h-10 border-2 ${turnTimer <= 5 ? "border-error text-error" : "border-primary text-primary"}`}
              >
                <span
                  className="text-lg font-bold"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {turnTimer}
                </span>
              </div>
            )}
            {isMyTurn && turnTimer <= 5 && (
              <span
                className="text-[10px] text-error uppercase animate-pulse"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                TIRO AUTOMÁTICO IMINENTE
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span
              className="text-[10px] text-outline uppercase block"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Coordenadas do Alvo
            </span>
            <div
              className="text-lg text-secondary mt-0.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {hoveredCell
                ? `${String.fromCharCode(65 + hoveredCell.row)} / ${hoveredCell.col + 1}`
                : "-- / --"}
            </div>
          </div>
          {/* Fleet Status */}
          <div className="flex gap-4">
            <div className="text-center">
              <span
                className="text-[10px] text-outline uppercase block"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Sua Frota
              </span>
              <span
                className="text-lg text-primary font-bold"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {5 - mySunkCount}/5
              </span>
            </div>
            <div className="text-center">
              <span
                className="text-[10px] text-outline uppercase block"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Frota Inimiga
              </span>
              <span
                className="text-lg text-secondary font-bold"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {5 - enemySunkCount}/5
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tactical Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* My Fleet */}
        <div className="border-l-4 border-primary pl-0">
          <Board
            grid={myGrid}
            isOpponent={false}
            disabled={true}
            title={myName ? `${myName.toUpperCase()}` : "SUA FROTA"}
            sunkCells={sunkMyCells}
            animatedCell={animatedCell?.board === "my" ? animatedCell : null}
            shipTypes={myShipTypes}
            nation={myNation}
          />
        </div>

        {/* Enemy Waters */}
        <div className="border-l-4 border-secondary pl-0 relative">
          {!isMyTurn && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[1px] pointer-events-none">
              <div className="flex items-center gap-2 bg-surface-container-high border border-outline-variant px-4 py-2">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                <span
                  className="text-xs text-on-surface-variant uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Aguardando oponente...
                </span>
              </div>
            </div>
          )}
          <Board
            grid={enemyGrid}
            onCellClick={(row, col) => {
              if (isMyTurn) onAttack(row, col);
            }}
            onCellHover={(row, col) =>
              setHoveredCell(row != null ? { row, col } : null)
            }
            isOpponent={true}
            disabled={!isMyTurn}
            title={opponentName ? `${opponentName.toUpperCase()}` : "ÁGUAS INIMIGAS"}
            sunkCells={sunkEnemyCells}
            animatedCell={animatedCell?.board === "enemy" ? animatedCell : null}
            shipTypes={enemyShipTypes}
            nation={opponentNation}
          />
        </div>
      </div>

      {/* Battle Log */}
      <div className="bg-surface-container-low border-2 border-outline p-4 h-40 flex flex-col">
        <div className="flex justify-between items-center mb-3 border-b border-outline/20 pb-2">
          <span
            className="text-xs text-primary uppercase font-bold"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            LOG DE BATALHA // AO VIVO
          </span>
          <span
            className="text-[10px] text-outline"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            ENCRYPTION: AES-256-MIL
          </span>
        </div>
        <div
          className="flex-1 overflow-y-auto space-y-1"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {battleLog.length === 0 ? (
            <p className="text-on-surface-variant text-xs">
              Aguardando dados de combate...
            </p>
          ) : (
            battleLog.map((entry, i) => (
              <p
                key={i}
                className={`text-xs ${
                  entry.message.includes("🎯") || entry.message.includes("🔥")
                    ? "text-secondary"
                    : entry.message.includes("💥")
                      ? "text-error"
                      : entry.message.includes("🏁")
                        ? "text-primary"
                        : "text-on-surface-variant"
                }`}
              >
                [{entry.time.toLocaleTimeString()}] {entry.message}
              </p>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}

// ===================== FINISHED PHASE =====================
function FinishedPhase({ isVictory, onReturn }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-8 max-w-md">
        <div
          className={`inline-flex items-center justify-center w-24 h-24 border-4 ${
            isVictory
              ? "border-secondary text-secondary"
              : "border-error text-error"
          }`}
        >
          <span className="material-symbols-outlined text-5xl">
            {isVictory ? "military_tech" : "dangerous"}
          </span>
        </div>

        <div>
          <h1
            className={`text-4xl stencil-text ${isVictory ? "text-secondary" : "text-error"}`}
            style={{ fontFamily: "var(--font-headline)" }}
          >
            {isVictory ? "OPERAÇÃO BEM-SUCEDIDA" : "OPERAÇÃO FRACASSADA"}
          </h1>
          <p
            className="text-on-surface-variant mt-2 uppercase tracking-widest text-sm"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {isVictory
              ? "Todas as embarcações inimigas neutralizadas. Parabéns, Comandante."
              : "Sua frota foi destruída. Melhor sorte na próxima vez."}
          </p>
        </div>

        <button onClick={onReturn} className="btn-primary text-lg px-8 py-4">
          VOLTAR À BASE
        </button>
      </div>
    </div>
  );
}
