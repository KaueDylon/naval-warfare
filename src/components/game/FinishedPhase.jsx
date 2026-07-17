/**
 * Fase final — exibe vitória ou derrota e permite retornar ao lobby.
 */
import Button from "../Button";

export default function FinishedPhase({ isVictory, onReturn }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-8 max-w-md">
        <div
          className={`inline-flex items-center justify-center w-24 h-24 border-4 ${
            isVictory
              ? "border-secondary text-secondary"
              : "border-error text-error"
          }`}
        >
          <span className="material-symbols-outlined text-5xl">
            {isVictory ? "military_tech" : "dangerous"}
          </span>
        </div>

        <div>
          <h1
            className={`text-4xl stencil-text ${isVictory ? "text-secondary" : "text-error"}`}
            style={{ fontFamily: "var(--font-headline)" }}
          >
            {isVictory ? "OPERAÇÃO BEM-SUCEDIDA" : "OPERAÇÃO FRACASSADA"}
          </h1>
          <p
            className="text-on-surface-variant mt-2 uppercase tracking-widest text-sm"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {isVictory
              ? "Todas as embarcações inimigas neutralizadas. Parabéns, Comandante."
              : "Sua frota foi destruída. Melhor sorte na próxima vez."}
          </p>
        </div>

        <Button onClick={onReturn} withSound className="text-lg px-8 py-4">
          VOLTAR À BASE
        </Button>
      </div>
    </div>
  );
}
