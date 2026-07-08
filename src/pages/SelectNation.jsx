import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import AlertBanner from '../components/AlertBanner';

const NATIONS = [
  {
    id: 'USA',
    flag: '🇺🇸',
    label: 'Estados Unidos',
    description: 'Em 1941, os EUA abandonam o isolacionismo após Pearl Harbor e mobilizam a maior máquina industrial do mundo para a guerra.',
  },
  {
    id: 'UK',
    flag: '🇬🇧',
    label: 'Reino Unido',
    description: 'Sozinha contra o Eixo desde 1940, a Royal Navy defende as rotas do Atlântico enquanto resiste aos bombardeios da Blitz.',
  },
  {
    id: 'USSR',
    flag: '☭',
    label: 'União Soviética',
    description: 'Invadida pela Operação Barbarossa em junho de 1941, a URSS enfrenta a maior ofensiva terrestre da história.',
  },
  {
    id: 'GERMANY',
    flag: '🇩🇪',
    label: 'Alemanha',
    description: 'A Kriegsmarine e seus U-Boots dominam o Atlântico Norte, estrangulando as linhas de suprimento aliadas.',
  },
  {
    id: 'JAPAN',
    flag: '🇯🇵',
    label: 'Japão',
    description: 'O Império Japonês expande seu domínio pelo Pacífico com ataques devastadores a Pearl Harbor e Filipinas.',
  },
  {
    id: 'ITALY',
    flag: '🇮🇹',
    label: 'Itália',
    description: 'A Regia Marina disputa o controle do Mediterrâneo contra a Royal Navy, protegendo rotas para o Norte da África.',
  },
];

export default function SelectNation() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    if (!selected) return;
    setError('');
    setLoading(true);
    try {
      await api.setNation(selected);
      await refreshUser();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Falha ao definir nação');
    } finally {
      setLoading(false);
    }
  }

  const selectedNation = NATIONS.find((n) => n.id === selected);

  return (
    <div className="h-screen overflow-hidden tactical-grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Cartão Dossiê — Horizontal */}
        <div className="bg-[#ebe2c9] text-[#171305] p-6 relative">
          {/* Carimbo CLASSIFICADO */}
          <div className="absolute top-3 right-4 border-4 border-red-700/50 px-3 py-1 rotate-[-6deg]">
            <span
              className="text-red-700/50 text-xs font-bold tracking-widest"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              CLASSIFICADO
            </span>
          </div>

          {/* Título */}
          <div className="mb-4">
            <h1
              className="text-xl font-extrabold tracking-wider"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              DESIGNAÇÃO DE ALIANÇA
            </h1>
            <p
              className="text-[10px] uppercase tracking-widest text-[#171305]/60 mt-0.5"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Selecione sua nação de comando — Decisão irreversível
            </p>
          </div>

          <AlertBanner type="form-error" message={error} />

          {/* Grid de Nações — 6 colunas */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
            {NATIONS.map((nation) => (
              <button
                key={nation.id}
                onClick={() => setSelected(nation.id)}
                className={`p-3 border-2 transition-all relative flex flex-col items-center text-center ${
                  selected === nation.id
                    ? 'border-[#545a3e] bg-[#545a3e]/10 shadow-md'
                    : 'border-[#171305]/20 hover:border-[#171305]/40 hover:bg-[#171305]/5'
                }`}
              >
                {selected === nation.id && (
                  <span className="absolute top-1 right-1 material-symbols-outlined text-secondary text-sm">
                    check_circle
                  </span>
                )}
                <span className="text-2xl mb-1">{nation.flag}</span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider leading-tight"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  {nation.label}
                </span>
                <p
                  className="text-[9px] text-[#171305]/60 leading-snug mt-1.5"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {nation.description}
                </p>
              </button>
            ))}
          </div>

          {/* Rodapé — Seleção + Confirmar */}
          <div className="flex items-center justify-between border-t-2 border-[#171305]/20 pt-4">
            {selectedNation ? (
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedNation.flag}</span>
                <div>
                  <p
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    {selectedNation.label}
                  </p>
                  <p
                    className="text-[10px] text-[#171305]/50 uppercase tracking-widest"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    Nação selecionada
                  </p>
                </div>
              </div>
            ) : (
              <p
                className="text-xs text-[#171305]/40 italic"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Escolha com sabedoria, Comandante.
              </p>
            )}
            <button
              onClick={handleConfirm}
              disabled={!selected || loading}
              className="btn-primary text-sm px-8 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'PROCESSANDO...' : 'CONFIRMAR ALIANÇA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
