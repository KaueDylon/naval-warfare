import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
      setError(err.message || 'Authorization failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tactical-grid-bg min-h-screen flex items-center justify-center p-4">
      {/* Dossier Card */}
      <div className="relative w-full max-w-md rounded-sm shadow-2xl overflow-hidden" style={{ backgroundColor: '#ebe2c9' }}>
        {/* TOP SECRET Stamp */}
        <div
          className="absolute top-6 right-[-20px] z-10 pointer-events-none select-none"
          style={{
            transform: 'rotate(12deg)',
            fontFamily: 'var(--font-headline)',
          }}
        >
          <span className="text-2xl font-bold tracking-widest px-4 py-1 border-4 border-red-700 text-red-700 opacity-80">
            TOP SECRET
          </span>
        </div>

        {/* Header Section */}
        <div className="px-8 pt-8 pb-4 border-b-2 border-dashed" style={{ borderColor: '#171305' }}>
          <p
            className="text-xs tracking-[0.25em] uppercase opacity-70 mb-1"
            style={{ fontFamily: 'var(--font-mono)', color: '#171305' }}
          >
            Pacific Command / Intelligence Div.
          </p>
          <h1
            className="text-4xl font-bold tracking-wide uppercase mb-1"
            style={{ fontFamily: 'var(--font-headline)', color: '#171305' }}
          >
            Naval Warfare
          </h1>
          <p
            className="text-sm mb-2"
            style={{ fontFamily: 'var(--font-body)', color: '#171305' }}
          >
            Subject: Theatre Authorization
          </p>
          <p
            className="text-xs opacity-50"
            style={{ fontFamily: 'var(--font-mono)', color: '#171305' }}
          >
            REF: NW-1941-AUTH-{new Date().getFullYear()}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
          {error && (
            <div
              className="text-sm px-3 py-2 rounded border border-red-400 bg-red-50"
              style={{ fontFamily: 'var(--font-mono)', color: '#ba1a1a' }}
            >
              <span className="material-symbols-outlined text-base align-middle mr-1">error</span>
              {error}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label
              className="block text-xs tracking-[0.2em] uppercase mb-2 opacity-70"
              style={{ fontFamily: 'var(--font-mono)', color: '#171305' }}
            >
              Callsign (Email)
            </label>
            <div className="flex items-center gap-2 border-b-2" style={{ borderColor: '#171305' }}>
              <span className="material-symbols-outlined text-xl opacity-60" style={{ color: '#171305' }}>
                mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="operator@command.mil"
                className="w-full py-2 bg-transparent outline-none text-sm placeholder-stone-400"
                style={{ fontFamily: 'var(--font-mono)', color: '#171305' }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              className="block text-xs tracking-[0.2em] uppercase mb-2 opacity-70"
              style={{ fontFamily: 'var(--font-mono)', color: '#171305' }}
            >
              Access Code
            </label>
            <div className="flex items-center gap-2 border-b-2" style={{ borderColor: '#171305' }}>
              <span className="material-symbols-outlined text-xl opacity-60" style={{ color: '#171305' }}>
                lock
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••"
                className="w-full py-2 bg-transparent outline-none text-sm placeholder-stone-400"
                style={{ fontFamily: 'var(--font-mono)', color: '#171305' }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-sm text-base uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: '#545a3e',
              color: '#ebe2c9',
              fontFamily: 'var(--font-headline)',
            }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                Transmitting...
              </>
            ) : (
              <>
                Deploy Command
                <span className="material-symbols-outlined text-xl">send</span>
              </>
            )}
          </button>

          {/* Secure Transmission Indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
            </span>
            <p
              className="text-xs opacity-60"
              style={{ fontFamily: 'var(--font-mono)', color: '#171305' }}
            >
              Transmission secure // 128-bit encryption
            </p>
          </div>
        </form>

        {/* Register Link */}
        <div className="px-8 pb-6 text-center">
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-body)', color: '#171305' }}
          >
            No clearance?{' '}
            <Link
              to="/register"
              className="underline font-bold hover:opacity-70 transition-opacity"
              style={{ color: '#545a3e' }}
            >
              Request Authorization
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
