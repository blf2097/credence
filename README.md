# Credence

> Bet on the truth, not the odds.

Localized [Polymarket](https://polymarket.com) frontend for Southeast Asia crypto users. Polymarket-native liquidity, zero markup. ZH/EN UI, fiat ramp, AI insights, Telegram Bot ordering.

**Domain**: `credence.gg`
**Stack**: Next.js 14 · TypeScript · App Router · wagmi · viem · next-intl · Tailwind · Polygon mainnet · Polymarket Gamma + CLOB

---

## Quick start

Requires Node >= 20 and pnpm >= 9.

```bash
pnpm install
cp .env.example .env.local   # then fill in values (Alchemy recommended)
pnpm dev
```

Open `http://localhost:3000` — you'll be redirected to `/zh`.

### Required env vars (minimum to run)

| Var | Where to get it | Free? |
|---|---|---|
| `NEXT_PUBLIC_POLYGON_RPC_URL` | https://www.alchemy.com/ → create app on Polygon mainnet | ✅ Free tier |

Other vars in `.env.example` can stay empty for normal dev. WalletConnect QR is intentionally disabled; injected wallets (MetaMask/Rabby/OKX) are supported first. Real CLOB submission is behind `NEXT_PUBLIC_ENABLE_REAL_TRADING=true` and capped at 1 pUSD per D4 order.

---

## Project structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx            # locale-scoped layout w/ providers
│   │   ├── page.tsx              # home (market list)
│   │   ├── market/[id]/page.tsx  # market detail + order form
│   │   ├── portfolio/page.tsx    # user positions
│   │   └── legal/{terms,risk}/   # placeholder legal pages (replaced D10)
│   ├── globals.css
│   └── providers.tsx             # WagmiProvider + ReactQuery
├── components/
│   ├── header.tsx
│   ├── footer.tsx
│   ├── category-tabs.tsx
│   ├── market-list.tsx           # server component, fetches Gamma
│   ├── market-card.tsx
│   ├── order-form.tsx            # client, validates + submits guarded CLOB orders
│   └── order-book-view.tsx       # server component, polls CLOB
├── lib/
│   ├── polymarket/
│   │   ├── gamma.ts              # read API (markets, events)
│   │   ├── clob.ts               # server-safe order book reads
│   │   ├── browser-clob.ts       # browser wallet CLOB signing/submission
│   │   ├── contracts.ts          # Polygon contract addresses
│   │   ├── order.ts              # order preview/request types
│   │   └── types.ts              # narrow types
│   ├── wagmi-config.ts           # Polygon mainnet + injected wallets
│   └── utils.ts                  # cn, formatUSD, formatProb
├── messages/
│   ├── zh.json                   # Chinese (primary)
│   └── en.json                   # English
├── i18n.ts                       # next-intl config
└── middleware.ts                 # geo-block + locale routing
```

---

## Two-week sprint plan

| Day | Owner | Deliverable |
|---|---|---|
| **D1** | AI | This scaffold ✅ |
| **D2** | AI | Real Gamma API wiring, market list renders live data ✅ |
| **D3** | AI | Injected wallet + Polygon switch + pUSD balance/allowance + guarded order preview ✅ |
| **D4** | AI | Browser-wallet EIP-712 signing + CLOB submission behind live-trading kill switch ✅ |
| D5 | AI | Portfolio page (positions API) |
| D6 | AI | Cloudflare geo-block (US/UK/SG/KR/JP), IPQS VPN check |
| D7 | 龙飞 + AI | Vercel deploy to `credence.gg`, smoke test on testnet wallet |
| D8 | AI | Telegram Bot skeleton (notify on resolution) |
| D9 | AI | Supabase event tracking |
| D10 | 龙飞 | Engage law firm (Tilleke/SyCip), Termly subscribe, replace placeholder legal |
| D11 | AI | Vietnamese + Indonesian translations |
| D12 | AI | Referral codes + KOL link kit |
| D13 | AI | Landing page polish, OG cards, analytics |
| D14 | 龙飞 + AI | Invite 50 internal users, collect feedback |

---

## Architecture notes

**Why server components for reads?** Gamma + CLOB book are public, cacheable, and don't need wallet context. Pulling them server-side means:

1. No rate-limit exposure (we hit the API once, all users share the cache)
2. Faster TTFB
3. SEO works (markets are crawlable)

**Why client component for the order form?** Wallet signing requires browser context (wagmi hooks).

**Compliance posture (placeholder, finalized D10):**

- Geo-block US/UK/SG/KR/JP via Cloudflare worker (header-based redirect to a "service unavailable" page)
- Mandatory ToS + Risk acknowledgment modal on first visit (D6)
- BVI/Seychelles entity holds the domain and Vercel account (龙飞 to register D10)
- Legal pages drafted by Tilleke & Gibbins (Vietnam) / SyCip (Philippines) — D10
- No KYC for MVP (Polymarket itself doesn't KYC; we're a frontend)

**What we are NOT:**

- We do **not** custody funds (smart wallet only, user signs every tx)
- We do **not** quote our own odds (we mirror Polymarket book)
- We do **not** add markup (no service fee in v1; consider 0.5% in v2 only after PMF)

---

## Polymarket integration cheatsheet

| What | Endpoint | Auth |
|---|---|---|
| List markets | `GET https://gamma-api.polymarket.com/markets` | None |
| Get market detail | `GET /markets/{id}` | None |
| Get order book | `GET https://clob.polymarket.com/book?token_id=X` | None |
| Place order | `POST https://clob.polymarket.com/order` | EIP-712 sig + L2 API key |
| Get positions | `GET /positions?user=0x...` | L2 API key |

L2 keys are derived once per address via `ClobClient.createOrDeriveApiKey(signer)` and cached in the user's browser localStorage for D4. The server never stores user API secrets in the MVP.

### Polygon trading contracts

| Contract | Address | Purpose |
|---|---|---|
| pUSD collateral | `0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB` | Trading collateral token |
| CTF Exchange | `0xE111180000d2663C0091e4f400237545B87B996B` | Standard market order settlement spender |
| Neg Risk CTF Exchange | `0xe2222d279d744050d28e00520010520000310F59` | Negative-risk market order settlement spender |
| Conditional Tokens | `0x4D97DCd97eC945f40cF65F87097ACe5EA0476045` | Outcome ERC-1155 positions |

D4 implements browser-wallet signed BUY limit orders through `@polymarket/clob-client`, but live submission is disabled by default. To enable real orders, set:

```env
NEXT_PUBLIC_ENABLE_REAL_TRADING="true"
```

Safety guardrails:

- D4 supports BUY limit orders only.
- D4 caps live orders at 1 pUSD.
- The user must explicitly confirm in the browser before submission.
- We never accept raw private keys through the browser/API.

---

## License

Private, all rights reserved. © 2026 Credence.
