<p align="center">
  <img src="public/logo-icon.png" alt="Monitor de Promos Logo" width="84" />
</p>

<h1 align="center">Monitor de Promos (<code>telegram-monitor-frontend</code>)</h1>

<p align="center">
  🌐 <strong>Language:</strong> <a href="README.md">Português</a> | English
</p>

Modern, responsive, bilingual (`pt-BR` / `en-US`) web interface for the **Telegram Monitor** platform, deployed on **Cloudflare Workers** using **Workers Static Assets** and an edge reverse proxy to the Go backend [`telegram-monitor`](https://github.com/matrocheetos/telegram-monitor).

---

## Objective

**`telegram-monitor-frontend`** provides a complete web control panel for end users and administrators to operate the Telegram deals & coupons monitor straight from the browser without terminal access:

- **Zero-CPU Edge Architecture for Static Assets**: The SPA is served globally from Cloudflare's edge via **Workers Static Assets** (`not_found_handling: "single-page-application"`), consuming **0 ms of Worker CPU** per page navigation.
- **Edge API Proxy (`/api/*`)**: The Worker entrypoint (`src/worker/index.ts`) intercepts `/api/*` requests (`run_worker_first: ["/api/*"]`) and forwards them to `BACKEND_ORIGIN`, preserving `Set-Cookie` headers and the client IP (`X-Forwarded-For` from `cf-connecting-ip`) while avoiding cross-site cookie issues.
- **Full User & Admin Workflows (RBAC)**:
  - **First Boot (`/setup`)**: Guided creation of the initial Admin account when the backend database has no users yet.
  - **Authentication (`/login`)**: Cookie-based session login with `X-CSRF-Token` protection.
  - **User Dashboard (`/dashboard`)**: Manage monitored interest terms (including negative exclusions with `-term` and optional max price), inspect personal product (`promo/user/[username]`) and global coupon (`promo/cupom`) **ntfy** cards with one-click copy and subscription instructions (`NtfyInfoModal`).
  - **Offers Found (`/offers`)**: Searchable history split into **Products** (with extracted price and direct store link) and **Coupons** (with one-click coupon copy and store link).
  - **Admin — Telegram Connection (`/admin/telegram`)**: Browser-based 2-step MTProto authentication (`API_ID`, `API_HASH`, phone number, OTP code, and optional 2FA), live session status, and disconnect action.
  - **Admin — Monitored Channels (`/admin/channels`)**: Sync Telegram dialogs/channels and independently toggle **Monitor Products** and **Monitor Coupons** per channel, with search and live counters.
  - **Admin — User Management (`/admin/users`)**: Register users (`username` + password, no email required), inspect active user terms, reset passwords, and delete accounts.
- **Instant Client-Side i18n (`PT | EN`)**: Seamless switching between Portuguese (`pt-BR`) and English (`en-US`), persisted in `localStorage` and the `lang` cookie.

---

## Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Runtime & Edge Hosting** | **Cloudflare Workers + Wrangler `^4.160.0`** | Workers Static Assets SPA + `/api/*` edge proxy (`nodejs_compat`) |
| **UI Framework** | **React 19 (`^19.3.1`)** | Functional components and scalable composition patterns |
| **Language** | **TypeScript (`^7.0.2`)** | `strict: true`, `noImplicitAny`, `noUnusedLocals`, and strongly typed API contracts |
| **Bundler** | **Vite (`^8.3.8`) + `@cloudflare/vite-plugin`** | Local `workerd` integration and optimized production bundling |
| **Routing** | **TanStack Router (`^1.170.46`)** | Type-safe file-based routing, automatic code splitting, and `beforeLoad` guards (Setup, Auth, RBAC) |
| **Async State** | **TanStack Query v5 (`^5.107.1`)** | Request caching, loading/error states, and automatic invalidation after mutations |
| **Styling** | **Tailwind CSS v4 (`@tailwindcss/vite`)** | Responsive Desktop & Mobile design system with custom theme tokens in `src/app/styles.css` |
| **Testing & Quality** | **Vitest (`^5.1.0`), Testing Library, ESLint** | Component and integration tests in `jsdom` with `@testing-library/react` and linting |

---

## Project Structure

```text
telegram-monitor-frontend/
├── public/
│   ├── logo-icon.png              # Official application icon
│   ├── apple-touch-icon.png
│   └── favicon*.png / favicon.ico
├── src/
│   ├── worker/
│   │   └── index.ts               # Cloudflare Worker (/api/* proxy -> BACKEND_ORIGIN + ASSETS fallback)
│   ├── app/
│   │   ├── main.tsx               # React 19 entrypoint
│   │   ├── router.tsx             # TanStack Router instance with QueryClient context
│   │   ├── routeTree.gen.ts       # Auto-generated route tree by @tanstack/router-plugin
│   │   └── styles.css             # Tailwind CSS v4 + design tokens
│   ├── routes/
│   │   ├── __root.tsx             # Global providers (QueryClient, I18n)
│   │   ├── index.tsx              # Session-aware root redirect
│   │   ├── setup.tsx              # /setup (First Boot - Create Admin)
│   │   ├── login.tsx              # /login
│   │   ├── _authenticated.tsx     # Authenticated shell (Desktop Sidebar + Mobile Drawer/Nav)
│   │   └── _authenticated/
│   │       ├── dashboard.tsx      # /dashboard (My Monitored Terms + ntfy Cards)
│   │       ├── offers.tsx         # /offers (Products & Coupons)
│   │       ├── _admin.tsx         # Strict RBAC guard for role === "admin"
│   │       └── _admin/
│   │           ├── admin.telegram.tsx  # /admin/telegram
│   │           ├── admin.channels.tsx  # /admin/channels
│   │           └── admin.users.tsx     # /admin/users
│   ├── components/                # Layout components (Sidebar, PageHeader, LanguageSwitcher) and UI primitives (Modals, EmptyState, CopyButton)
│   └── lib/
│       ├── api/                   # Typed fetch wrapper (credentials + CSRF), API types, and TanStack Query hooks
│       └── i18n/                  # pt-BR / en-US dictionaries and reactive provider
├── tests/                         # Vitest unit & component tests
├── index.html
├── vite.config.ts
├── wrangler.jsonc
└── package.json
```

---

## How to Run

### 1. Running Locally

#### Prerequisites
- **Node.js** (LTS recommended) and **npm**.
- The [`telegram-monitor`](https://github.com/matrocheetos/telegram-monitor) backend running locally (default: `http://localhost:8080`).

#### Step-by-Step

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/matrocheetos/telegram-monitor-frontend.git
   cd telegram-monitor-frontend
   npm install
   ```

2. Check `.dev.vars` at the project root (used by the Cloudflare Vite plugin / Wrangler locally):
   ```env
   BACKEND_ORIGIN=http://localhost:8080
   ```
   *(If your Go backend runs on a different port, update `BACKEND_ORIGIN` in `.dev.vars` and the proxy target in `vite.config.ts` if needed.)*

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open the URL printed in your terminal (default: `http://localhost:5173`).

5. Useful verification & build scripts:
   ```bash
   npm run typecheck   # TypeScript typecheck (tsc --noEmit)
   npm run lint        # Run ESLint
   npm test            # Run Vitest test suite
   npm run build       # Build production bundle into dist/
   npm run preview     # Preview production build locally
   ```

---

### 2. Running in Production (Cloudflare Workers)

#### Prerequisites
- A **Cloudflare** account (compatible with the **Cloudflare Workers Free Plan**).
- Your [`telegram-monitor`](https://github.com/matrocheetos/telegram-monitor) backend reachable over HTTPS (e.g., behind a TLS reverse proxy or Cloudflare Tunnel).

#### Step-by-Step

1. Update `wrangler.jsonc` with your backend origin and target domain:
   - Set `vars.BACKEND_ORIGIN` to the public HTTPS URL of your Go API:
     ```jsonc
     "vars": {
       "BACKEND_ORIGIN": "https://api.your-domain.com"
     }
     ```
   - Update `routes` with your custom Cloudflare domain (or remove `routes` and set `"workers_dev": true` to deploy to `*.workers.dev`).

2. Authenticate Wrangler with your Cloudflare account:
   ```bash
   npx wrangler login
   ```

3. Build and deploy to Cloudflare Workers:
   ```bash
   npm run build
   npx wrangler deploy
   ```

4. On your Go backend (`telegram-monitor`), make sure `.env` includes:
   - `APP_ENV=production`
   - `CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com`

5. Open your deployed frontend URL in a browser to complete `/setup` (on first boot) and connect your Telegram account at `/admin/telegram`.
