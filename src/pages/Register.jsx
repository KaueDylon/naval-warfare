import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
      setError(err.message || 'Enlistment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen tactical-grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Dossier Card */}
        <div className="bg-[#ebe2c9] text-[#171305] p-8 relative">
          {/* Classified Stamp */}
          <div className="absolute top-4 right-4 border-2 border-red-700 px-3 py-1 rotate-[-6deg]">
            <span
              className="text-red-700 text-xs font-bold tracking-widest"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              CLASSIFIED
            </span>
          </div>

          {/* Title */}
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
              Enlistment Form
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/10 border border-red-700 p-3">
                <p className="text-red-700 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                  {error}
                </p>
              </div>
            )}

            {/* Name */}
            <div className="flex items-center gap-3 border-b-2 border-[#171305]/30 pb-2">
              <span className="material-symbols-outlined text-[#171305]/60">badge</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="COMMANDER IDENTITY"
                required
                className="flex-1 bg-transparent border-none outline-none text-sm uppercase tracking-wide placeholder:text-[#171305]/40"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 border-b-2 border-[#171305]/30 pb-2">
              <span className="material-symbols-outlined text-[#171305]/60">mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="CALLSIGN (EMAIL)"
                required
                className="flex-1 bg-transparent border-none outline-none text-sm uppercase tracking-wide placeholder:text-[#171305]/40"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            {/* Password */}
            <div className="flex items-center gap-3 border-b-2 border-[#171305]/30 pb-2">
              <span className="material-symbols-outlined text-[#171305]/60">lock</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ACCESS CODE"
                required
                className="flex-1 bg-transparent border-none outline-none text-sm uppercase tracking-wide placeholder:text-[#171305]/40"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-sm"
            >
              {loading ? 'PROCESSING ENLISTMENT...' : 'ENLIST FOR DUTY'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#171305]/60" style={{ fontFamily: 'var(--font-mono)' }}>
              ALREADY ENLISTED?{' '}
              <Link
                to="/login"
                className="text-[#171305] font-bold underline hover:text-[#545a3e]"
              >
                REPORT TO COMMAND
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
