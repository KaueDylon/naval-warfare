import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import * as ws from '../services/websocket';
import Board from '../components/Board';

const SHIPS = [
  { name: 'Carrier', size: 5, id: 'carrier' },
  { name: 'Battleship', size: 4, id: 'battleship' },
  { name: 'Cruiser', size: 3, id: 'cruiser' },
  { name: 'Submarine', size: 3, id: 'submarine' },
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
    return () => {};
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
          setError(typeof msg === 'string' ? msg : msg.message || 'Unknown error');
          addLog(`ERROR: ${typeof msg === 'string' ? msg : msg.message}`);
        });
      },
      (err) => {
        console.error('[Game] WS Error:', err);
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
          addLog(`Commander ${message.playerId === user.id ? 'YOU' : 'ENEMY'} ready for engagement`);
          break;
        case 'GAME_STARTED':
          setPhase('PLAYING');
          setCurrentTurn(message.playerId);
          addLog('⚓ ALL STATIONS — COMMENCE FIRING');
          loadGameState();
          break;
        case 'GAME_OVER':
          setPhase('FINISHED');
          setWinner(message.playerId);
          addLog(`🏁 OPERATION COMPLETE — ${message.playerId === user.id ? 'VICTORY' : 'DEFEAT'}`);
          break;
        case 'PLAYER_SURRENDERED':
          addLog(message.playerId !== user.id ? '⚐ ENEMY HAS SURRENDERED' : '⚐ YOU ABANDONED THE MISSION');
          break;
        case 'PLAYER_DISCONNECTED':
          if (message.playerId !== user.id) addLog('⚠ ENEMY COMMUNICATIONS SEVERED');
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
          addLog(`🎯 ${String.fromCharCode(65 + row)}${col + 1} — ${status}!`);
        } else {
          setMyGrid((prev) => { const c = prev.map(r => [...r]); c[row][col] = 3; return c; });
          addLog(`💥 INCOMING — ${String.fromCharCode(65 + row)}${col + 1} — ${status}`);
        }
        if (status === 'SUNK') addLog('🔥 VESSEL DESTROYED');
        break;
      case 'MISS':
        if (isMyAttack) {
          setEnemyGrid((prev) => { const c = prev.map(r => [...r]); c[row][col] = 2; return c; });
          addLog(`💨 ${String.fromCharCode(65 + row)}${col + 1} — MISS`);
        } else {
          setMyGrid((prev) => { const c = prev.map(r => [...r]); c[row][col] = 2; return c; });
          addLog(`🌊 ENEMY MISSED — ${String.fromCharCode(65 + row)}${col + 1}`);
        }
        break;
      case 'GAME_OVER':
        setPhase('FINISHED');
        setWinner(attackerId);
        addLog(`🏁 ${attackerId === user.id ? 'VICTORY' : 'DEFEAT'}`);
        break;
      case 'ATTACKED':
        setError('Position already targeted');
        break;
      case 'NOT_YOUR_TURN':
        setError('Not your turn, Commander');
        break;
      case 'INVALID_POSITION':
        setError('Invalid target coordinates');
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
      addLog(`Vessel deployed (${placedShipsRef.current.length}/5)`);
    } else if (status === 'INVALID') {
      setError('Invalid placement — position overlaps or exceeds grid');
    } else if (status === 'BOARD_CLEARED') {
      setPlacedShipsSync([]);
      setMyGrid(createEmptyGrid());
      setSelectedShipSync(null);
      setError('');
      addLog('Board cleared — all vessels recalled');
    }
  }

  function addLog(message) {
    setBattleLog((prev) => [...prev.slice(-50), { time: new Date(), message }]);
  }

  function handlePlaceShip(row, col) {
    const ship = selectedShipRef.current;
    if (!ship || phase !== 'SETUP' || myReady) return;
    if (horizontal && col + ship.size > 10) {
      setError(`Vessel doesn't fit — exceeds grid boundary`);
      return;
    }
    if (!horizontal && row + ship.size > 10) {
      setError(`Vessel doesn't fit — exceeds grid boundary`);
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
      setError('Deploy all 5 vessels before signaling ready');
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
    if (!confirm('ABANDON MISSION? This cannot be undone.')) return;
    ws.publish(`/app/game/${gameId}/surrender`, {});
  }

  const isMyTurn = currentTurn === user.id;
  const isVictory = winner === user.id;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-outline-variant px-6 h-16 flex items-center bg-surface-container-lowest shrink-0">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <h1
            className="text-xl md:text-2xl stencil-text text-primary"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            PACIFIC.COMMAND
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-on-surface-variant uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                Connection
              </span>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 ${connected ? 'bg-primary animate-pulse' : 'bg-error'}`}></div>
                <span className={`text-[10px] uppercase ${connected ? 'text-primary' : 'text-error'}`} style={{ fontFamily: 'var(--font-mono)' }}>
                  {connected ? 'Secure Line Active' : 'Disconnected'}
                </span>
              </div>
            </div>
            {phase !== 'FINISHED' && (
              <>
                <div className="h-8 w-px bg-outline-variant mx-1"></div>
                <button
                  onClick={handleSurrender}
                  className="btn-danger text-xs px-3 py-1.5"
                >
                  Surrender
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Error Bar */}
      {error && (
        <div className="bg-error/10 border-b border-error px-4 py-2 flex items-center justify-between shrink-0">
          <p className="text-error text-xs" style={{ fontFamily: 'var(--font-mono)' }}>{error}</p>
          <button onClick={() => setError('')} className="text-error">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

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
          © 1942 NAVAL INTEL. // ENCRYPTION: AES-256-MIL
        </span>
        <div className="flex gap-4 items-center">
          <span className="text-[10px] text-secondary uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
            VER: 1.4.2-ALPHA
          </span>
          <span className="text-[10px] text-primary flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)' }}>
            <span className="material-symbols-outlined text-[12px]">lock</span>
            SECURE LINE
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
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 h-full">
      {/* Main Board Area */}
      <section className="flex-1 flex flex-col">
        <div className="mb-4 flex justify-between items-end border-b-2 border-outline pb-2">
          <div>
            <h1
              className="text-lg stencil-text text-primary"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              Tactical Chart: Sector 7-B
            </h1>
            <div className="flex gap-4 mt-1">
              <span
                className="text-[10px] text-secondary bg-secondary-container/30 px-2 py-0.5 border border-secondary/50"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                COORDINATES: NAV-SYNC
              </span>
              <span className="text-[10px] text-outline" style={{ fontFamily: 'var(--font-mono)' }}>
                STATUS: {myReady ? 'READY' : 'PLOTTING'}
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
              onCellHover={!myReady ? setHoveredCell : undefined}
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
              <span className="text-[10px] text-outline uppercase" style={{ fontFamily: 'var(--font-mono)' }}>Commands</span>
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
                  CLEAR
                </button>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-outline uppercase" style={{ fontFamily: 'var(--font-mono)' }}>Status</span>
              <div className="flex gap-2 items-center mt-1">
                <div className={`w-2 h-2 ${opponentReady ? 'bg-primary' : 'bg-secondary animate-pulse'}`} style={{ opacity: 0.6 }}></div>
                <span className="text-secondary text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
                  {opponentReady ? 'ENEMY READY' : 'AWAITING ENEMY...'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onReady}
            disabled={myReady || placedShips.length < 5}
            className="btn-primary px-8 py-3 text-base disabled:opacity-40"
          >
            {myReady ? 'STANDING BY' : `DEPLOY FLEET (${placedShips.length}/5)`}
          </button>
        </div>
      </section>

      {/* Right Panel - Vessel Manifest */}
      <aside className="w-full lg:w-72 bg-surface-container border-2 border-outline flex flex-col shrink-0">
        <div className="p-4 border-b-2 border-outline bg-surface-container-high">
          <h3
            className="stencil-text text-on-surface text-sm"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            Vessel Manifest
          </h3>
          <p className="text-[10px] text-secondary uppercase mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
            AWAITING DEPLOYMENT
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {ships.map((ship) => {
            const isPlaced = placedShips.includes(ship.id);
            const isSelected = selectedShip?.id === ship.id;
            return (
              <button
                key={ship.id}
                onClick={() => !isPlaced && !myReady && setSelectedShip(isSelected ? null : ship)}
                disabled={isPlaced || myReady}
                className={`w-full p-3 border-2 text-left transition-all relative ${
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
                      DEPLOYED
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-on-surface uppercase tracking-wider font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                      {ship.name}
                    </p>
                    <p className="text-[10px] text-outline uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
                      Size: {ship.size} Units
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
            <p className="text-[10px] text-outline uppercase" style={{ fontFamily: 'var(--font-mono)' }}>Tactical Note</p>
            <p className="text-[11px] text-on-surface mt-1 italic" style={{ fontFamily: 'var(--font-body)' }}>
              "Select a vessel, then click on the grid to place it."
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
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [battleLog]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Battle Header */}
      <div className="flex justify-between items-end border-b-2 border-outline pb-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-outline uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
            Combat Status
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span
              className={`text-2xl stencil-text ${isMyTurn ? 'text-primary' : 'text-on-surface-variant'}`}
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {isMyTurn ? 'YOUR TURN' : 'ENEMY TURN'}
            </span>
            {isMyTurn && <div className="w-4 h-4 bg-primary animate-ping rounded-full"></div>}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] text-outline uppercase block" style={{ fontFamily: 'var(--font-mono)' }}>
              Target Coordinates
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* My Fleet */}
        <div className="border-l-4 border-primary pl-0">
          <Board
            grid={myGrid}
            isOpponent={false}
            disabled={true}
            title="YOUR FLEET"
          />
        </div>

        {/* Enemy Waters */}
        <div
          className="border-l-4 border-secondary pl-0"
          onMouseLeave={() => setHoveredCell(null)}
        >
          <Board
            grid={enemyGrid}
            onCellClick={(row, col) => { if (isMyTurn) onAttack(row, col); }}
            onCellHover={(row, col) => setHoveredCell({ row, col })}
            isOpponent={true}
            disabled={!isMyTurn}
            title="ENEMY WATERS"
          />
        </div>
      </div>

      {/* Battle Log */}
      <div className="bg-surface-container-low border-2 border-outline p-4 h-40 flex flex-col">
        <div className="flex justify-between items-center mb-3 border-b border-outline/20 pb-2">
          <span className="text-xs text-primary uppercase font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
            BATTLE LOG // LIVE STREAM
          </span>
          <span className="text-[10px] text-outline" style={{ fontFamily: 'var(--font-mono)' }}>
            ENCRYPTION: AES-256-MIL
          </span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1" style={{ fontFamily: 'var(--font-mono)' }}>
          {battleLog.length === 0 ? (
            <p className="text-on-surface-variant text-xs">Awaiting combat data...</p>
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
            {isVictory ? 'OPERATION SUCCESSFUL' : 'OPERATION FAILED'}
          </h1>
          <p
            className="text-on-surface-variant mt-2 uppercase tracking-widest text-sm"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {isVictory
              ? 'All enemy vessels neutralized. Well done, Commander.'
              : 'Your fleet has been destroyed. Better luck next time.'}
          </p>
        </div>

        <button onClick={onReturn} className="btn-primary text-lg px-8 py-4">
          RETURN TO BASE
        </button>
      </div>
    </div>
  );
}
