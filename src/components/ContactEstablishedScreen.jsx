import { useEffect, useRef, useState } from "react";
import NationIcon from "./NationIcon";
import { NATION_LABELS } from "../constants/nations";

/**
 * Tela de transição exibida quando um oponente é encontrado na sala de espera,
 * antes de navegar para a fase de posicionamento de navios (Setup).
 *
 * Diferente do VersusScreen (que aparece entre Setup e Playing e já conhece
 * nação/portrait de ambos), esta tela é mais curta e tolerante a dados parciais —
 * o oponente pode ainda não ter nação definida quando entra na sala.
 *
 * Estágios:
 *  0: entrada (radar ping + texto "CONTATO DETECTADO")
 *  1: revelação do nome/nação do oponente
 *  2: saída (fade out antes de navegar)
 */
export default function ContactEstablishedScreen({
  opponentName,
  opponentNation,
  duration = 2200,
  onComplete,
}) {
  const [stage, setStage] = useState(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 250);
    const t2 = setTimeout(() => setStage(2), duration - 500);
    const t3 = setTimeout(() => onCompleteRef.current?.(), duration);
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
      role="status"
      aria-live="polite"
    >
      {/* Fundo com efeito de radar */}
      <div className="absolute inset-0 overflow-hidden tactical-grid-bg opacity-30" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent animate-pulse" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent animate-pulse" />

      <div className="relative flex flex-col items-center px-6 text-center">
        {/* Anel de radar pulsante */}
        <div
          className={`relative w-24 h-24 sm:w-28 sm:h-28 mb-8 transition-all duration-500 ${
            stage >= 1 ? "scale-90 opacity-70" : "scale-100 opacity-100"
          }`}
        >
          <div className="absolute inset-0 border-2 border-secondary/40 rounded-full" />
          <div className="absolute inset-0 border-2 border-secondary rounded-full animate-ping-slow" />
          <div className="absolute inset-3 border border-secondary/60 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-4xl sm:text-5xl">
              radar
            </span>
          </div>
        </div>

        {/* Texto de status */}
        <p
          className={`text-xs sm:text-sm text-secondary uppercase tracking-[0.3em] mb-3 transition-opacity duration-300 ${
            stage >= 1 ? "opacity-40" : "opacity-100"
          }`}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Contato Detectado
        </p>

        {/* Revelação do oponente */}
        <div
          className={`flex flex-col items-center gap-3 transition-all duration-500 ${
            stage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          {opponentNation && (
            <NationIcon nation={opponentNation} size={40} variant="dark" />
          )}
          <p
            className="text-xl sm:text-3xl text-primary font-bold uppercase tracking-wider"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            {opponentName || "COMANDANTE INIMIGO"}
          </p>
          <p
            className="text-[10px] sm:text-xs text-on-surface-variant uppercase tracking-widest"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {opponentNation
              ? NATION_LABELS[opponentNation]
              : "Preparando para o combate"}
          </p>
        </div>
      </div>
    </div>
  );
}
