import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AlertBanner from '../components/AlertBanner';
import TopSecretStamp from '../components/TopSecretStamp';

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.message || 'Falha no alistamento');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen tactical-grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Cartão Dossiê */}
        <div className="bg-[#ebe2c9] text-[#171305] p-6 sm:p-8 relative">
          <TopSecretStamp />

          {/* Título */}
          <div className="text-center mb-8 mt-4">
            <h1
              className="text-2xl font-extrabold tracking-wider mb-2"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              NAVAL WARFARE 1941
            </h1>
            <p
              className="text-sm uppercase tracking-widest text-[#171305]/70"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Formulário de Alistamento
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <AlertBanner type="form-error" message={error} />

            {/* Nome */}
            <div className="flex items-center gap-3 border-b-2 border-[#171305]/30 pb-2">
              <span className="material-symbols-outlined text-[#171305]/60">badge</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do comandante"
                required
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-[#171305]/40"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            {/* E-mail */}
            <div className="flex items-center gap-3 border-b-2 border-[#171305]/30 pb-2">
              <span className="material-symbols-outlined text-[#171305]/60">mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Indicativo (e-mail)"
                required
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-[#171305]/40"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            {/* Senha */}
            <div className="flex items-center gap-3 border-b-2 border-[#171305]/30 pb-2">
              <span className="material-symbols-outlined text-[#171305]/60">lock</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Código de acesso"
                required
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-[#171305]/40"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            {/* Enviar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-sm"
            >
              {loading ? 'PROCESSANDO ALISTAMENTO...' : 'ALISTAR-SE'}
            </button>
          </form>

          {/* Link de Login */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#171305]/60" style={{ fontFamily: 'var(--font-mono)' }}>
              JÁ ALISTADO?{' '}
              <Link
                to="/login"
                className="text-[#171305] font-bold underline hover:text-[#545a3e]"
              >
                REPORTAR AO COMANDO
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
