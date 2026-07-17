import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import * as api from "../services/api";
import PageHeader, { HeaderDivider, HeaderIconButton } from "../components/PageHeader";
import AlertBanner from "../components/AlertBanner";
import BottomNav from "../components/BottomNav";
import EmptyState from "../components/EmptyState";


export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [entranceAnimation, setEntranceAnimation] = useState(false);

  useEffect(() => {
    loadRooms();

    // Dispara animação de entrada apenas ao chegar direto do login/cadastro
    if (sessionStorage.getItem("justAuthenticated")) {
      sessionStorage.removeItem("justAuthenticated");
      setEntranceAnimation(true);
    }
  }, []);

  async function loadRooms() {
    try {
      const data = await api.getRooms();
      setRooms(data || []);
    } catch (err) {
      console.error("Falha ao carregar salas:", err);
    }
  }

  async function handleCreateRoom() {
    setError("");
    setLoading(true);
    try {
      const room = await api.createRoom(user.name);
      navigate(`/room/${room.roomId}`);
    } catch (err) {
      setError(err.message || "Falha ao criar operação");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinByCode() {
    if (!code.trim()) return;
    setError("");
    setLoading(true);
    try {
      const room = await api.joinRoomByCode(code.trim());
      if (room.gameId) {
        navigate(`/game/${room.gameId}`);
      } else {
        navigate(`/room/${room.roomId}`);
      }
    } catch (err) {
      setError(err.message || "Código de operação inválido");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinRoom(roomId) {
    setError("");
    setLoading(true);
    try {
      const room = await api.joinRoom(roomId);
      if (room.gameId) {
        navigate(`/game/${room.gameId}`);
      } else {
        navigate(`/room/${room.roomId}`);
      }
    } catch (err) {
      setError(err.message || "Falha ao entrar na sala");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <PageHeader
        mobileActions={
          <HeaderIconButton icon="logout" title="Sair" onClick={logout} danger />
        }
      >
        <HeaderIconButton icon="military_tech" title="Ranking" onClick={() => navigate("/ranking")} />
        <HeaderIconButton icon="history" title="Histórico" onClick={() => navigate("/history")} />
        <HeaderDivider />
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 p-1 pr-3 hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-primary">account_circle</span>
          <span className="text-xs text-on-surface uppercase tracking-wider" style={{ fontFamily: "var(--font-mono)" }}>
            {user?.name}
          </span>
        </button>
        <HeaderDivider />
        <HeaderIconButton icon="logout" title="Sair" onClick={logout} danger />
      </PageHeader>

      {/* Conteúdo Principal */}
      <main
        className={`flex-1 w-full max-w-5xl mx-auto px-3 md:px-8 py-6 md:py-8 ${
          entranceAnimation ? "animate-dossier-reveal" : ""
        }`}
      >
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b-2 border-primary-container pb-6">
          <div>
            <h2
              className="text-2xl stencil-text text-on-background"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              Zona de Operações
            </h2>
          </div>
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-lg">add_box</span>
            Nova Operação
          </button>
        </div>

        {/* Entrar por Código */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 flex items-center gap-2 border-2 border-outline-variant bg-surface-container px-4 py-2">
            <span className="material-symbols-outlined text-outline text-lg">
              vpn_key
            </span>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CÓDIGO DE 6 CARACTERES"
              maxLength={6}
              className="flex-1 bg-transparent border-none outline-none text-sm uppercase tracking-widest text-on-surface placeholder:text-on-surface-variant/50"
              style={{ fontFamily: "var(--font-mono)" }}
              onKeyDown={(e) => e.key === "Enter" && handleJoinByCode()}
            />
          </div>
          <button
            onClick={handleJoinByCode}
            disabled={loading || !code.trim()}
            className="btn-primary text-xs px-6"
          >
            Entrar
          </button>
        </div>

        {/* Erro */}
        <AlertBanner type="error" message={error} className="mb-6" />

        {/* Lista de Salas */}
        <div className="dispatch-border shadow-2xl">
          {/* Cabeçalho da Tabela */}
          <div
            className="hidden md:grid grid-cols-12 gap-4 p-4 border-b-2 border-outline-variant bg-surface-container-high"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <div className="col-span-6 flex items-center gap-2 text-xs text-on-surface-variant uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm">map</span>{" "}
              Designação do Setor
            </div>
            <div className="col-span-3 text-center text-xs text-on-surface-variant uppercase tracking-widest">
              Efetivo
            </div>
            <div className="col-span-3 text-right text-xs text-on-surface-variant uppercase tracking-widest">
              Implantação
            </div>
          </div>

          {/* Itens */}
          {rooms.length === 0 ? (
            <EmptyState
              icon="anchor"
              message="NENHUMA ZONA DE COMBATE ATIVA"
              hint="Crie uma nova operação para começar"
            />
          ) : (
            rooms.map((room) => {
              const playerCount = room.guestId ? 2 : 1;
              return (
                <div
                  key={room.roomId}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 border-b border-outline-variant hover:bg-surface-variant transition-colors items-center group"
                >
                  {/* Info do Setor */}
                  <div className="col-span-1 md:col-span-6 flex items-center gap-4">
                    <div className="w-12 h-12 border-2 border-primary flex items-center justify-center text-primary bg-surface-container-highest shrink-0">
                      <span className="material-symbols-outlined text-[28px]">
                        anchor
                      </span>
                    </div>
                    <div>
                      <h3
                        className="text-on-background stencil-text text-base group-hover:text-primary transition-colors"
                        style={{ fontFamily: "var(--font-headline)" }}
                      >
                        {room.hostName}
                      </h3>
                      <p
                        className="text-xs text-secondary mt-0.5 uppercase tracking-wider"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        STATUS:{" "}
                        {room.status === "WAITING"
                          ? "RECRUTANDO COMANDANTES"
                          : room.status}
                      </p>
                      <p
                        className="text-xs text-on-surface-variant/60 mt-0.5"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        CÓDIGO: #{room.code}
                      </p>
                    </div>
                  </div>

                  {/* Efetivo */}
                  <div className="hidden md:flex col-span-3 items-center justify-center">
                    <span
                      className="bg-secondary-container text-on-secondary-container px-4 py-1 border border-secondary text-sm"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {String(playerCount).padStart(2, "0")} / 02
                    </span>
                  </div>

                  {/* Botão Entrar */}
                  <div className="col-span-1 md:col-span-3 flex justify-end">
                    <button
                      onClick={() => handleJoinRoom(room.roomId)}
                      disabled={loading}
                      className="btn-secondary w-full md:w-auto text-xs"
                    >
                      Entrar
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Atualizar */}
          <div className="p-4 flex justify-center">
            <button
              onClick={loadRooms}
              className="btn-secondary text-xs flex items-center gap-2"
            >
              Atualizar Setores{" "}
              <span className="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
