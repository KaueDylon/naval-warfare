import { useRef } from "react";
import Board from "../Board";
import { countSunkShips } from "../../utils/gameBoard";

/**
 * Fase de combate. Exibe o tabuleiro próprio e do inimigo lado a lado,
 * status de turno/timer e o log de batalha.
 */
export default function PlayingPhase({
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
