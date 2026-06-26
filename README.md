<!-- PROJECT SHIELDS -->
[![Next.js][next-shield]][next-url]
[![TypeScript][ts-shield]][ts-url]
[![React][react-shield]][react-url]
[![Website][website-shield]][website-url]

<h1 align="center">World Cup Briefing</h1>

<p align="center">
  AI-powered football highlight reels — just describe what you want to see.
  <br />
  <br />
  <a href="#how-it-works"><strong>How It Works</strong></a>
  ·
  <a href="https://console.videodb.io">Get VideoDB Key</a>
  ·
  <a href="https://tinyfish.ai">Get TinyFish Key</a>
</p>

---

## What is World Cup Briefing?

World Cup Briefing turns natural language requests into playable football highlight reels. Tell it what you want — "all yellow cards from Brazil vs Morocco" or "penalty moments from Mexico vs South Africa" — and an AI agent finds the match footage, indexes every scene visually, hunts down the moments you asked for, and compiles them into a stream you can watch immediately.

- **Natural language input**: ask for fouls, cards, goals, penalties, celebrations, or any moment from a match
- **AI-powered video search**: TinyFish finds the best YouTube match footage, preferring full matches and extended highlights while filtering out shorts and noise
- **Visual scene indexing**: VideoDB's AI vision model analyzes every frame, tagging events with broadcast clock timestamps
- **Playable reels**: compiled clips with instant embed playback — no video editing required
- **Daily schedules**: set recurring briefings that run automatically and notify you on Telegram, Discord, or Slack
- **Public gallery**: browse curated reels from the community

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (we use [Azure Database for PostgreSQL](https://azure.microsoft.com/products/postgresql))
- [TinyFish API key](https://tinyfish.ai) — for web video search
- [VideoDB API key](https://console.videodb.io) — for video indexing and reel compilation
- [OpenRouter API key](https://openrouter.ai) — for the AI agent

### Setup

```bash
git clone https://github.com/video-db/worldcup-video-agent.git
cd worldcup-video-agent
npm install
```

Create a `.env.local` file:

```env
DATABASE_URL=postgres://...
OPEN_ROUTER_API_KEY=sk-or-...
ENCRYPTION_SECRET=$(openssl rand -hex 32)
ADMIN_SECRET=your-admin-secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000   # set to Vercel URL in production
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Add API keys** in the header and enter your TinyFish and VideoDB keys.

---

## Features

| Feature | Description |
|---|---|
| **AI Agent Pipeline** | LLM-powered agent researches match facts via TinyFish, searches for video footage, and dispatches background reel creation |
| **Visual Scene Indexing** | VideoDB's vision model analyzes frames at 4-6 second intervals, tagging events with timestamps (e.g. `(63')`) |
| **Smart Video Search** | TinyFish search targets full matches and extended highlights with custom confidence scoring that penalizes shorts and noise |
| **Reel Compilation** | Backtracking algorithm includes build-up context before each moment, merges overlapping clips, generates a stream URL |
| **Scheduled Briefings** | Daily recurring briefings with custom run times and timezones, powered by Inngest cron jobs |
| **Telegram, Discord & Slack** | Send finished reels to your inbox as rich messages with key moments, match summary, and watch link. Also send on demand from any completed briefing. |
| **Encrypted Storage** | API keys and inbox credentials encrypted with AES-256-GCM before touching the database |
| **Public Gallery** | Curated community reels discoverable by anyone, with search across query, topic, and match summary |
| **Onboarding Stepper** | Interactive 4-step pipeline walkthrough — add keys, configure inbox, create schedule, go live |
| **Free Tier** | 3 free briefing runs per IP address. Clear stored keys and restart anytime. |
| **Low-Credits Warning** | Banner alerts you when your VideoDB or TinyFish balance is running low |
| **Instant Replay** | Watch any reel with a seekable timeline, variable playback speed (0.25x–2x), and auto-scroll through key moments |
| **Public Sharing** | Toggle any completed briefing to be publicly discoverable in the gallery |
| **Fallback Thumbnails** | Auto-generated gradient thumbnails when VideoDB poster frames are unavailable |
| **Failed-Runs Filter** | Filter your personal briefings to show only failed runs for quick debugging |
| **Pagination** | Cursor-based pagination across gallery, personal briefings, and schedule runs |
| **Session Auth** | Ephemeral session tokens (24h TTL) tied to your VideoDB user ID — no passwords, no accounts |

---

## How It Works

```
User types: "all red cards from Argentina vs France"
       │
       ▼
  AI Agent (OpenRouter / DeepSeek)
       │
       ├─→ tinyfishResearch: searches match reports for event facts (minute, player, half)
       │
       ├─→ tinyfishSearch: finds YouTube match footage (full match / extended highlights)
       │
       └─→ videoDbCreateReel: dispatches Inngest background job
                │
                ▼
         Inngest Pipeline (async, no timeout)
                │
                ├─→ VideoDB: upload YouTube video
                ├─→ VideoDB: build AI scene index (vision model analyzes every frame)
                ├─→ VideoDB: search index for requested moments
                ├─→ VideoDB: compile matching clips into a reel stream
                └─→ LLM: generate title + match summary
                         │
                         ▼
                  Reel ready → notifications sent → watch at /b/{runId}
```

For **scheduled briefings**, an Inngest cron function runs every minute, picks up due schedules, searches for match footage, and kicks off the same pipeline automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| AI Agent | OpenRouter + Vercel AI SDK (`streamText` + `tool`) |
| Database | PostgreSQL (Azure Database for PostgreSQL) + Drizzle ORM |
| Video Indexing | VideoDB |
| Web Search | TinyFish |
| Background Jobs | Inngest |
| Encryption | AES-256-GCM (Node.js `crypto`) |
| Structured Logging | Pino |
| Validation | Zod |

---

## Architecture

```
app/                         # Next.js App Router
  page.tsx                   # Landing page, compose bar, briefing grid, onboarding stepper
  b/[runId]/page.tsx         # Single briefing viewer with player + send-to-inbox
  replay/[runId]/page.tsx    # Instant replay with timeline, speed controls, auto-scroll
  gallery/page.tsx           # Public curated reels with search, tabs, pagination
  me/page.tsx                # User's personal briefings with failed-runs filter
  schedules/page.tsx         # Schedule management + inbox setup
  api/
    agent/route.ts           # AI agent streaming endpoint (free-tier enforcement)
    auth/route.ts            # Key validation + VDB user_id session tokens
    admin/runs/route.ts      # Admin unseed endpoint
    admin/seed/route.ts      # Admin seed gallery endpoint
    channels/route.ts        # Telegram/Discord/Slack inbox CRUD
    schedules/route.ts       # Scheduled briefing CRUD with pagination
    run-status/[runId]/      # Poll run state during processing
    gallery/route.ts         # Public runs list with search + pagination
    send-to-inbox/route.ts   # On-demand send to inbox
    credits/route.ts         # VideoDB + TinyFish balance check
    validate-channels/       # Validate inbox credentials
    validate-keys/           # Validate API keys
    briefing/route.ts        # Briefing detail endpoint
    search/route.ts          # TinyFish search proxy
components/                  # Shared UI components
  Header.tsx                 # Top nav with theme toggle, key management
  KeyModal.tsx               # API key entry modal
  BriefingCard.tsx           # Reel card with status, thumbnail, actions
  SendToInboxModal.tsx       # Send finished reel to inbox on demand
  LowCreditsBanner.tsx       # Low-balance warning banner
  onboarding-stepper.tsx     # Interactive 4-step setup wizard
  Pagination.tsx             # Cursor-based pagination controls
  StatusBadge.tsx            # Run status indicator
  FallbackThumbnail.tsx      # Auto-generated gradient thumbnails
  ChannelIcon.tsx            # Telegram/Discord/Slack icons
  Icons.tsx                  # SVG icon library
  ConfirmModal.tsx           # Confirmation dialog
  ModalShell.tsx             # Reusable modal wrapper
  scheduler-illustrations.tsx# Rough.js illustrated scheduler story
lib/                         # Core logic
  video-pipeline.ts          # TinyFish search + VideoDB pipeline
  agent-tools.ts             # AI agent tool definitions
  llm.ts                     # LLM model configuration
  notify.ts                  # Telegram + Discord + Slack messaging
  encrypt.ts                 # AES-256-GCM helpers
  session.ts                 # Encrypted session tokens (VDB user_id)
  time.ts                    # Date/time utilities
  timezone.ts                # Timezone validation + zone mapping
  normalize-url.ts           # URL normalization utilities
  demo-data.ts               # Fallback videos + candidate scoring
  db/                        # Drizzle schema, migrations
inngest/
  client.ts                  # Inngest setup
  functions.ts               # createReel + checkSchedules
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (Azure) |
| `OPEN_ROUTER_API_KEY` | Yes | — | OpenRouter API key for the AI agent |
| `ENCRYPTION_SECRET` | Yes | — | 32-byte hex key for encrypting stored credentials |
| `ADMIN_SECRET` | Yes | — | Secret for admin endpoints (seed/unseed gallery runs) |
| `TINYFISH_API_KEY` | Optional | — | Default TinyFish key (users can override with their own via UI) |
| `VIDEO_DB_API_KEY` | Optional | — | Default VideoDB key (users can override with their own via UI) |
| `OPENROUTER_MODEL` | No | `deepseek/deepseek-chat` | Model for the agent |
| `LOG_LEVEL` | No | `info` | Pino log level (debug, info, warn, error) |
| `NEXT_PUBLIC_BASE_URL` | Production | Auto-detected from `VERCEL_URL` | Base URL for notification links |
| `INNGEST_EVENT_KEY` | Optional | — | Inngest Cloud event key |
| `INNGEST_DEV` | Optional | `0` | Set to `1` to use Inngest dev server locally |

---

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply Drizzle migrations
npm run db:studio    # Open Drizzle Studio
```

---

<p align="center">Made with ❤️ by the <a href="https://videodb.io">VideoDB</a> and <a href="https://tinyfish.ai">TinyFish</a> teams</p>

<!-- MARKDOWN LINKS & IMAGES -->
[next-shield]: https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[next-url]: https://nextjs.org/
[ts-shield]: https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[ts-url]: https://www.typescriptlang.org/
[react-shield]: https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black
[react-url]: https://reactjs.org/
[website-shield]: https://img.shields.io/website?url=https%3A%2F%2Fvideodb.io%2F&style=for-the-badge&label=videodb.io
[website-url]: https://videodb.io/
