<p align="center">
  <img src="public/logo-icon.png" alt="Monitor de Promos Logo" width="84" />
</p>

<h1 align="center">Monitor de Promos (<code>telegram-monitor-frontend</code>)</h1>

<p align="center">
  🌐 <strong>Idioma:</strong> Português | <a href="README.en.md">English</a>
</p>

Interface web moderna, responsiva e bilíngue (`pt-BR` / `en-US`) para o sistema **Telegram Monitor**, hospedada no **Cloudflare Workers** com **Workers Static Assets** e proxy de borda integrado para o backend Go [`telegram-monitor`](https://github.com/matrocheetos/telegram-monitor).

---

## Objetivo

O **`telegram-monitor-frontend`** entrega um painel de controle completo para usuários finais e administradores operarem o monitor de promoções e cupons do Telegram diretamente pelo navegador, sem depender de terminal ou configurações manuais no servidor:

- **Arquitetura Edge Zero-CPU para Assets**: A SPA é servida diretamente pela rede global da Cloudflare via **Workers Static Assets** (`not_found_handling: "single-page-application"`), consumindo **0 ms de CPU** por navegação de interface.
- **Proxy Reverso de Borda para `/api/*`**: O entrypoint do Worker (`src/worker/index.ts`) intercepta rotas `/api/*` (`run_worker_first: ["/api/*"]`) e as encaminha para `BACKEND_ORIGIN`, preservando cookies de sessão (`Set-Cookie`) e o IP real do cliente (`X-Forwarded-For` via `cf-connecting-ip`), evitando atritos de cookies *cross-site*.
- **Experiência Completa para Usuários e Admins (RBAC)**:
  - **First Boot (`/setup`)**: Criação guiada da conta Admin inicial quando o banco de dados ainda está vazio.
  - **Autenticação (`/login`)**: Login via cookie de sessão com proteção `X-CSRF-Token`.
  - **Dashboard do Usuário (`/dashboard`)**: Cadastro e remoção de termos de interesse (suporte a termos negativos `-palavra` e preço máximo opcional), visualização dos canais **ntfy** pessoal (`promo/user/[username]`) e global de cupons (`promo/cupom`) com cópia rápida e modal de instruções de assinatura (`NtfyInfoModal`).
  - **Ofertas Encontradas (`/offers`)**: Histórico pesquisável dividido nas abas **Produtos** (com preço extraído e link direto) e **Cupons** (com cópia rápida do código e link da loja).
  - **Admin — Conexão Telegram (`/admin/telegram`)**: Autenticação MTProto em 2 etapas no navegador (`API_ID`, `API_HASH`, telefone, código OTP e 2FA opcional), status da conexão e desconexão.
  - **Admin — Canais Monitorados (`/admin/channels`)**: Sincronização de canais/grupos do Telegram e alternância independente de **Monitorar Produtos** e **Monitorar Cupom**, com busca e contadores.
  - **Admin — Gestão de Usuários (`/admin/users`)**: Registro de usuários (`username` + senha, sem e-mail), consulta dos termos ativos por usuário, redefinição de senha e remoção de contas.
- **Tradução Instantânea (`PT | EN`)**: Alternância imediata no cliente entre Português (`pt-BR`) e Inglês (`en-US`), persistida em `localStorage` e cookie `lang`.

---

## Stack Tecnológica

| Camada | Tecnologia | Detalhes |
| :--- | :--- | :--- |
| **Runtime & Edge Hosting** | **Cloudflare Workers + Wrangler `^4.160.0`** | Static Assets SPA + Worker proxy para `/api/*` (`nodejs_compat`) |
| **Framework UI** | **React 19 (`^19.3.1`)** | Componentes funcionais e composição escalável |
| **Linguagem** | **TypeScript (`^7.0.2`)** | `strict: true`, `noImplicitAny`, `noUnusedLocals` e tipagem completa dos contratos da API |
| **Bundler** | **Vite (`^8.3.8`) + `@cloudflare/vite-plugin`** | Desenvolvimento local integrado ao runtime `workerd` e build otimizado |
| **Roteamento** | **TanStack Router (`^1.170.46`)** | Roteamento *file-based* type-safe, code splitting automático e guards `beforeLoad` (Setup, Auth, RBAC) |
| **Estado Assíncrono** | **TanStack Query v5 (`^5.107.1`)** | Cache de requisições, estados de carregamento/erro e invalidação automática após mutações |
| **Estilização** | **Tailwind CSS v4 (`@tailwindcss/vite`)** | Design system responsivo para Desktop e Mobile com tokens dedicados em `src/app/styles.css` |
| **Testes & Qualidade** | **Vitest (`^5.1.0`), Testing Library, ESLint** | Testes de interface em `jsdom` com `@testing-library/react` e lint estático |

---

## Estrutura do Projeto

```text
telegram-monitor-frontend/
├── public/
│   ├── logo-icon.png              # Ícone oficial da aplicação
│   ├── apple-touch-icon.png
│   └── favicon*.png / favicon.ico
├── src/
│   ├── worker/
│   │   └── index.ts               # Cloudflare Worker (proxy /api/* -> BACKEND_ORIGIN + ASSETS fallback)
│   ├── app/
│   │   ├── main.tsx               # Entrypoint React 19
│   │   ├── router.tsx             # Instância do TanStack Router com QueryClient
│   │   ├── routeTree.gen.ts       # Árvore de rotas gerada pelo @tanstack/router-plugin
│   │   └── styles.css             # Tailwind CSS v4 + tokens visuais
│   ├── routes/
│   │   ├── __root.tsx             # Providers globais (QueryClient, I18n)
│   │   ├── index.tsx              # Redirecionamento inicial baseado na sessão
│   │   ├── setup.tsx              # /setup (First Boot - Criar Admin)
│   │   ├── login.tsx              # /login
│   │   ├── _authenticated.tsx     # Shell autenticado (Sidebar Desktop + Drawer/Nav Mobile)
│   │   └── _authenticated/
│   │       ├── dashboard.tsx      # /dashboard (Meus Termos Monitorados + Cards ntfy)
│   │       ├── offers.tsx         # /offers (Produtos & Cupons)
│   │       ├── _admin.tsx         # Guard RBAC exclusivo para role === "admin"
│   │       └── _admin/
│   │           ├── admin.telegram.tsx  # /admin/telegram
│   │           ├── admin.channels.tsx  # /admin/channels
│   │           └── admin.users.tsx     # /admin/users
│   ├── components/                # Componentes de layout (Sidebar, PageHeader, LanguageSwitcher) e UI (Modais, EmptyState, CopyButton)
│   └── lib/
│       ├── api/                   # Cliente fetch (credentials + CSRF), tipos e hooks do TanStack Query
│       └── i18n/                  # Dicionários pt-BR / en-US e provider reativo
├── tests/                         # Testes unitários e de componentes com Vitest
├── index.html
├── vite.config.ts
├── wrangler.jsonc
└── package.json
```

---

## Como Executar

### 1. Executando Localmente

#### Pré-requisitos
- **Node.js** (versão LTS recomendada) e **npm**.
- Backend [`telegram-monitor`](https://github.com/matrocheetos/telegram-monitor) rodando localmente (por padrão em `http://localhost:8080`).

#### Passo a passo

1. Clone o repositório e instale as dependências:
   ```bash
   git clone https://github.com/matrocheetos/telegram-monitor-frontend.git
   cd telegram-monitor-frontend
   npm install
   ```

2. Verifique o arquivo `.dev.vars` na raiz do projeto (usado pelo Cloudflare Vite Plugin / Wrangler em ambiente local):
   ```env
   BACKEND_ORIGIN=http://localhost:8080
   ```
   *(Se o seu backend Go estiver rodando em outra porta, atualize `BACKEND_ORIGIN` no `.dev.vars` e o alvo de proxy em `vite.config.ts`, se necessário.)*

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse a URL exibida no terminal (por padrão `http://localhost:5173`).

5. Scripts úteis de verificação e build:
   ```bash
   npm run typecheck   # Verificação de tipos TypeScript (tsc --noEmit)
   npm run lint        # Verificação com ESLint
   npm test            # Execução dos testes com Vitest
   npm run build       # Build de produção em dist/
   npm run preview     # Preview local do build com Wrangler/Vite
   ```

---

### 2. Executando em Produção (Cloudflare Workers)

#### Pré-requisitos
- Conta na **Cloudflare** (compatível com o **plano gratuito** de Cloudflare Workers).
- Backend [`telegram-monitor`](https://github.com/matrocheetos/telegram-monitor) publicado e acessível via HTTPS (ex.: atrás de proxy reverso TLS ou Cloudflare Tunnel).

#### Passo a passo

1. Edite o arquivo `wrangler.jsonc` para apontar para o seu backend e domínio:
   - Em `vars.BACKEND_ORIGIN`, informe a URL pública HTTPS da API Go:
     ```jsonc
     "vars": {
       "BACKEND_ORIGIN": "https://api.seu-dominio.com"
     }
     ```
   - Em `routes`, configure seu domínio customizado na Cloudflare (ou, se preferir publicar em `*.workers.dev`, remova `routes` e defina `"workers_dev": true`).

2. Autentique sua conta Cloudflare no CLI do Wrangler:
   ```bash
   npx wrangler login
   ```

3. Gere o build de produção e faça o deploy para o Cloudflare Workers:
   ```bash
   npm run build
   npx wrangler deploy
   ```

4. No servidor do backend Go (`telegram-monitor`), certifique-se de configurar no `.env`:
   - `APP_ENV=production`
   - `CORS_ALLOWED_ORIGINS=https://seu-dominio-frontend.com`

5. Acesse o domínio publicado no navegador para realizar o `/setup` inicial (caso seja a primeira execução) e conectar a conta do Telegram em `/admin/telegram`.
