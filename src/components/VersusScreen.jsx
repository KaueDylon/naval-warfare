import { useEffect, useRef, useState } from "react";
import NationIcon from "./NationIcon";
import PortraitImage from "./PortraitImage";
import { NATION_LABELS } from "../constants/nations";

/**
 * Tela de "VS" exibida entre o SETUP e o PLAYING.
 * Mostra ambos os jogadores com suas nações e portraits,
 * anima por alguns segundos, depois chama onComplete para seguir para a batalha.
 */
export default function VersusScreen({
  myName,
  myNation,
  myPortrait,
  opponentName,
  opponentNation,
  opponentPortrait,
  onComplete,
  duration = 5500,
}) {
  const [stage, setStage] = useState(0); // 0: entrada, 1: VS, 2: saída
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 300);
    const t2 = setTimeout(() => setStage(2), duration - 600);
    const t3 = setTimeout(() => onCompleteRef.current(), duration);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [duration]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-500 ${
        stage === 2 ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Fundo com efeito */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 tactical-grid-bg opacity-30" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent animate-pulse" />
      </div>

      <div className="relative flex flex-col items-center w-full max-w-4xl px-4 sm:px-8">
        {/* Jogadores */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-2 sm:gap-4">
          {/* Player A (eu) */}
          <div
            className={`flex flex-col items-center gap-2 sm:gap-4 min-w-0 transition-all duration-700 ${
              stage >= 1
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-20"
            }`}
          >
            <div className="w-20 h-26 sm:w-28 sm:h-36">
              <PortraitImage portrait={myPortrait} size="lg" />
            </div>
            {myNation && (
              <NationIcon nation={myNation} size={36} variant="dark" className="sm:w-12 sm:h-12" />
            )}
            <div className="text-center w-full min-w-0 max-w-full">
              <p
                className="text-lg sm:text-2xl lg:text-3xl text-primary font-bold uppercase tracking-wider truncate px-1"
                style={{ fontFamily: "var(--font-headline)" }}
                title={myName || "COMANDANTE"}
              >
                {myName || "COMANDANTE"}
              </p>
              <p
                className="text-[10px] sm:text-sm text-on-surface-variant uppercase tracking-widest mt-1 truncate"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {myNation ? NATION_LABELS[myNation] : ""}
              </p>
            </div>
          </div>

          {/* VS */}
          <div
            className={`flex flex-col items-center shrink-0 transition-all duration-500 ${
              stage >= 1
                ? "opacity-100 scale-100"
                : "opacity-0 scale-50"
            }`}
          >
            <span
              className="text-5xl sm:text-7xl lg:text-8xl font-black text-secondary"
              style={{
                fontFamily: "var(--font-headline)",
                textShadow: "0 0 40px rgba(218,199,105,0.5)",
              }}
            >
              VS
            </span>
          </div>

          {/* Player B (oponente) */}
          <div
            className={`flex flex-col items-center gap-2 sm:gap-4 min-w-0 transition-all duration-700 ${
              stage >= 1
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-20"
            }`}
          >
            <div className="w-20 h-26 sm:w-28 sm:h-36">
              <PortraitImage portrait={opponentPortrait} size="lg" />
            </div>
            {opponentNation && (
              <NationIcon nation={opponentNation} size={36} variant="dark" className="sm:w-12 sm:h-12" />
            )}
            <div className="text-center w-full min-w-0 max-w-full">
              <p
                className="text-lg sm:text-2xl lg:text-3xl text-error font-bold uppercase tracking-wider truncate px-1"
                style={{ fontFamily: "var(--font-headline)" }}
                title={opponentName || "INIMIGO"}
              >
                {opponentName || "INIMIGO"}
              </p>
              <p
                className="text-[10px] sm:text-sm text-on-surface-variant uppercase tracking-widest mt-1 truncate"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {opponentNation ? NATION_LABELS[opponentNation] : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Subtítulo */}
        <div
          className={`mt-8 sm:mt-12 text-center transition-all duration-700 delay-500 ${
            stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p
            className="text-[10px] sm:text-xs text-on-surface-variant uppercase tracking-[0.3em]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Preparar para combate
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
