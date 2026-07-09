import { useEffect, useRef, useState } from 'react';
import { NATION_FLAGS, NATION_LABELS } from '../constants/nations';

/**
 * Overlay de abertura de batalha.
 * Exibe os dois comandantes frente a frente com um VS no meio.
 * Some automaticamente após `duration` ms, ou ao clicar.
 */
export default function BattleIntro({ me, opponent, onDismiss, duration = 3500 }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const dismissedRef = useRef(false);
  const onDismissRef = useRef(onDismiss);

  // Mantém ref atualizada para evitar stale closure no setTimeout
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 50);
    const exitTimer  = setTimeout(() => triggerDismiss(), duration);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  function triggerDismiss() {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setLeaving(true);
    setTimeout(() => onDismissRef.current(), 500);
  }

  const show = visible && !leaving;

  return (
    <div
      onClick={triggerDismiss}
      style={{ transition: 'opacity 0.5s', opacity: show ? 1 : 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm cursor-pointer"
    >
      {/* Linha central decorativa */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-outline-variant/30" />

      <div className="relative flex items-center justify-center w-full max-w-3xl px-6 gap-4">
        <CommanderCard player={me}       align="left"  show={show} label="VOCÊ"    delay={100} />

        {/* VS */}
        <div
          className="shrink-0 flex flex-col items-center justify-center w-20 z-10"
          style={{
            transition: 'opacity 0.7s 0.3s, transform 0.7s 0.3s',
            opacity:    show ? 1 : 0,
            transform:  show ? 'scale(1)' : 'scale(0.4)',
          }}
        >
          <div className="border-4 border-error bg-background px-3 py-1 rotate-[-3deg]">
            <span
              className="text-error text-3xl font-black tracking-widest"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              VS
            </span>
          </div>
          <span
            className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-3"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            BATALHA NAVAL
          </span>
        </div>

        <CommanderCard player={opponent} align="right" show={show} label="INIMIGO" delay={200} />
      </div>

      {/* Hint */}
      <p
        className="absolute bottom-8 text-[10px] text-on-surface-variant uppercase tracking-widest"
        style={{ transition: 'opacity 0.5s 0.7s', opacity: show ? 0.6 : 0, fontFamily: 'var(--font-mono)' }}
      >
        Toque para continuar
      </p>
    </div>
  );
}

function CommanderCard({ player, align, show, label, delay }) {
  const isLeft = align === 'left';

  return (
    <div
      className={`flex-1 flex ${isLeft ? 'flex-row' : 'flex-row-reverse'} items-center gap-4`}
      style={{
        transition: `opacity 0.7s ${delay}ms, transform 0.7s ${delay}ms`,
        opacity:    show ? 1 : 0,
        transform:  show ? 'translateX(0)' : `translateX(${isLeft ? '-60px' : '60px'})`,
      }}
    >
      {/* Portrait */}
      <div className="relative shrink-0">
        <div className="w-24 h-32 sm:w-32 sm:h-44 border-4 border-outline-variant bg-surface-container-high flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">
            person
          </span>
        </div>
        {player?.nation && (
          <div className="absolute -bottom-2 -right-2 bg-surface-container-highest border-2 border-outline-variant px-2 py-0.5 text-base leading-none">
            {NATION_FLAGS[player.nation]}
          </div>
        )}
      </div>

      {/* Info */}
      <div className={`flex flex-col ${isLeft ? 'items-start' : 'items-end'} min-w-0`}>
        <span
          className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {label}
        </span>
        <p
          className="text-lg sm:text-xl font-bold text-on-surface uppercase tracking-wide truncate max-w-[140px] sm:max-w-[180px]"
          style={{ fontFamily: 'var(--font-headline)' }}
        >
          {player?.name ?? '???'}
        </p>
        <p
          className="text-xs text-secondary mt-1 uppercase tracking-wider"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {player?.nation
            ? `${NATION_FLAGS[player.nation]} ${NATION_LABELS[player.nation]}`
            : 'SEM NAÇÃO'}
        </p>
        {player?.portrait && (
          <p
            className="text-[10px] text-on-surface-variant mt-0.5 uppercase"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {player.portrait.replace(/_/g, ' ')}
          </p>
        )}
      </div>
    </div>
  );
}
