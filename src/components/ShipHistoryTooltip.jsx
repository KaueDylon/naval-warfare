import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Botão "?" que exibe popover com a história do navio.
 * Funciona com hover (desktop) e touch (mobile).
 * Renderiza via portal para ficar acima de qualquer overflow/z-index.
 */
export default function ShipHistoryTooltip({ history }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);
  const buttonRef = useRef(null);

  // Calcula posição do popover relativo ao viewport
  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const tooltipWidth = 288; // w-72 = 18rem = 288px
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    // Garante que não saia da tela
    if (left < 8) left = 8;
    if (left + tooltipWidth > window.innerWidth - 8) {
      left = window.innerWidth - tooltipWidth - 8;
    }

    setPosition({
      top: rect.top - 8, // 8px acima do botão
      left,
    });
  }, [open]);

  // Fecha ao clicar fora (mobile)
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="w-5 h-5 flex items-center justify-center border border-outline/50 text-outline hover:border-secondary hover:text-secondary transition-colors text-[10px] font-bold shrink-0"
        style={{ fontFamily: "var(--font-mono)" }}
        aria-label="Ver história do navio"
      >
        ?
      </button>

      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className="fixed w-72 p-3 bg-surface-container-high border-2 border-outline shadow-xl"
            style={{
              zIndex: 99999,
              top: position.top,
              left: position.left,
              transform: "translateY(-100%)",
              fontFamily: "var(--font-body)",
            }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            <p
              className="text-[10px] text-secondary uppercase tracking-wider mb-1.5 border-b border-outline/30 pb-1"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Registro Histórico
            </p>
            <p className="text-[11px] text-on-surface leading-relaxed italic">
              {history}
            </p>
          </div>,
          document.body
        )}
    </>
  );
}
