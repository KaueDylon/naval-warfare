import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import * as ws from "../services/websocket";
import VersusScreen from "../components/VersusScreen";
import PageHeader, { HeaderDivider } from "../components/PageHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import AlertBanner from "../components/AlertBanner";
import SetupPhase from "../components/game/SetupPhase";
import PlayingPhase from "../components/game/PlayingPhase";
import FinishedPhase from "../components/game/FinishedPhase";
import { useGameConnection } from "../hooks/useGameConnection";
import { useOpponentResolver } from "../hooks/useOpponentResolver";

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

  const [setupHoveredCell, setSetupHoveredCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);

  const {
    phase,
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
    setOpponentId,
    winner,
    myReady,
    opponentReady,
    opponentDisconnected,
    showVersus,
    setShowVersus,
    setPhase,
    selectedShip,
    setSelectedShip,
    horizontal,
    setHorizontal,
    placedShips,
    battleLog,
    error,
    setError,
    connected,
    turnTimer,
    animatedCell,
    handlePlaceShip,
    handleClearBoard,
    handleReady,
    handleAttack,
    confirmSurrender,
  } = useGameConnection({ gameId, user, token });

  const { opponentNation, opponentName, opponentPortrait } = useOpponentResolver({
    gameId,
    phase,
    userId: user.id,
    opponentId,
    resolveOpponentId: setOpponentId,
    enemyGrid,
    setEnemyGrid,
    setEnemyShipTypes,
    setSunkEnemyCells,
  });

  // Fade-in suave ao montar a tela (evita "corte" abrupto vindo da transição do Room)
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Remove chaves órfãs de partidas antigas do sessionStorage (game_<outroId>_*).
  // Evita acúmulo indefinido quando o jogador sai da partida sem passar pelo
  // fluxo de "voltar ao lobby" (fechar aba, rendição, navegação direta por URL etc.)
  useEffect(() => {
    const prefix = "game_";
    const currentPrefix = `game_${gameId}_`;
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(prefix) && !key.startsWith(currentPrefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  }, [gameId]);

  function handleSurrender() {
    setShowSurrenderConfirm(true);
  }

  function handleConfirmSurrender() {
    setShowSurrenderConfirm(false);
    confirmSurrender();
  }

  function handleReturnToLobby() {
    ws.disconnect();
    sessionStorage.removeItem(`game_${gameId}_oppId`);
    sessionStorage.removeItem(`game_${gameId}_oppNation`);
    sessionStorage.removeItem(`game_${gameId}_oppName`);
    sessionStorage.removeItem(`game_${gameId}_oppPortrait`);
    navigate("/", { replace: true });
  }

  const isMyTurn = currentTurn === user.id;
  const isVictory = winner === user.id;

  return (
    <div
      className={`min-h-screen bg-background flex flex-col overflow-hidden transition-opacity duration-500 ease-out ${
        entered ? "opacity-100" : "opacity-0"
      }`}
    >
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
      <ConfirmDialog
        open={showSurrenderConfirm}
        title="ABANDONAR A MISSÃO?"
        message="Esta ação é irreversível. Você será registrado como derrotado e o oponente vencerá automaticamente."
        confirmText="SE RENDER"
        cancelText="VOLTAR AO COMBATE"
        variant="danger"
        onConfirm={handleConfirmSurrender}
        onCancel={() => setShowSurrenderConfirm(false)}
      />
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
            setSelectedShip={setSelectedShip}
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
          <FinishedPhase isVictory={isVictory} onReturn={handleReturnToLobby} />
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
