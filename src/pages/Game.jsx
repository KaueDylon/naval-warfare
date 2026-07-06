import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import * as ws from '../services/websocket';
import Board from '../components/Board';
import PageHeader, { HeaderDivider } from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';

const SHIPS = [
  { name: 'Porta-Aviões', size: 5, id: 'carrier' },
  { name: 'Navio de Guerra', size: 4, id: 'battleship' },
  { name: 'Cruzador', size: 3, id: 'cruiser' },
  { name: 'Submarino', size: 3, id: 'submarine' },
  { name: 'Destroyer', size: 2, id: 'destroyer' },
];

export default function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const connectedRef = useRef(false);

  const [phase, setPhase] = useState('SETUP');
  const [myGrid, setMyGrid] = useState(createEmptyGrid());
  const [enemyGrid, setEnemyGrid] = useState(createEmptyGrid());
  const [currentTurn, setCurrentTurn] = useState(null);
  const [opponentId, setOpponentId] = useState(null);
  const [winner, setWinner] = useState(null);
  const [myReady, setMyReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);

  const [selectedShip, setSelectedShip] = useState(null);
  const selectedShipRef = useRef(null);
  const [horizontal, setHorizontal] = useState(true);
  const [placedShips, setPlacedShips] = useState([]);
  const placedShipsRef = useRef([]);
  const [setupHoveredCell, setSetupHoveredCell] = useState(null);

  const [battleLog, setBattleLog] = useState([]);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  function createEmptyGrid() {
    return Array.from({ length: 10 }, () => Array(10).fill(0));
  }

  const loadGameState = useCallback(async () => {
    try {
      const state = await api.getGameState(gameId);
      if (state.phase) setPhase(state.phase);
      if (state.currentTurn) setCurrentTurn(state.currentTurn);
      if (state.winner) setWinner(state.winner);

      const oppId = state.playerAId === user.id ? state.playerBId : state.playerAId;
      setOpponentId(oppId);

      if (state.playerAId === user.id) {
        setMyReady(state.playerAReady || false);
        setOpponentReady(state.playerBReady || false);
      } else {
        setMyReady(state.playerBReady || false);
        setOpponentReady(state.playerAReady || false);
      }

      if (state.phase === 'PLAYING' || state.phase === 'FINISHED') {
        const myBoard = await api.getBoard(gameId, user.id);
        setMyGrid(myBoard);
        if (oppId) {
          const oppBoard = await api.getBoard(gameId, oppId);
          setEnemyGrid(oppBoard);
        }
      }
    } catch (err) {
      console.error('Failed to load game state:', err);
      setError('Failed to load game state');
    }
  }, [gameId, user.id]);

  useEffect(() => {
    loadGameState();
    connectWs();
    return () => {
      connectedRef.current = false;
    };
  }, [gameId]);

  useEffect(() => {
    function onKeyDown(e) {
      if (phase !== 'SETUP' || myReady) return;
      if (e.key === 'r' || e.key === 'R') {
        setHorizontal((h) => !h);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, myReady]);

  function connectWs() {
    if (connectedRef.current) return;
    ws.connect(
      token,
      () => {
        connectedRef.current = true;
        setConnected(true);
        ws.subscribePersistent(`/topic/game/${gameId}`, handleGameMessage);
        ws.subscribePersistent('/user/queue/place-result', handlePlaceResult);
        ws.subscribePersistent('/user/queue/errors', (msg) => {
          setError(typeof msg === 'string' ? msg : msg.message || 'Erro desconhecido');
          addLog(`ERRO: ${typeof msg === 'string' ? msg : msg.message}`);
        });
      },
      (err) => {
        console.error('[Game] WS Error:', err);
        connectedRef.current = false;
        setConnected(false);
      }
    );
  }

  function handleGameMessage(message) {
    if (message.type) {
      switch (message.type) {
        case 'PLAYER_READY':
          if (message.playerId === user.id) setMyReady(true);
          else setOpponentReady(true);
          addLog(`Comandante ${message.playerId === user.id ? 'VOCÊ' : 'INIMIGO'} pronto para o combate`);
          break;
        case 'GAME_STARTED':
          setPhase('PLAYING');
          setCurrentTurn(message.playerId);
          addLog('⚓ TODOS OS POSTOS — INICIAR FOGO');
          loadGameState();
          break;
        case 'GAME_OVER':
          setPhase('FINISHED');
          setWinner(message.playerId);
          addLog(`🏁 OPERAÇÃO ENCERRADA — ${message.playerId === user.id ? 'VITÓRIA' : 'DERROTA'}`);
          break;
        case 'PLAYER_SURRENDERED':
          addLog(message.playerId !== user.id ? '⚐ INIMIGO SE RENDEU' : '⚐ VOCÊ ABANDONOU A MISSÃO');
          break;
        case 'PLAYER_DISCONNECTED':
          if (message.playerId !== user.id) addLog('⚠ COMUNICAÇÕES INIMIGAS INTERROMPIDAS');
          break;
        default:
          break;
      }
    } else if (message.status !== undefined && message.row !== undefined) {
      handleAttackResult(message);
    }
  }

  function handleAttackResult(message) {
    const { row, col, attackerId, nextTurn, status } = message;
    const isMyAttack = attackerId === user.id;
    if (nextTurn) setCurrentTurn(nextTurn);

    switch (status) {
      case 'HIT':
      case 'SUNK':
        if (isMyAttack) {
          setEnemyGrid((prev) => { const c = prev.map(r => [...r]); c[row][col] = 3; return c; });
          addLog(`🎯 ${String.fromCharCode(65 + row)}${col + 1} — ${status === 'HIT' ? 'ACERTOU' : 'AFUNDOU'}!`);
        } else {
          setMyGrid((prev) => { const c = prev.map(r => [...r]); c[row][col] = 3; return c; });
          addLog(`💥 ATAQUE RECEBIDO — ${String.fromCharCode(65 + row)}${col + 1} — ${status === 'HIT' ? 'ACERTOU' : 'AFUNDOU'}`);
        }
        if (status === 'SUNK') addLog('🔥 EMBARCAÇÃO DESTRUÍDA');
        break;
      case 'MISS':
        if (isMyAttack) {
          setEnemyGrid((prev) => { const c = prev.map(r => [...r]); c[row][col] = 2; return c; });
          addLog(`💨 ${String.fromCharCode(65 + row)}${col + 1} — ERROU`);
        } else {
          setMyGrid((prev) => { const c = prev.map(r => [...r]); c[row][col] = 2; return c; });
          addLog(`🌊 INIMIGO ERROU — ${String.fromCharCode(65 + row)}${col + 1}`);
        }
        break;
      case 'GAME_OVER':
        setPhase('FINISHED');
        setWinner(attackerId);
        addLog(`🏁 ${attackerId === user.id ? 'VITÓRIA' : 'DERROTA'}`);
        break;
      case 'ATTACKED':
        setError('Posição já atacada');
        break;
      case 'NOT_YOUR_TURN':
        setError('Não é sua vez, Comandante');
        break;
      case 'INVALID_POSITION':
        setError('Coordenadas de alvo inválidas');
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
      const next = typeof updater === 'function' ? updater(prev) : updater;
      placedShipsRef.current = next;
      return next;
    });
  }

  function handlePlaceResult(result) {
    let status = typeof result === 'string' ? result : JSON.stringify(result);
    status = status.replace(/^"|"$/g, '');
    if (status === 'OK') {
      const ship = selectedShipRef.current;
      if (ship) {
        setPlacedShipsSync((prev) => [...prev, ship.id]);
        setSelectedShipSync(null);
      }
      setError('');
      api.getBoard(gameId, user.id).then(setMyGrid).catch(console.error);
      addLog(`Embarcação posicionada (${placedShipsRef.current.length}/5)`);
    } else if (status === 'INVALID') {
      setError('Posicionamento inválido — sobrepõe outra embarcação ou ultrapassa o limite');
    } else if (status === 'BOARD_CLEARED') {
      setPlacedShipsSync([]);
      setMyGrid(createEmptyGrid());
      setSelectedShipSync(null);
      setError('');
      addLog('Tabuleiro limpo — todas as embarcações recolhidas');
    }
  }

  function addLog(message) {
    setBattleLog((prev) => [...prev.slice(-50), { time: new Date(), message }]);
  }

  function handlePlaceShip(row, col) {
    const ship = selectedShipRef.current;
    if (!ship || phase !== 'SETUP' || myReady) return;
    if (horizontal && col + ship.size > 10) {
      setError(`Embarcação não cabe — ultrapassa o limite do tabuleiro`);
      return;
    }
    if (!horizontal && row + ship.size > 10) {
      setError(`Embarcação não cabe — ultrapassa o limite do tabuleiro`);
      return;
    }
    setError('');
    ws.publish(`/app/game/${gameId}/place`, {
      row,
      col,
      size: ship.size,
      orientation: horizontal,
    });
  }

  function handleClearBoard() {
    ws.publish(`/app/game/${gameId}/clear`, {});
  }

  function handleReady() {
    if (placedShipsRef.current.length < 5) {
      setError('Posicione todas as 5 embarcações antes de sinalizar prontidão');
      return;
    }
    ws.publish(`/app/game/${gameId}/ready`, {});
    setMyReady(true);
  }

  function handleAttack(row, col) {
    if (phase !== 'PLAYING' || currentTurn !== user.id) return;
    ws.publish(`/app/game/${gameId}/attack`, { row, col });
  }

  function handleSurrender() {
    if (!confirm('ABANDONAR A MISSÃO? Esta ação não pode ser desfeita.')) return;
    ws.publish(`/app/game/${gameId}/surrender`, {});
  }

  const isMyTurn = currentTurn === user.id;
  const isVictory = winner === user.id;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <PageHeader shrink>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-on-surface-variant uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
            Conexão
          </span>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 ${connected ? 'bg-primary animate-pulse' : 'bg-error'}`}></div>
            <span className={`text-[10px] uppercase ${connected ? 'text-primary' : 'text-error'}`} style={{ fontFamily: 'var(--font-mono)' }}>
              {connected ? 'Linha Segura Ativa' : 'Desconectado'}
            </span>
          </div>
        </div>
        {phase !== 'FINISHED' && (
          <>
            <HeaderDivider />
            <button onClick={handleSurrender} className="btn-danger text-xs px-3 py-1.5">
              Render
            </button>
          </>
        )}
      </PageHeader>

      <AlertBanner type="game-error" message={error} onClose={() => setError('')} />

      {/* Main */}
      <main className="flex-1 overflow-auto p-4">
        {phase === 'SETUP' && (
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
          />
        )}
        {phase === 'PLAYING' && (
          <PlayingPhase
            myGrid={myGrid}
            enemyGrid={enemyGrid}
            isMyTurn={isMyTurn}
            onAttack={handleAttack}
            battleLog={battleLog}
            hoveredCell={hoveredCell}
            setHoveredCell={setHoveredCell}
          />
        )}
        {phase === 'FINISHED' && (
          <FinishedPhase
            isVictory={isVictory}
            onReturn={() => { ws.disconnect(); navigate('/', { replace: true }); }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="flex justify-between items-center px-4 py-1 w-full bg-surface-container-lowest border-t-2 border-outline shrink-0 h-8">
        <span className="text-[10px] text-outline uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
          © 1942 INTEL NAVAL. // CRIPTOGRAFIA: AES-256-MIL
        </span>
        <div className="flex gap-4 items-center">
          <span className="text-[10px] text-secondary uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
            VER: 1.4.2-ALPHA
          </span>
          <span className="text-[10px] text-primary flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)' }}>
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
  myGrid, ships, selectedShip, setSelectedShip, placedShips,
  horizontal, setHorizontal, hoveredCell, setHoveredCell,
  onPlaceShip, onClear, onReady, myReady, opponentReady,
}) {
  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-4 lg:gap-6 h-full">
      {/* Main Board Area */}
      <section className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 flex justify-between items-end border-b-2 border-outline pb-2">
          <div>
            <h1
              className="text-lg stencil-text text-primary"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
            Gráfico Tático: Setor 7-B
            </h1>
            <div className="flex gap-4 mt-1">
              <span
                className="text-[10px] text-secondary bg-secondary-container/30 px-2 py-0.5 border border-secondary/50"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
              COORDINATES: NAV-SYNC
              </span>
              <span className="text-[10px] text-outline" style={{ fontFamily: 'var(--font-mono)' }}>
                STATUS: {myReady ? 'PRONTO' : 'PLANEJANDO'}
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
              onCellHover={!myReady ? (r, c) => setHoveredCell(r != null ? { row: r, col: c } : null) : undefined}
              isOpponent={false}
              disabled={myReady}
              ghostShip={selectedShip && !myReady ? { size: selectedShip.size, horizontal } : null}
              hoveredCell={hoveredCell}
            />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="mt-4 p-4 border-2 border-outline-variant bg-surface-container flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-outline uppercase" style={{ fontFamily: 'var(--font-mono)' }}>Comandos</span>
              <div className="flex gap-3 mt-1">
                <button
                  onClick={() => setHorizontal(!horizontal)}
                  disabled={myReady}
                  className="text-on-surface text-xs flex items-center gap-1 disabled:opacity-40"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  <kbd className="bg-surface-variant px-1.5 py-0.5 border border-outline text-[10px]">R</kbd>
                  {horizontal ? 'HORIZONTAL' : 'VERTICAL'}
                </button>
                <button
                  onClick={onClear}
                  disabled={myReady}
                  className="text-on-surface text-xs flex items-center gap-1 disabled:opacity-40"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  <kbd className="bg-surface-variant px-1.5 py-0.5 border border-outline text-[10px]">C</kbd>
                  LIMPAR
                </button>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-outline uppercase" style={{ fontFamily: 'var(--font-mono)' }}>Status</span>
              <div className="flex gap-2 items-center mt-1">
                <div className={`w-2 h-2 ${opponentReady ? 'bg-primary' : 'bg-secondary animate-pulse'}`} style={{ opacity: 0.6 }}></div>
                <span className="text-secondary text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
                  {opponentReady ? 'INIMIGO PRONTO' : 'AGUARDANDO INIMIGO...'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onReady}
            disabled={myReady || placedShips.length < 5}
            className="btn-primary px-8 py-3 text-base disabled:opacity-40"
          >
            {myReady ? 'EM ESPERA' : `POSICIONAR FROTA (${placedShips.length}/5)`}
          </button>
        </div>
      </section>

      {/* Right Panel - Vessel Manifest */}
      <aside className="w-full lg:w-64 xl:w-72 bg-surface-container border-2 border-outline flex flex-col shrink-0">
        <div className="p-3 lg:p-4 border-b-2 border-outline bg-surface-container-high">
          <h3
            className="stencil-text text-on-surface text-sm"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            Manifesto de Embarcações
          </h3>
          <p className="text-[10px] text-secondary uppercase mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
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
                onClick={() => !isPlaced && !myReady && setSelectedShip(isSelected ? null : ship)}
                disabled={isPlaced || myReady}
                className={`shrink-0 lg:w-full w-32 p-2 lg:p-3 border-2 text-left transition-all relative ${
                  isSelected
                    ? 'border-secondary bg-secondary/10'
                    : isPlaced
                      ? 'border-outline/30 opacity-50'
                      : 'border-outline hover:bg-surface-variant'
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
                    <p className="text-xs text-on-surface uppercase tracking-wider font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                      {ship.name}
                    </p>
                    <p className="text-[10px] text-outline uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                      Tamanho: {ship.size} Unidades
                    </p>
                  </div>
                  <span className="text-xs text-outline" style={{ fontFamily: 'var(--font-mono)' }}>
                    {isPlaced ? '0' : '1'}/1
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="p-3 border-t-2 border-outline bg-surface-container-low">
          <div className="p-2 border-2 border-dashed border-outline-variant text-center">
            <p className="text-[10px] text-outline uppercase" style={{ fontFamily: 'var(--font-mono)' }}>Nota Tática</p>
            <p className="text-[11px] text-on-surface mt-1 italic" style={{ fontFamily: 'var(--font-body)' }}>
              "Selecione uma embarcação e clique no tabuleiro para posicioná-la."
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ===================== PLAYING PHASE =====================
function PlayingPhase({ myGrid, enemyGrid, isMyTurn, onAttack, battleLog, hoveredCell, setHoveredCell }) {
  const logEndRef = useRef(null);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Battle Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-2 border-outline pb-4 gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-outline uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
            Status de Combate
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span
              className={`text-2xl stencil-text ${isMyTurn ? 'text-primary' : 'text-on-surface-variant'}`}
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {isMyTurn ? 'SUA VEZ' : 'VEZ DO INIMIGO'}
            </span>
            {isMyTurn && <div className="w-4 h-4 bg-primary animate-ping rounded-full"></div>}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] text-outline uppercase block" style={{ fontFamily: 'var(--font-mono)' }}>
              Coordenadas do Alvo
            </span>
            <div className="text-lg text-secondary mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
              {hoveredCell
                ? `${String.fromCharCode(65 + hoveredCell.row)} / ${hoveredCell.col + 1}`
                : '-- / --'}
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
            title="SUA FROTA"
          />
        </div>

        {/* Enemy Waters */}
        <div className="border-l-4 border-secondary pl-0">
          <Board
            grid={enemyGrid}
            onCellClick={(row, col) => { if (isMyTurn) onAttack(row, col); }}
            onCellHover={(row, col) => setHoveredCell(row != null ? { row, col } : null)}
            isOpponent={true}
            disabled={!isMyTurn}
            title="ÁGUAS INIMIGAS"
          />
        </div>
      </div>

      {/* Battle Log */}
      <div className="bg-surface-container-low border-2 border-outline p-4 h-40 flex flex-col">
        <div className="flex justify-between items-center mb-3 border-b border-outline/20 pb-2">
          <span className="text-xs text-primary uppercase font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
            LOG DE BATALHA // AO VIVO
          </span>
          <span className="text-[10px] text-outline" style={{ fontFamily: 'var(--font-mono)' }}>
            ENCRYPTION: AES-256-MIL
          </span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1" style={{ fontFamily: 'var(--font-mono)' }}>
          {battleLog.length === 0 ? (
            <p className="text-on-surface-variant text-xs">Aguardando dados de combate...</p>
          ) : (
            battleLog.map((entry, i) => (
              <p key={i} className={`text-xs ${
                entry.message.includes('🎯') || entry.message.includes('🔥') ? 'text-secondary' :
                entry.message.includes('💥') ? 'text-error' :
                entry.message.includes('🏁') ? 'text-primary' : 'text-on-surface-variant'
              }`}>
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
            isVictory ? 'border-secondary text-secondary' : 'border-error text-error'
          }`}
        >
          <span className="material-symbols-outlined text-5xl">
            {isVictory ? 'military_tech' : 'dangerous'}
          </span>
        </div>

        <div>
          <h1
            className={`text-4xl stencil-text ${isVictory ? 'text-secondary' : 'text-error'}`}
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            {isVictory ? 'OPERAÇÃO BEM-SUCEDIDA' : 'OPERAÇÃO FRACASSADA'}
          </h1>
          <p
            className="text-on-surface-variant mt-2 uppercase tracking-widest text-sm"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {isVictory
              ? 'Todas as embarcações inimigas neutralizadas. Parabéns, Comandante.'
              : 'Sua frota foi destruída. Melhor sorte na próxima vez.'}
          </p>
        </div>

        <button onClick={onReturn} className="btn-primary text-lg px-8 py-4">
          VOLTAR À BASE
        </button>
      </div>
    </div>
  );
}
