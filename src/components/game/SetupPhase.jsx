import { useEffect } from "react";
import Board from "../Board";
import Button from "../Button";
import { getShipInfo } from "../../constants/shipNames";
import ShipHistoryTooltip from "../ShipHistoryTooltip";
import * as sfx from "../../services/sounds";

/**
 * Fase de posicionamento de navios. Exibe o tabuleiro próprio, o manifesto
 * de embarcações disponíveis e os controles de orientação/limpeza/pronto.
 */
export default function SetupPhase({
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
  // Trilha ambiente de sala de guerra tática — toca só enquanto o jogador
  // está posicionando a frota. Para com fade-out ao saltar de fase.
  useEffect(() => {
    sfx.startWarRoomAmbience();
    return () => sfx.stopWarRoomAmbience();
  }, []);

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

          <Button
            onClick={onReady}
            disabled={myReady || placedShips.length < 5}
            withSound
            className="px-8 py-3 text-base disabled:opacity-40"
          >
            {myReady
              ? "EM ESPERA"
              : `POSICIONAR FROTA (${placedShips.length}/5)`}
          </Button>
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
            const shipInfo = getShipInfo(myNation, ship.id.toUpperCase());
            return (
              <button
                key={ship.id}
                onClick={() =>
                  !isPlaced &&
                  !myReady &&
                  setSelectedShip(isSelected ? null : ship)
                }
                disabled={isPlaced || myReady}
                className={`shrink-0 lg:w-full w-36 p-2 lg:p-3 border-2 text-left transition-all relative ${
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
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs text-on-surface uppercase tracking-wider font-bold"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {ship.name}
                    </p>
                    {shipInfo && (
                      <p
                        className="text-[11px] text-secondary font-bold truncate mt-0.5"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        » {shipInfo.name}
                      </p>
                    )}
                    <p
                      className="text-[10px] text-outline uppercase mt-0.5"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      Tamanho: {ship.size} Unidades
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1 ml-2 shrink-0">
                    <span
                      className="text-xs text-outline"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {isPlaced ? "0" : "1"}/1
                    </span>
                    {shipInfo && (
                      <ShipHistoryTooltip history={shipInfo.history} />
                    )}
                  </div>
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
