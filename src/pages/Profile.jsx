import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import * as api from "../services/api";
import PageHeader, {
  HeaderDivider,
  HeaderIconButton,
  BackToHQButton,
} from "../components/PageHeader";
import AlertBanner from "../components/AlertBanner";
import BottomNav from "../components/BottomNav";
import SectionCard from "../components/SectionCard";
import TopSecretStamp from "../components/TopSecretStamp";

const NATIONS = ["USA", "UK", "USSR", "GERMANY", "JAPAN", "ITALY"];

const NATION_PORTRAITS = {
  USA: ["USA_GENERAL", "USA_ADMIRAL", "USA_PILOT"],
  UK: ["UK_GENERAL", "UK_ADMIRAL", "UK_PILOT"],
  USSR: ["USSR_GENERAL", "USSR_ADMIRAL", "USSR_PILOT"],
  GERMANY: ["GERMANY_GENERAL", "GERMANY_ADMIRAL", "GERMANY_PILOT"],
  JAPAN: ["JAPAN_GENERAL", "JAPAN_ADMIRAL", "JAPAN_PILOT"],
  ITALY: ["ITALY_GENERAL", "ITALY_ADMIRAL", "ITALY_PILOT"],
};

const NATION_FLAGS = {
  USA: "🇺🇸",
  UK: "🇬🇧",
  USSR: "☭",
  GERMANY: "🇩🇪",
  JAPAN: "🇯🇵",
  ITALY: "🇮🇹",
};

