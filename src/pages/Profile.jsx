import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

const NATIONS = ['USA', 'UK', 'USSR', 'GERMANY', 'JAPAN', 'ITALY'];

const NATION_PORTRAITS = {
  USA: ['USA_GENERAL', 'USA_ADMIRAL', 'USA_PILOT'],
  UK: ['UK_GENERAL', 'UK_ADMIRAL', 'UK_PILOT'],
  USSR: ['USSR_GENERAL', 'USSR_ADMIRAL', 'USSR_PILOT'],
  GERMANY: ['GERMANY_GENERAL', 'GERMANY_ADMIRAL', 'GERMANY_PILOT'],
  JAPAN: ['JAPAN_GENERAL', 'JAPAN_ADMIRAL', 'JAPAN_PILOT'],
  ITALY: ['ITALY_GENERAL', 'ITALY_ADMIRAL', 'ITALY_PILOT'],
};

const NATION_FLAGS = {
  USA: '🇺🇸',
  UK: '🇬🇧',
  USSR: '☭',
  GERMANY: '🇩🇪',
  JAPAN: '🇯🇵',
  ITALY: '🇮🇹',
};

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedNation, setSelectedNation] = useState('');
  const [selectedPortrait, setSelectedPortrait] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await api.getMe();
      setProfile(data);
      setName(data.name || '');
      setSelectedNation(data.nation || '');
      setSelectedPortrait(data.portrait || '');
    } catch (err) {
      setError('Failed to load dossier');
    }
  }

  async function handleUpdateInfo(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const updates = {};
      if (name && name !== profile.name) updates.name = name;
      if (password) updates.password = password;
      if (Object.keys(updates).length > 0) {
        await api.updateMe(updates);
        await refreshUser();
        setPassword('');
        setMessage('DOSSIER UPDATED');
        loadProfile();
      }
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetNation(nation) {
    setError('');
    setMessage('');
    try {
      await api.setNation(nation);
      setSelectedNation(nation);
      await refreshUser();
      setMessage(`NATION SET: ${nation}`);
    } catch (err) {
      setError(err.message || 'Failed to set nation');
    }
  }

  async function handleSetPortrait(portrait) {
    setError('');
    setMessage('');
    try {
      await api.setPortrait(portrait);
      setSelectedPortrait(portrait);
      await refreshUser();
      setMessage('PORTRAIT UPDATED');
    } catch (err) {
      setError(err.message || 'Failed to set portrait');
    }
  }

  async function handleDelete() {
    if (!confirm('CONFIRM: This action is irreversible. Delete your command record?')) return;
    try {
      await api.deleteMe();
      logout();
    } catch (err) {
      setError(err.message || 'Deletion failed');
    }
  }

  const totalMissions = (profile?.wins ?? 0) + (profile?.losses ?? 0);
  const winrate = totalMissions > 0 ? Math.round(((profile?.wins ?? 0) / totalMissions) * 100) : 0;
  const availablePortraits = selectedNation ? NATION_PORTRAITS[selectedNation] || [] : [];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-outline-variant px-6 h-16 flex items-center bg-surface-container-lowest">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <h1
            className="text-xl md:text-2xl stencil-text text-primary"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            PACIFIC.COMMAND
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/ranking')}
              className="p-2 text-secondary hover:text-primary hover:bg-surface-container transition-colors"
              title="Rankings"
            >
              <span className="material-symbols-outlined">military_tech</span>
            </button>
            <button
              onClick={() => navigate('/history')}
              className="p-2 text-secondary hover:text-primary hover:bg-surface-container transition-colors"
              title="Match History"
            >
              <span className="material-symbols-outlined">history</span>
            </button>
            <div className="h-8 w-px bg-outline-variant mx-1"></div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors px-3 py-2"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span className="text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
                Return to HQ
              </span>
            </button>
            <div className="h-8 w-px bg-outline-variant mx-1"></div>
            <button
              onClick={logout}
              className="p-2 text-secondary hover:text-error hover:bg-surface-container transition-colors"
              title="Logout"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Messages */}
        {message && (
          <div className="border-2 border-primary bg-primary/10 p-3">
            <p className="text-primary text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
              ✓ {message}
            </p>
          </div>
        )}
        {error && (
          <div className="border-2 border-error bg-error/10 p-3">
            <p className="text-error text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
              ✗ {error}
            </p>
          </div>
        )}

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
          {/* Left Column - Portrait & Name Badge */}
          <div className="space-y-4">
            {/* Vintage Frame Portrait */}
            <div className="relative border-4 border-surface-container-highest outline outline-2 outline-secondary/60 p-3 bg-surface-container flex flex-col items-center">
              <div className="w-full aspect-[3/4] bg-surface-container-high border border-outline-variant flex items-center justify-center grayscale relative overflow-hidden">
                <span className="material-symbols-outlined text-7xl text-on-surface-variant/40">
                  person
                </span>
                {/* TOP SECRET stamp */}
                <div className="absolute top-3 right-[-10px] rotate-[-15deg] border-2 border-error px-2 py-0.5 bg-error/10">
                  <span
                    className="text-error text-[0.6rem] font-bold uppercase tracking-widest"
                    style={{ fontFamily: 'var(--font-headline)' }}
                  >
                    TOP SECRET
                  </span>
                </div>
              </div>
              <p
                className="text-[0.6rem] text-on-surface-variant uppercase tracking-widest mt-2 text-center"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {selectedPortrait ? selectedPortrait.replace(/_/g, ' ') : 'NO PORTRAIT ASSIGNED'}
              </p>
            </div>

            {/* Name Badge */}
            <div className="border-2 border-outline-variant bg-surface-container-high p-4 text-center">
              <p
                className="text-lg text-on-surface font-bold uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-headline)' }}
              >
                {profile?.name || '—'}
              </p>
              <p
                className="text-[0.65rem] text-on-surface-variant uppercase tracking-widest mt-1"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                ID: {profile?.id || '—'}
              </p>
            </div>
          </div>

          {/* Right Column - Dossier Card */}
          <div className="border-2 border-outline-variant bg-surface-container p-6 space-y-5">
            <h2
              className="stencil-text text-lg text-primary border-b-2 border-outline-variant pb-2"
              style={{ fontFamily: 'var(--font-headline)', fontWeight: 800 }}
            >
              PERFIL DO COMANDANTE
            </h2>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p
                  className="text-[0.65rem] text-on-surface-variant uppercase tracking-widest mb-0.5"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  PATENTE
                </p>
                <p className="text-sm font-bold text-on-surface" style={{ fontFamily: 'var(--font-mono)' }}>
                  {totalMissions >= 50 ? 'ALMIRANTE' : totalMissions >= 20 ? 'CAPITÃO' : totalMissions >= 5 ? 'TENENTE' : 'CADETE'}
                </p>
              </div>
              <div>
                <p
                  className="text-[0.65rem] text-on-surface-variant uppercase tracking-widest mb-0.5"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  SETOR OPERACIONAL
                </p>
                <p className="text-sm font-bold text-on-surface" style={{ fontFamily: 'var(--font-mono)' }}>
                  {selectedNation ? `${NATION_FLAGS[selectedNation] || ''} ${selectedNation}` : 'NÃO DESIGNADO'}
                </p>
              </div>
            </div>

            {/* Histórico Tático */}
            <div>
              <h3
                className="text-xs text-on-surface-variant uppercase tracking-wider border-b border-outline-variant pb-1 mb-3"
                style={{ fontFamily: 'var(--font-headline)', fontWeight: 700 }}
              >
                HISTÓRICO TÁTICO
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-outline-variant p-3 text-center bg-surface-container-high">
                  <p
                    className="text-2xl font-bold text-secondary"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {totalMissions}
                  </p>
                  <p
                    className="text-[0.6rem] text-on-surface-variant uppercase tracking-widest mt-1"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    MISSÕES
                  </p>
                </div>
                <div className="border border-outline-variant p-3 text-center bg-surface-container-high">
                  <p
                    className="text-2xl font-bold text-secondary"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {winrate}%
                  </p>
                  <p
                    className="text-[0.6rem] text-on-surface-variant uppercase tracking-widest mt-1"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    VITÓRIAS
                  </p>
                </div>
                <div className="border border-outline-variant p-3 text-center bg-surface-container-high">
                  <p
                    className="text-2xl font-bold text-secondary"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {profile?.wins ?? 0}
                  </p>
                  <p
                    className="text-[0.6rem] text-on-surface-variant uppercase tracking-widest mt-1"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    ELIMINAÇÕES
                  </p>
                </div>
              </div>
            </div>

            {/* Notas do Comando Central */}
            <div>
              <h3
                className="text-xs text-on-surface-variant uppercase tracking-wider border-b border-outline-variant pb-1 mb-3"
                style={{ fontFamily: 'var(--font-headline)', fontWeight: 700 }}
              >
                NOTAS DO COMANDO CENTRAL
              </h3>
              <div className="border-l-4 border-primary/40 pl-4 py-2">
                <p
                  className="text-sm italic text-on-surface-variant"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {totalMissions === 0
                    ? '"Oficial recém-designado. Aguardando primeira missão de combate."'
                    : winrate >= 70
                      ? '"Comandante exemplar. Desempenho acima da média em todas as operações."'
                      : winrate >= 40
                        ? '"Oficial competente. Demonstra aptidão tática em cenários variados."'
                        : '"Necessita treinamento adicional. Recomenda-se revisão de estratégias."'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Nation Selection */}
        <section className="dispatch-border p-6">
          <h2
            className="stencil-text text-sm text-primary border-b border-outline-variant pb-2 mb-4"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            NAÇÃO — ALIANÇA {profile?.nation && <span className="text-xs text-on-surface-variant ml-2">(IRREVERSÍVEL)</span>}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {NATIONS.map((nation) => (
              <button
                key={nation}
                onClick={() => handleSetNation(nation)}
                disabled={!!profile?.nation}
                className={`relative p-4 border-2 text-center transition-all ${
                  selectedNation === nation
                    ? 'border-secondary bg-secondary/15 text-secondary'
                    : 'border-outline-variant text-on-surface-variant hover:border-outline hover:bg-surface-container-high'
                } ${profile?.nation && profile.nation !== nation ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span className="text-2xl block mb-1">{NATION_FLAGS[nation]}</span>
                <span
                  className="text-xs font-bold uppercase tracking-widest block"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  {nation}
                </span>
                {selectedNation === nation && (
                  <span className="absolute top-1 right-1 material-symbols-outlined text-secondary text-sm">
                    check_circle
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Portrait Selection */}
        {selectedNation && (
          <section className="dispatch-border p-6">
            <h2
              className="stencil-text text-sm text-primary border-b border-outline-variant pb-2 mb-4"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              RETRATO OFICIAL
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
              {availablePortraits.map((portrait) => (
                <button
                  key={portrait}
                  onClick={() => handleSetPortrait(portrait)}
                  className={`p-4 border-2 flex flex-col items-center gap-2 transition-all ${
                    selectedPortrait === portrait
                      ? 'border-secondary bg-secondary/15'
                      : 'border-outline-variant hover:border-outline hover:bg-surface-container-high'
                  }`}
                >
                  <div className="w-16 h-20 bg-surface-container-high border border-outline-variant flex items-center justify-center grayscale">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant">
                      person
                    </span>
                  </div>
                  <span
                    className="text-[0.6rem] text-on-surface-variant uppercase tracking-wider"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {portrait.replace(/_/g, ' ')}
                  </span>
                  {selectedPortrait === portrait && (
                    <span className="material-symbols-outlined text-secondary text-sm">
                      check_circle
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Edit Form */}
        <section className="dispatch-border p-6">
          <h2
            className="stencil-text text-sm text-primary border-b border-outline-variant pb-2 mb-4"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            MODIFICAR CREDENCIAIS
          </h2>
          <form onSubmit={handleUpdateInfo} className="space-y-4 max-w-md">
            <div>
              <label
                className="text-xs text-on-surface-variant uppercase tracking-widest block mb-1"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Nome do Comandante
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container-low border-2 border-outline-variant px-4 py-2 text-on-surface outline-none focus:border-primary"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div>
              <label
                className="text-xs text-on-surface-variant uppercase tracking-widest block mb-1"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Novo Código de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Deixe vazio para manter o atual"
                className="w-full bg-surface-container-low border-2 border-outline-variant px-4 py-2 text-on-surface outline-none focus:border-primary placeholder:text-on-surface-variant/50"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary text-sm">
              {loading ? 'PROCESSANDO...' : 'ATUALIZAR DOSSIÊ'}
            </button>
          </form>
        </section>

        {/* Danger Zone */}
        <section className="border-2 border-error p-6">
          <h2
            className="stencil-text text-sm text-error border-b border-error/30 pb-2 mb-4"
            style={{ fontFamily: 'var(--font-headline)' }}
          >
            ZONA DE PERIGO — IRREVERSÍVEL
          </h2>
          <p
            className="text-on-surface-variant text-sm mb-4"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            ESTA AÇÃO APAGARÁ PERMANENTEMENTE SEU REGISTRO DE COMANDO E TODOS OS DADOS ASSOCIADOS.
          </p>
          <button onClick={handleDelete} className="btn-danger text-sm">
            EXCLUIR REGISTRO DE COMANDO
          </button>
        </section>
      </main>

      {/* Bottom Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t-2 border-outline-variant bg-surface-container-low px-2 py-2">
        <div className="flex items-center justify-around">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center gap-0.5 text-on-surface-variant hover:text-primary transition-colors p-2"
          >
            <span className="material-symbols-outlined text-xl">home</span>
            <span className="text-[0.55rem] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>HQ</span>
          </button>
          <button
            onClick={() => navigate('/ranking')}
            className="flex flex-col items-center gap-0.5 text-on-surface-variant hover:text-primary transition-colors p-2"
          >
            <span className="material-symbols-outlined text-xl">military_tech</span>
            <span className="text-[0.55rem] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>Rank</span>
          </button>
          <button
            onClick={() => navigate('/history')}
            className="flex flex-col items-center gap-0.5 text-on-surface-variant hover:text-primary transition-colors p-2"
          >
            <span className="material-symbols-outlined text-xl">history</span>
            <span className="text-[0.55rem] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>Hist</span>
          </button>
          <button
            className="flex flex-col items-center gap-0.5 text-primary p-2"
          >
            <span className="material-symbols-outlined text-xl">person</span>
            <span className="text-[0.55rem] uppercase" style={{ fontFamily: 'var(--font-mono)' }}>Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
