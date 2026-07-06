import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import * as api from "../services/api";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      const data = await api.getRooms();
      setRooms(data || []);
    } catch (err) {
      console.error("Failed to load rooms:", err);
    }
  }

  async function handleCreateRoom() {
    setError("");
    setLoading(true);
    try {
      const room = await api.createRoom(user.name);
      navigate(`/room/${room.roomId}`);
    } catch (err) {
      setError(err.message || "Failed to create operation");
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
      setError(err.message || "Invalid operation code");
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
      setError(err.message || "Failed to deploy");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 border-b-2 border-outline-variant px-6 h-16 flex items-center bg-surface-container-lowest">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <h1
            className="text-xl md:text-2xl stencil-text text-primary"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            PACIFIC.COMMAND
          </h1>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/ranking")}
              className="p-2 text-secondary hover:text-primary hover:bg-surface-container transition-colors"
              title="Ranking"
            >
              <span className="material-symbols-outlined">military_tech</span>
            </button>
            <button
              onClick={() => navigate("/history")}
              className="p-2 text-secondary hover:text-primary hover:bg-surface-container transition-colors"
              title="Match History"
            >
              <span className="material-symbols-outlined">history</span>
            </button>
            <div className="h-8 w-px bg-outline-variant mx-1"></div>
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 p-1 pr-3 hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-primary">
                account_circle
              </span>
              <span
                className="text-xs text-on-surface hidden md:inline uppercase tracking-wider"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {user?.name}
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

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-8 pb-24 md:pb-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b-2 border-primary-container pb-6">
          <div>
            <h2
              className="text-2xl stencil-text text-on-background"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              Engagement Zones
            </h2>
            <p
              className="text-xs text-secondary mt-1 uppercase tracking-widest"
              style={{ fontFamily: "var(--font-body)" }}
            >
              OPERATIONAL CLEARANCE: LEVEL 4 REQUIRED
            </p>
          </div>
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-lg">add_box</span>
            New Operation
          </button>
        </div>

        {/* Join by Code */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 flex items-center gap-2 border-2 border-outline-variant bg-surface-container px-4 py-2">
            <span className="material-symbols-outlined text-outline text-lg">
              vpn_key
            </span>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ENTER 6-CHAR CODE"
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
            Deploy
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="border-2 border-error bg-error/10 p-3 mb-6">
            <p
              className="text-error text-sm"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              ⚠ {error}
            </p>
          </div>
        )}

        {/* Room List - Dispatch Board */}
        <div className="dispatch-border shadow-2xl">
          {/* Table Header */}
          <div
            className="hidden md:grid grid-cols-12 gap-4 p-4 border-b-2 border-outline-variant bg-surface-container-high"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <div className="col-span-6 flex items-center gap-2 text-xs text-on-surface-variant uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm">map</span>{" "}
              Sector Designation
            </div>
            <div className="col-span-3 text-center text-xs text-on-surface-variant uppercase tracking-widest">
              Personnel
            </div>
            <div className="col-span-3 text-right text-xs text-on-surface-variant uppercase tracking-widest">
              Deployment
            </div>
          </div>

          {/* Room Items */}
          {rooms.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-outline-variant block mb-2">
                anchor
              </span>
              <p
                className="text-on-surface-variant text-sm"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                NO ACTIVE ENGAGEMENT ZONES
              </p>
              <p
                className="text-on-surface-variant/50 text-xs mt-1"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Create a new operation to begin
              </p>
            </div>
          ) : (
            rooms.map((room) => {
              const playerCount = room.guestId ? 2 : 1;
              return (
                <div
                  key={room.roomId}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 border-b border-outline-variant hover:bg-surface-variant transition-colors items-center group"
                >
                  {/* Sector Info */}
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
                          ? "RECRUITING COMMANDERS"
                          : room.status}
                      </p>
                      <p
                        className="text-xs text-on-surface-variant/60 mt-0.5"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        CODE: #{room.code}
                      </p>
                    </div>
                  </div>

                  {/* Personnel Count */}
                  <div className="hidden md:flex col-span-3 items-center justify-center">
                    <span
                      className="bg-secondary-container text-on-secondary-container px-4 py-1 border border-secondary text-sm"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {String(playerCount).padStart(2, "0")} / 02
                    </span>
                  </div>

                  {/* Deploy Button */}
                  <div className="col-span-1 md:col-span-3 flex justify-end">
                    <button
                      onClick={() => handleJoinRoom(room.roomId)}
                      disabled={loading}
                      className="btn-secondary w-full md:w-auto text-xs"
                    >
                      Deploy
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Refresh */}
          <div className="p-4 flex justify-center">
            <button
              onClick={loadRooms}
              className="btn-secondary text-xs flex items-center gap-2"
            >
              Refresh Sectors{" "}
              <span className="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Mobile Nav */}
      <nav className="bg-surface-container-lowest border-t-2 border-outline-variant fixed bottom-0 w-full z-50 md:hidden flex justify-around items-center h-16">
        <button
          onClick={handleCreateRoom}
          disabled={loading}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors p-2"
        >
          <span className="material-symbols-outlined mb-0.5">
            videogame_asset
          </span>
          <span
            className="text-[10px] uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Play
          </span>
        </button>
        <button
          onClick={loadRooms}
          className="flex flex-col items-center justify-center text-primary p-2"
        >
          <span className="material-symbols-outlined mb-0.5">list_alt</span>
          <span
            className="text-[10px] uppercase font-bold"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Zones
          </span>
        </button>
        <button
          onClick={() => navigate("/ranking")}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors p-2"
        >
          <span className="material-symbols-outlined mb-0.5">query_stats</span>
          <span
            className="text-[10px] uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Stats
          </span>
        </button>
        <button
          onClick={() => navigate("/profile")}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors p-2"
        >
          <span className="material-symbols-outlined mb-0.5">person</span>
          <span
            className="text-[10px] uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Profile
          </span>
        </button>
      </nav>
    </div>
  );
}