const NATION_LABELS = {
  USA: "Estados Unidos",
  UK: "Reino Unido",
  USSR: "União Soviética",
  GERMANY: "Alemanha",
  JAPAN: "Japão",
  ITALY: "Itália",
};

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedNation, setSelectedNation] = useState("");
  const [selectedPortrait, setSelectedPortrait] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await api.getMe();
      setProfile(data);
      setName(data.name || "");
      setSelectedNation(data.nation || "");
      setSelectedPortrait((data.portrait || "").toUpperCase());
    } catch (err) {
      setError("Falha ao carregar dossiê");
    }
  }

  async function handleUpdateInfo(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const updates = {};
      if (name && name !== profile.name) updates.name = name;
      if (password) updates.password = password;
      if (Object.keys(updates).length > 0) {
        await api.updateMe(updates);
        await refreshUser();
        setPassword("");
        setMessage("DOSSIÊ ATUALIZADO");
        loadProfile();
      }
    } catch (err) {
      setError(err.message || "Falha na atualização");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetNation(nation) {
    setError("");
    setMessage("");
    try {
      await api.setNation(nation);
      setSelectedNation(nation);
      await refreshUser();
      setMessage(`NAÇÃO DEFINIDA: ${nation}`);
    } catch (err) {
      setError(err.message || "Falha ao definir nação");
    }
  }

  async function handleSetPortrait(portrait) {
    setError("");
    setMessage("");
    try {
      await api.setPortrait(portrait);
      setSelectedPortrait(portrait.toUpperCase());
      await refreshUser();
      setMessage("RETRATO ATUALIZADO");
    } catch (err) {
      setError(err.message || "Falha ao definir retrato");
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "CONFIRMAR: Esta ação é irreversível. Excluir seu registro de comando?",
      )
    )
      return;
    try {
      await api.deleteMe();
      logout();
    } catch (err) {
      setError(err.message || "Falha na exclusão");
    }
  }

  const totalMissions = (profile?.wins ?? 0) + (profile?.losses ?? 0);
  const winrate =
    totalMissions > 0
      ? Math.round(((profile?.wins ?? 0) / totalMissions) * 100)
      : 0;
  const availablePortraits = selectedNation
    ? NATION_PORTRAITS[selectedNation] || []
    : [];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <PageHeader>
        <HeaderIconButton
          icon="military_tech"
          title="Ranking"
          onClick={() => navigate("/ranking")}
        />
        <HeaderIconButton
          icon="history"
          title="Histórico"
          onClick={() => navigate("/history")}
        />
        <HeaderDivider />
        <BackToHQButton />
        <HeaderDivider />
        <HeaderIconButton icon="logout" title="Sair" onClick={logout} danger />
      </PageHeader>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
        <AlertBanner type="success" message={message} />
        <AlertBanner type="error" message={error} />

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
                <TopSecretStamp variant="mini" />
              </div>
              <p
                className="text-[0.6rem] text-on-surface-variant uppercase tracking-widest mt-2 text-center"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {selectedPortrait
                  ? selectedPortrait.replace(/_/g, " ")
                  : "SEM RETRATO ATRIBUÍDO"}
              </p>
            </div>

            {/* Name Badge */}
            <div className="border-2 border-outline-variant bg-surface-container-high p-4 text-center">
              <p
                className="text-lg text-on-surface font-bold uppercase tracking-wide"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {profile?.name || "—"}
              </p>
              <p
                className="text-[0.65rem] text-on-surface-variant uppercase tracking-widest mt-1"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                ID: {profile?.id || "—"}
              </p>
            </div>
          </div>

          {/* Right Column - Dossier Card */}
          <div className="border-2 border-outline-variant bg-surface-container p-6 space-y-5">
            <h2
              className="stencil-text text-lg text-primary border-b-2 border-outline-variant pb-2"
              style={{ fontFamily: "var(--font-headline)", fontWeight: 800 }}
            >
              PERFIL DO COMANDANTE
            </h2>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p
                  className="text-[0.65rem] text-on-surface-variant uppercase tracking-widest mb-0.5"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  PATENTE
                </p>
                <p
                  className="text-sm font-bold text-on-surface"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {totalMissions >= 50
                    ? "ALMIRANTE"
                    : totalMissions >= 20
                      ? "CAPITÃO"
                      : totalMissions >= 5
                        ? "TENENTE"
                        : "CADETE"}
                </p>
              </div>
              <div>
                <p
                  className="text-[0.65rem] text-on-surface-variant uppercase tracking-widest mb-0.5"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  SETOR OPERACIONAL
                </p>
                <p
                  className="text-sm font-bold text-on-surface"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {selectedNation
                    ? `${NATION_FLAGS[selectedNation] || ""} ${NATION_LABELS[selectedNation] || selectedNation}`
                    : "NÃO DESIGNADO"}
                </p>
              </div>
            </div>

            {/* Histórico Tático */}
            <div>
              <h3
                className="text-xs text-on-surface-variant uppercase tracking-wider border-b border-outline-variant pb-1 mb-3"
                style={{ fontFamily: "var(--font-headline)", fontWeight: 700 }}
              >
                HISTÓRICO TÁTICO
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-outline-variant p-3 text-center bg-surface-container-high">
                  <p
                    className="text-2xl font-bold text-secondary"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {totalMissions}
                  </p>
                  <p
                    className="text-[0.6rem] text-on-surface-variant uppercase tracking-widest mt-1"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    MISSÕES
                  </p>
                </div>
                <div className="border border-outline-variant p-3 text-center bg-surface-container-high">
                  <p
                    className="text-2xl font-bold text-secondary"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {winrate}%
                  </p>
                  <p
                    className="text-[0.6rem] text-on-surface-variant uppercase tracking-widest mt-1"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    VITÓRIAS
                  </p>
                </div>
                <div className="border border-outline-variant p-3 text-center bg-surface-container-high">
                  <p
                    className="text-2xl font-bold text-secondary"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {profile?.wins ?? 0}
                  </p>
                  <p
                    className="text-[0.6rem] text-on-surface-variant uppercase tracking-widest mt-1"
                    style={{ fontFamily: "var(--font-mono)" }}
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
                style={{ fontFamily: "var(--font-headline)", fontWeight: 700 }}
              >
                NOTAS DO COMANDO CENTRAL
              </h3>
              <div className="border-l-4 border-primary/40 pl-4 py-2">
                <p
                  className="text-sm italic text-on-surface-variant"
                  style={{ fontFamily: "var(--font-body)" }}
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

        {/* Portrait Selection */}
        {selectedNation && (
          <SectionCard title="RETRATO OFICIAL">
            <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
              {availablePortraits.map((portrait) => (
                <button
                  key={portrait}
                  onClick={() => handleSetPortrait(portrait)}
                  className={`relative p-4 border-2 flex flex-col items-center gap-2 transition-all ${
                    selectedPortrait === portrait
                      ? "border-secondary bg-secondary/15"
                      : "border-outline-variant hover:border-outline hover:bg-surface-container-high"
                  }`}
                >
                  {selectedPortrait === portrait && (
                    <span className="absolute top-1 right-1 material-symbols-outlined text-secondary text-sm">
                      check_circle
                    </span>
                  )}
                  <div className="w-16 h-20 bg-surface-container-high border border-outline-variant flex items-center justify-center grayscale">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant">
                      person
                    </span>
                  </div>
                  <span
                    className="text-[0.6rem] text-on-surface-variant uppercase tracking-wider"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {portrait.replace(/_/g, " ")}
                  </span>
                </button>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Edit Form */}
        <SectionCard title="MODIFICAR CREDENCIAIS">
          <form onSubmit={handleUpdateInfo} className="space-y-4 max-w-md">
            <div>
              <label
                className="text-xs text-on-surface-variant uppercase tracking-widest block mb-1"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Nome do Comandante
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container-low border-2 border-outline-variant px-4 py-2 text-on-surface outline-none focus:border-primary"
                style={{ fontFamily: "var(--font-mono)" }}
              />
            </div>
            <div>
              <label
                className="text-xs text-on-surface-variant uppercase tracking-widest block mb-1"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Novo Código de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Deixe vazio para manter o atual"
                className="w-full bg-surface-container-low border-2 border-outline-variant px-4 py-2 text-on-surface outline-none focus:border-primary placeholder:text-on-surface-variant/50"
                style={{ fontFamily: "var(--font-mono)" }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-sm"
            >
              {loading ? "PROCESSANDO..." : "ATUALIZAR DOSSIÊ"}
            </button>
          </form>
        </SectionCard>

        {/* Danger Zone */}
        <SectionCard title="ZONA DE PERIGO — IRREVERSÍVEL" variant="danger">
          <p
            className="text-on-surface-variant text-sm mb-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            ESTA AÇÃO APAGARÁ PERMANENTEMENTE SEU REGISTRO DE COMANDO E TODOS OS
            DADOS ASSOCIADOS.
          </p>
          <button onClick={handleDelete} className="btn-danger text-sm">
            EXCLUIR REGISTRO DE COMANDO
          </button>
        </SectionCard>
      </main>

      <BottomNav
        items={[
          { icon: "home", label: "HQ", path: "/" },
          { icon: "military_tech", label: "Rank", path: "/ranking" },
          { icon: "history", label: "Hist", path: "/history" },
          { icon: "person", label: "Perfil", path: "/profile" },
        ]}
      />
    </div>
  );
}
