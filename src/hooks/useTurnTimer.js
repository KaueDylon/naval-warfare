import { useEffect, useRef, useState } from "react";

const TURN_DURATION = 15;

/**
 * Timer de turno — contagem regressiva de TURN_DURATION segundos enquanto
 * for a vez do jogador local. Ao zerar, chama `onTimeout` (ex.: disparar um
 * tiro automático) e o timer some/reseta até o próximo turno.
 *
 * `turnEpoch` deve ser incrementado pelo chamador sempre que o turno do
 * jogador recomeça sem trocar `currentTurn`/`phase` (ex.: após um ataque que
 * resulta em HIT/MISS mas o turno continua sendo do próprio jogador) — isso
 * força o timer a resetar para TURN_DURATION.
 */
export function useTurnTimer({ phase, currentTurn, userId, turnEpoch, onTimeout }) {
  const [turnTimer, setTurnTimer] = useState(TURN_DURATION);
  const timerRef = useRef(null);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (phase !== "PLAYING" || currentTurn !== userId) {
      setTurnTimer(TURN_DURATION);
      return;
    }

    setTurnTimer(TURN_DURATION);
    timerRef.current = setInterval(() => {
      setTurnTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          onTimeoutRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentTurn, userId, turnEpoch]);

  return turnTimer;
}
