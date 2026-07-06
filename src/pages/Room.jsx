import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import * as ws from '../services/websocket';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    loadRoom();
    connectWs();
    return () => {};
  }, [roomId]);

  async function loadRoom() {
    setLoading(true);
    try {
      const data = await api.getRoom(roomId);
      setRoom(data);
      if (data.gameId) {
        navigate(`/game/${data.gameId}`, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Failed to load room');
    } finally {
      setLoading(false);
    }
  }

  function connectWs() {
    ws.connect(
      token,
      () => {
        setConnected(true);
        ws.subscribePersistent('/user/queue/room-joined', (data) => {
          setRoom(data);
          if (data.gameId) {
            setTimeout(() => navigate(`/game/${data.gameId}`, { replace: true }), 1000);
          }
        });
        ws.subscribePersistent('/user/queue/errors', (msg) => {
          const errorMsg = typeof msg === 'string' ? msg : JSON.stringify(msg);
          setError(errorMsg);
        });
      },
      (err) => {
        console.error('[Room] WS Error:', err);
        setConnected(false);
      }
    );
  }

  async function handleCancel() {
    try {
      await api.deleteRoom(roomId);
      ws.disconnect();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to cancel');
    }
  }

  const isHost = room?.hostId === user?.id;

  return (
    <div className="min-h-screen bg-background tactical-grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Dossier-style staging card */}
        <div className="dispatch-border p-8 shadow-2xl relative">
          {/* Decorative corner markers */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary/50"></div>
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary/50"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary/50"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary/50"></div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-on-surface-variant text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                LOADING OPERATION...
              </p>
            </div>
          ) : error && !room ? (
            <div className="text-center space-y-4 py-8">
              <span className="material-symbols-outlined text-4xl text-error">error</span>
              <p className="text-error text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{error}</p>
              <button onClick={() => navigate('/')} className="btn-secondary text-xs">
                RETURN TO HQ
              </button>
            </div>
          ) : (
            <div className="space-y-8 text-center">
              {/* Title */}
              <div>
                <h1
                  className="text-2xl stencil-text text-primary mb-2"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  STAGING AREA
                </h1>
                <p
                  className="text-on-surface-variant text-xs uppercase tracking-[0.2em]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Awaiting Personnel Deployment
                </p>
              </div>

              {/* Connection Status */}
              <div className="flex items-center justify-center gap-2">
                <span className={`w-2 h-2 ${connected ? 'bg-primary animate-pulse' : 'bg-error'}`}></span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
                  {connected ? 'SECURE LINE ACTIVE' : 'CONNECTING...'}
                </span>
              </div>

              {/* Room Code */}
              <div className="border-2 border-secondary bg-secondary/5 p-6">
                <p
                  className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mb-3"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Operation Code
                </p>
                <p
                  className="text-4xl text-secondary font-bold tracking-[0.4em]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {room?.code || '—'}
                </p>
                <p className="text-[10px] text-on-surface-variant mt-3 uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
                  Share this code with your opponent
                </p>
              </div>

              {/* Personnel Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
                    Commander (Host)
                  </span>
                  <span className="flex items-center gap-2 text-primary text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    {room?.hostName}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
                    Commander (Guest)
                  </span>
                  {room?.guestName ? (
                    <span className="flex items-center gap-2 text-primary text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      {room.guestName}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-on-surface-variant text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                      <span className="w-2 h-2 bg-outline-variant rounded-full animate-ping"></span>
                      STANDBY
                    </span>
                  )}
                </div>
              </div>

              {/* Waiting animation */}
              {!room?.guestName && (
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                  <span className="text-[10px] text-secondary uppercase tracking-widest ml-2" style={{ fontFamily: 'var(--font-mono)' }}>
                    SCANNING FREQUENCIES
                  </span>
                </div>
              )}

              {/* Game Ready */}
              {room?.guestName && room?.gameId && (
                <button
                  onClick={() => navigate(`/game/${room.gameId}`, { replace: true })}
                  className="btn-primary w-full py-4 text-lg"
                >
                  COMMENCE OPERATION
                </button>
              )}

              {/* Error */}
              {error && room && (
                <div className="border border-error bg-error/10 p-2">
                  <p className="text-error text-xs" style={{ fontFamily: 'var(--font-mono)' }}>{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-2">
                {isHost && !room?.gameId && (
                  <button onClick={handleCancel} className="btn-danger text-xs w-full">
                    ABORT OPERATION
                  </button>
                )}
                <button
                  onClick={() => { ws.disconnect(); navigate('/'); }}
                  className="btn-secondary text-xs w-full"
                >
                  RETURN TO HQ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
