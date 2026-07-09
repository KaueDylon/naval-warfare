import { useEffect, useState } from 'react';
import { NATION_FLAGS, NATION_LABELS } from '../constants/nations';

/**
 * Overlay de abertura de batalha.
 * Exibe os dois comandantes frente a frente com um VS no meio.
 * Some automaticamente após `duration` ms, ou ao clicar.
 */
export default function BattleIntro({ me, opponent, onDismiss, duration = 3500 }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Pequeno delay para garantir que a animação de entrada dispare
    const enterTimer = setTimeout(() => setVisible(true), 50);
    const exitTimer = setTimeout(() => dismiss(), duration);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  function dismiss() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => onDismiss(), 600);
  }

  return (
    <div
      onClick={dismiss}
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        bg-background/90 backdrop-blur-sm
        transition-opacity duration-500
        ${visible && !leaving ? 'opacity-100' : 'opacity-0'}
        cursor-pointer
      `}
    >
      {/* Linha horizontal de fundo */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-outline-variant opacity-30" />

      <div className="relative flex items-center justify-center w-full max-w-3xl px-4 gap-0">
        {/* Jogador — EU */}
        <CommanderCard
          player={me}
          align="left"
          visible={visible}
          label="VOCÊ"
        />

        {/* VS */}
        <div className={`
          shrink-0 flex flex-col items-center justify-center w-24 z-10
          transition-all duration-700 delay-300
          ${visible && !leaving ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
        `}>
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

        {/* Jogador — OPONENTE */}
        <CommanderCard
          player={opponent}
          align="right"
          visible={visible}
          label="OPONENTE"
        />
      </div>

      {/* Hint de fechar */}
      <p
        className={`
          absolute bottom-8 text-[10px] text-on-surface-variant uppercase tracking-widest
          transition-opacity duration-500 delay-700
          ${visible && !leaving ? 'opacity-60' : 'opacity-0'}
        `}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        Toque para continuar
      </p>
    </div>
  );
}

function CommanderCard({ player, align, visible, label, leaving }) {
  const isLeft = align === 'left';

  const translateClass = visible && !leaving
    ? 'opacity-100 translate-x-0'
    : isLeft
      ? 'opacity-0 -translate-x-16'
      : 'opacity-0 translate-x-16';

  return (
    <div className={`
      flex-1 flex ${isLeft ? 'flex-row' : 'flex-row-reverse'} items-center
      gap-4 transition-all duration-700
      ${isLeft ? 'delay-100' : 'delay-200'}
      ${translateClass}
    `}>
      {/* Portrait */}
      <div className="relative shrink-0">
        <div className="w-24 h-32 sm:w-32 sm:h-44 border-4 border-outline-variant bg-surface-container-high flex items-center justify-center grayscale">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">
            person
          </span>
        </div>
        {/* Badge de nação no canto */}
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
            className="text-[10px] text-on-surface-variant mt-0.5 uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {player.portrait.replace(/_/g, ' ')}
          </p>
        )}
      </div>
    </div>
  );
}
