import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';
import * as ws from '../services/websocket';
import LoadingState from '../components/LoadingState';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const navigatingToGameRef = useRef(false);
  const isHostRef = useRef(false);
  const cancelAndLeaveRef = useRef(null);

  async function cancelAndLeave() {
    try {
      await api.deleteRoom(roomId);
    } catch {}
    ws.disconnect();
    navigate('/', { replace: true });
  }

  // Mantém ref atualizada para uso em event listeners
  cancelAndLeaveRef.current = cancelAndLeave;

  useEffect(() => {
    loadRoom();
    connectWs();

    // Bloqueia o botão voltar do navegador — empurra estado extra no history
    const handlePopState = (e) => {
      if (navigatingToGameRef.current) return;
      // Re-empurra para impedir a saída
      window.history.pushState(null, '', window.location.href);
      // Mostra dialog de confirmação se for o host
      if (isHostRef.current) {
        setShowLeaveConfirm(true);
      }
    };

    // Empurra estado inicial para ter algo para interceptar no popstate
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    // beforeunload — avisa se fechar aba/recarregar
    const handleBeforeUnload = (e) => {
      if (navigatingToGameRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Se sair do componente sem ser para o game, cancela a sala
      if (!navigatingToGameRef.current && isHostRef.current) {
        api.deleteRoom(roomId).catch(() => {});
      }
      if (!navigatingToGameRef.current) {
        ws.disconnect();
      }
    };
  }, [roomId]);

  async function loadRoom() {
    setLoading(true);
    try {
      const data = await api.getRoom(roomId);
      setRoom(data);
      if (data.gameId) {
        navigatingToGameRef.current = true;
        navigate(`/game/${data.gameId}`, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Falha ao carregar sala');
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
            navigatingToGameRef.current = true;
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
      setError(err.message || 'Falha ao cancelar');
    }
  }

  const isHost = room?.hostId === user?.id;

  // Mantém ref sincronizada para uso no cleanup/popstate
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  return (
    <div className="min-h-screen bg-background tactical-grid-bg flex items-center justify-center p-4">
      <ConfirmDialog
        open={showLeaveConfirm}
        title="ABANDONAR ÁREA DE PREPARAÇÃO?"
        message="A operação será cancelada automaticamente e a sala será destruída."
        confirmText="ABANDONAR"
        cancelText="PERMANECER"
        variant="warning"
        onConfirm={() => {
          setShowLeaveConfirm(false);
          cancelAndLeaveRef.current();
        }}
        onCancel={() => setShowLeaveConfirm(false)}
      />
      <div className="w-full max-w-lg">
        {/* Cartão de Preparação */}
        <div className="dispatch-border p-8 shadow-2xl relative">
          {/* Marcadores decorativos de canto */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary/50"></div>
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary/50"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary/50"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary/50"></div>

          {loading ? (
            <LoadingState message="CARREGANDO OPERAÇÃO..." spinner />
          ) : error && !room ? (
            <div className="text-center space-y-4 py-8">
              <span className="material-symbols-outlined text-4xl text-error">error</span>
              <p className="text-error text-sm" style={{ fontFamily: 'var(--font-mono)' }}>{error}</p>
              <button onClick={() => navigate('/')} className="btn-secondary text-xs">
                VOLTAR AO QG
              </button>
            </div>
          ) : (
            <div className="space-y-8 text-center">
              {/* Título */}
              <div>
                <h1
                  className="text-2xl stencil-text text-primary mb-2"
                  style={{ fontFamily: 'var(--font-headline)' }}
                >
                  ÁREA DE PREPARAÇÃO
                </h1>
                <p
                  className="text-on-surface-variant text-xs uppercase tracking-[0.2em]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Aguardando Implantação de Pessoal
                </p>
              </div>

              {/* Status de Conexão */}
              <div className="flex items-center justify-center gap-2">
                <span className={`w-2 h-2 ${connected ? 'bg-primary animate-pulse' : 'bg-error'}`}></span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
                  {connected ? 'LINHA SEGURA ATIVA' : 'CONECTANDO...'}
                </span>
              </div>

              {/* Código da Sala */}
              <div className="border-2 border-secondary bg-secondary/5 p-6">
                <p
                  className="text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mb-3"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Código da Operação
                </p>
                <p
                  className="text-2xl sm:text-4xl text-secondary font-bold tracking-[0.3em] sm:tracking-[0.4em]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {room?.code || '—'}
                </p>
                <p className="text-[10px] text-on-surface-variant mt-3 uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
                  Compartilhe este código com seu oponente
                </p>
              </div>

              {/* Status do Pessoal */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
                    Comandante (Anfitrião)
                  </span>
                  <span className="flex items-center gap-2 text-primary text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    {room?.hostName}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
                    Comandante (Convidado)
                  </span>
                  {room?.guestName ? (
                    <span className="flex items-center gap-2 text-primary text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      {room.guestName}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-on-surface-variant text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                      <span className="w-2 h-2 bg-outline-variant rounded-full animate-ping"></span>
                      AGUARDANDO
                    </span>
                  )}
                </div>
              </div>

              {/* Animação de espera */}
              {!room?.guestName && (
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                  <span className="text-[10px] text-secondary uppercase tracking-widest ml-2" style={{ fontFamily: 'var(--font-mono)' }}>
                    VARRENDO FREQUÊNCIAS
                  </span>
                </div>
              )}

              {/* Jogo pronto */}
              {room?.guestName && room?.gameId && (
                <button
                  onClick={() => {
                    navigatingToGameRef.current = true;
                    navigate(`/game/${room.gameId}`, { replace: true });
                  }}
                  className="btn-primary w-full py-4 text-lg"
                >
                  INICIAR OPERAÇÃO
                </button>
              )}

              {/* Erro */}
              {error && room && (
                <div className="border border-error bg-error/10 p-2">
                  <p className="text-error text-xs" style={{ fontFamily: 'var(--font-mono)' }}>{error}</p>
                </div>
              )}

              {/* Ações */}
              <div className="space-y-2 pt-2">
                {isHost && !room?.gameId && (
                  <button onClick={handleCancel} className="btn-danger text-xs w-full">
                    ABORTAR OPERAÇÃO
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
