import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AlertBanner from '../components/AlertBanner';
import TopSecretStamp from '../components/TopSecretStamp';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Falha na autorização');
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
              Autorização de Teatro
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <AlertBanner type="form-error" message={error} />

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
              {loading ? 'TRANSMITINDO...' : 'ACESSAR COMANDO'}
            </button>
          </form>

          {/* Link de Cadastro */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#171305]/60" style={{ fontFamily: 'var(--font-mono)' }}>
              SEM CREDENCIAL?{' '}
              <Link
                to="/register"
                className="text-[#171305] font-bold underline hover:text-[#545a3e]"
              >
                SOLICITAR AUTORIZAÇÃO
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
