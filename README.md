# Naval Warfare 1941

Jogo multiplayer de Batalha Naval ambientado na Segunda Guerra Mundial, com comunicação em tempo real, sistema de nações, ranking competitivo e estética militar retrô.

![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-8-purple)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-cyan)
![WebSocket](https://img.shields.io/badge/WebSocket-STOMP-green)

---

## Visão Geral

**Naval Warfare 1941** é o frontend de um jogo de Batalha Naval online onde dois jogadores se enfrentam em tempo real. Cada jogador pode escolher uma nação época (EUA, Reino Unido, URSS, Alemanha, Japão ou Itália), posicionar sua frota em um tabuleiro 10x10 e tentar afundar os navios inimigos por turnos.

### Funcionalidades Principais

- **Matchmaking por salas** — criação de sala com código de 6 caracteres para compartilhar
- **Gameplay em tempo real** — turnos alternados via WebSocket com feedback instantâneo
- **Timer de turno** — 15 segundos por jogada; tiro automático aleatório se esgotar
- **6 nações jogáveis** — cada uma com sprites de navios e portraits de comandantes únicos
- **5 classes de navios** — Porta-Aviões (5), Encouraçado (4), Cruzador (3), Submarino (3), Destroyer (2)
- **Ranking competitivo** — baseado em winrate (mínimo 5 partidas)
- **Histórico de partidas** — registro completo de vitórias e derrotas
- **Reconexão automática** — WebSocket reconecta e re-subscreve sem perda de estado
- **Persistência de sessão** — dados do oponente sobrevivem a F5 via sessionStorage

---

## Stack Tecnológica

| Camada      | Tecnologia                             | Versão    |
| ----------- | -------------------------------------- | --------- |
| Framework   | React                                  | 19        |
| Build Tool  | Vite                                   | 8         |
| Estilização | Tailwind CSS                           | 4         |
| Roteamento  | React Router                           | 7         |
| WebSocket   | @stomp/stompjs + sockjs-client         | 7.3 / 1.6 |
| Deploy      | Vercel                                 | —         |
| Ícones      | Material Symbols (Google Fonts)        | —         |
| Tipografia  | Anybody, Courier Prime, JetBrains Mono | —         |

### Justificativas

**React 19** — Componentes funcionais com hooks proporcionam uma arquitetura simples e legível para gerenciar estados complexos de jogo (grids, turnos, animações). O modelo reativo do React se encaixa naturalmente com os eventos do WebSocket, onde cada mensagem recebida atualiza o estado e re-renderiza apenas o necessário.

**Vite 8** — Build extremamente rápido com HMR instantâneo. Para um projeto com muitos assets (sprites de navios, portraits, ícones SVG), o Vite resolve imports estáticos de forma eficiente sem overhead de bundling em dev. O plugin `@tailwindcss/vite` integra o Tailwind diretamente no pipeline sem necessidade de PostCSS separado.

**Tailwind CSS 4** — Estilização utility-first que permite iterar rapidamente no visual militar/retrô sem manter arquivos CSS separados por componente. O design system customizado (cores, fontes) é definido via `@theme` no CSS raiz, mantendo consistência visual em toda a aplicação. Zero CSS morto em produção.

**React Router 7** — Roteamento declarativo com suporte a rotas protegidas (autenticação + seleção de nação obrigatória). O pattern de `ProtectedRoute`/`PublicRoute` com redirects condicionais garante que o fluxo do usuário é sempre válido.

**STOMP sobre SockJS** — O backend Spring Boot usa STOMP como protocolo de mensagens sobre WebSocket. O SockJS fornece fallback para navegadores/proxies que não suportam WebSocket nativo. A combinação permite pub/sub com tópicos (eventos públicos do jogo) e filas pessoais (resultados de posicionamento, erros), essencial para a lógica de turnos.

**Vercel** — Deploy automático com zero configuração para SPAs. O `vercel.json` com rewrite para `index.html` garante que o React Router funciona com client-side routing em produção.

---

## Arquitetura

```
src/
├── App.jsx                 # Roteamento e guards de autenticação
├── main.jsx                # Entry point
├── index.css               # Design system (Tailwind @theme) + animações
├── contexts/
│   └── AuthContext.jsx     # Estado global de autenticação (JWT + user)
├── services/
│   ├── api.js              # Cliente REST (fetch com interceptor 401)
│   ├── websocket.js        # Gerenciador STOMP (conexão, pub/sub, reconexão)
│   └── sounds.js           # Efeitos sonoros do jogo
├── constants/
│   ├── nations.js          # Dados de nações, portraits, ícones
│   └── ships.js            # Sprites de navios por nação + tamanhos
├── components/
│   ├── Board.jsx           # Tabuleiro 10x10 com sprites overlay
│   ├── VersusScreen.jsx    # Tela de apresentação pré-partida
│   ├── ConfirmDialog.jsx   # Modal de confirmação reutilizável
│   ├── AlertBanner.jsx     # Notificações de erro/aviso
│   ├── PageHeader.jsx      # Header padrão com ações
│   ├── BottomNav.jsx       # Navegação mobile
│   ├── PortraitImage.jsx   # Renderização de portraits com fallback
│   ├── NationIcon.jsx      # Ícone SVG da nação
│   └── ...
├── pages/
│   ├── Login.jsx           # Autenticação
│   ├── Register.jsx        # Cadastro
│   ├── SelectNation.jsx    # Escolha de nação (irreversível)
│   ├── Home.jsx            # Lobby (lista de salas + criar/entrar)
│   ├── Room.jsx            # Sala de espera (código + WebSocket)
│   ├── Game.jsx            # Tela principal do jogo (setup/playing/finished)
│   ├── Profile.jsx         # Perfil do jogador
│   ├── Ranking.jsx         # Ranking por winrate
│   └── MatchHistory.jsx    # Histórico de partidas
└── assets/                 # Assets estáticos importados pelo bundler

public/
├── ships/                  # Sprites de navios por nação (h/v)
│   ├── usa/
│   ├── reino-unido/
│   ├── urss/
│   ├── alemanha/
│   ├── japao/
│   └── italia/
├── portraits/              # Imagens de comandantes
├── icons/
│   ├── nations/            # SVGs de bandeiras/emblemas
│   └── favicon.png
└── ...
```

---

## Design Visual

A interface segue uma estética **militar retrô / dossie** da Segunda Guerra Mundial:

- **Paleta escura** com tons de verde oliva, sépia e papel envelhecido
- **Tipografia stencil** (Anybody) para títulos e ações principais
- **Monospace** (JetBrains Mono) para dados técnicos, coordenadas e logs
- **Serif** (Courier Prime) para texto corrido
- **Scanlines** e **CRT glow** sobre os tabuleiros simulando equipamento radar
- **Grid tático** como background pattern em telas de espera
- **Animações de impacto** (hit/miss/sunk) com feedback visual e sonoro

---

## Como Rodar

```bash
# Instalar dependências
npm install

# Desenvolvimento (hot reload)
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

O frontend espera que o backend esteja disponível em `https://batalha-naval-9gfm.onrender.com` (configurado em `src/services/api.js` e `src/services/websocket.js`).

---

## Fluxo do Jogo

```
Login/Registro
     │
     ▼
Seleção de Nação (irreversível)
     │
     ▼
Lobby (Home)
     │
     ├── Criar Sala ──► Sala de Espera (código) ──► Oponente entra
     │                                                    │
     └── Entrar por Código/Lista ─────────────────────────┘
                                                          │
                                                          ▼
                                                   Tela Versus
                                                          │
                                                          ▼
                                              Setup (posicionar 5 navios)
                                                          │
                                                          ▼
                                              Combate (turnos alternados)
                                                          │
                                              ┌───────────┴───────────┐
                                              ▼                       ▼
                                          Vitória                 Derrota
                                              │                       │
                                              └───────────┬───────────┘
                                                          ▼
                                                   Voltar ao Lobby
```

---

## Comunicação com o Backend

### REST API

- Autenticação JWT (login, registro, logout)
- CRUD de jogador (perfil, nação, portrait)
- Gerenciamento de salas (criar, entrar, listar, fechar)
- Estado do jogo e tabuleiros
- Ranking e histórico

### WebSocket (STOMP)

- `/topic/game/{gameId}` — eventos públicos (ready, started, ataques, game over, surrender)
- `/user/queue/room-joined` — notificação de guest para o host
- `/user/queue/place-result` — resultado de posicionamento de navio
- `/user/queue/errors` — erros de ações WebSocket

Documentação completa da API disponível em [`API_FRONTEND.md`](./API_FRONTEND.md).

### Backend:

O Frontend roda ao lado do [repositório](https://github.com/KaueDylon/batalha-naval) de Batalha Naval.

---

## Deploy

O frontend é deployado automaticamente na **Vercel**. O arquivo `vercel.json` configura o rewrite de todas as rotas para `index.html`, garantindo que o React Router funcione com client-side navigation.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Estrutura de Assets

### Sprites de Navios

Cada nação possui 10 imagens (5 classes de navio × 2 orientações):

```
public/ships/{nação}/{classe}-{nação}-{horizontal|vertical}.png
```

### Portraits de Comandantes

3 portraits por nação (General, Admiral, Pilot):

```
public/portraits/{nação}-{cargo}.{png|webp}
```

### Ícones de Nações

SVGs de bandeiras/emblemas:

```
public/icons/nations/{nação}.svg
```
