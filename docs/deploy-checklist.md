# Credence D7 Deployment Checklist

This checklist covers the first Vercel/Cloudflare deployment for Credence.

## 0. Deployment policy

- Deploy preview first. Do not bind production domain until preview smoke test passes.
- Keep live CLOB trading disabled for the first public deployment.
- Do not store private keys, wallet seed phrases, or user CLOB API secrets on the server.
- Do not enable geo-blocking in local development.

## 1. Local preflight

Run from project root:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
```

Expected:

- TypeScript exits 0.
- Next production build exits 0.
- The existing `pino-pretty` optional dependency warning is non-blocking.

## 2. Vercel project setup

Recommended settings:

| Setting | Value |
|---|---|
| Framework preset | Next.js |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` |
| Output directory | `.next` |
| Node.js version | 22.x |
| Package manager | pnpm 9.15.0 |
| Root directory | `credence` if deploying from workspace root; empty if repo root is `credence` |

## 3. Production environment variables

Set these in Vercel Production and Preview.

```env
NEXT_PUBLIC_POLYMARKET_GAMMA_URL="https://gamma-api.polymarket.com"
NEXT_PUBLIC_POLYMARKET_CLOB_URL="https://clob.polymarket.com"
NEXT_PUBLIC_POLYGON_RPC_URL="<Alchemy or other stable Polygon RPC>"
NEXT_PUBLIC_APP_URL="https://credence.gg"
NEXT_PUBLIC_APP_NAME="Credence"
NEXT_PUBLIC_ENABLE_REAL_TRADING="false"
GEO_BLOCK_COUNTRIES="US,GB,SG,JP,KR,FR"
```

Optional later:

```env
NEXT_PUBLIC_PLAUSIBLE_DOMAIN="credence.gg"
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
TELEGRAM_BOT_TOKEN=""
TELEGRAM_BOT_WEBHOOK_SECRET=""
```

Notes:

- `NEXT_PUBLIC_ENABLE_REAL_TRADING` should remain `false` until a low-balance live-wallet test plan is approved.
- `GEO_BLOCK_COUNTRIES` is only effective when the request includes Cloudflare `CF-IPCountry`.
- Keep `.env.local` out of git.

## 4. Cloudflare / DNS setup

For `credence.gg`:

1. Add the domain to Cloudflare.
2. Point DNS to Vercel using Vercel's domain instructions.
3. Keep Cloudflare proxy enabled only after Vercel domain verification succeeds.
4. Confirm requests to Vercel include `CF-IPCountry`.
5. Configure `GEO_BLOCK_COUNTRIES` in Vercel production.

Recommended high-risk block list for first production pass:

```env
GEO_BLOCK_COUNTRIES="US,GB,SG,JP,KR,FR"
```

This list is a product/legal risk control, not final legal advice. Revisit after counsel review.

## 5. Preview smoke test

Run against Vercel preview URL before production domain binding.

### Routing and localization

- `/` redirects to `/zh`.
- `/zh` loads.
- `/en` loads.
- Language switch works.

### Home market list

- Market cards load from Gamma.
- Prices render as probabilities.
- Volume/liquidity render as USD.
- Clicking a market opens `/zh/market/<id>`.

### Market detail

- Market title, description, metadata load.
- Order book renders or shows a readable empty/error state.
- Risk acknowledgement modal appears on first visit.
- Before acknowledgement, order action is gated.
- After acknowledgement, order action is available.

### Wallet connection

Test in Chrome or Brave with MetaMask/Rabby/OKX Wallet installed.

- Connect Wallet opens wallet prompt.
- No-wallet browser shows install-wallet message.
- Duplicate connect attempts do not surface raw `wallet_requestPermissions already pending` errors.
- Reset page connection state clears local app/wagmi connection state.
- Switching from Ethereum to Polygon works.

### Dry-run order path

With `NEXT_PUBLIC_ENABLE_REAL_TRADING=false`:

- Connected wallet + Polygon shows `Validate order path`.
- Dry-run validation does not submit a live CLOB order.
- Error states are readable.

### Portfolio

- `/zh/portfolio` prompts for wallet when disconnected.
- Connected wallet shows address and summary cards.
- Current positions load or show a readable empty/error state.
- Open orders `Load` either shows orders or the loaded-empty success state.
- No `[object Object]` errors appear.

### Blocked page

- `/zh/blocked` renders.
- `/en/blocked` renders.

## 6. Production smoke test

After binding `credence.gg`, repeat all preview checks using:

- `https://credence.gg/zh`
- `https://credence.gg/en`
- `https://credence.gg/zh/portfolio`

Additional production checks:

- Browser console has no fatal hydration/runtime errors.
- Vercel function logs show no repeated 500s.
- Cloudflare analytics show requests routed through Cloudflare.
- Blocked-country traffic redirects to `/blocked` when `CF-IPCountry` matches `GEO_BLOCK_COUNTRIES`.

## 7. Rollback plan

If production breaks:

1. In Vercel, promote the previous working deployment.
2. If domain routing is broken, temporarily disable Cloudflare proxy and retest DNS.
3. If geo-blocking misfires, set `GEO_BLOCK_COUNTRIES=""` and redeploy/restart.
4. If wallet/order flow breaks, keep `NEXT_PUBLIC_ENABLE_REAL_TRADING="false"`.
5. Open a follow-up fix branch/commit after rollback is stable.

## 8. Do not proceed to live trading until

- Preview and production smoke tests pass.
- A dedicated low-balance wallet live-order test is approved.
- Legal risk list is reviewed.
- `GEO_BLOCK_COUNTRIES` is confirmed in production.
- Order submit telemetry/error logging exists.

## 9. Supabase setup (optional but recommended before native predictions go multi-user)

### 9.1 Create project

1. Create a Supabase project at `https://supabase.com`.
2. Note the Project URL, anon key, and service role key.

### 9.2 Apply schema migration

Run the SQL migration in the Supabance SQL Editor:

```sql
-- File: supabase/migrations/0001_credence_native_schema.sql
```

This creates tables: `credence_users`, `native_markets`, `native_signal_predictions`, `scalar_distribution_predictions`, `world_models`, `evidence_nodes`, `model_updates`, `belief_portfolio_items`.

### 9.3 Seed native SKU content

From the project root:

```bash
SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> \
  node --import tsx scripts/seed-native-skus.ts
```

This upserts all markets, world models, and evidence from `src/content/native-skus/*.json` into Supabase. It is idempotent — re-run after editing JSON content.

### 9.4 Configure RLS

For the MVP, set RLS policies on `native_signal_predictions` and `scalar_distribution_predictions` so that:

- Users can read all predictions (public leaderboard / aggregate distributions).
- Users can only insert/update/delete their own predictions (filtered by `wallet_address` or `auth.uid()`).

Example policy for inserts:

```sql
create policy "Users can insert own predictions"
  on public.native_signal_predictions for insert
  with check (wallet_address = current_setting('app.wallet_address', true));
```

### 9.5 Set env vars

In Vercel (or `.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL="<project-url>"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are both set and non-empty, the app automatically uses `SupabasePredictionRepository`. When absent, it falls back to `LocalStoragePredictionRepository`.

### 9.6 Smoke test

- Without Supabase env: submit a prediction, verify it persists in localStorage.
- With Supabase env: submit a prediction, verify it appears in the Supabase table.
- `/zh/beliefs` should show predictions regardless of which repository is active.

## 10. D8 readiness

After D7 passes, next development track can continue with:

- Telegram Bot skeleton.
- Supabase event tracking.
- Better production telemetry.
- WalletConnect QR behind no-SSR boundary if needed.
