# Traford Farm Fresh — Customer Website

Public-facing marketplace for **Traford Farm Fresh**, built with **Next.js 15** + **TypeScript** + **Tailwind CSS** + **Supabase SSR**.

Part of the 3-app Traford ecosystem:

| App | Stack | Repo |
|---|---|---|
| 📱 Mobile app | Flutter / Dart | [`DrakeNamanya/trafordapp`](https://github.com/DrakeNamanya/trafordapp) |
| 🌐 **Customer website (this repo)** | Next.js / TypeScript | `DrakeNamanya/trafordsite` |
| 🛠️ Admin portal | Hono / Cloudflare Pages | `DrakeNamanya/trafordfresh` |

All three share **one Supabase backend** — the schema lives in `trafordapp/supabase/migrations/`.

---

## Tech stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **TypeScript** strict mode
- **Tailwind CSS** with Traford brand tokens
- **@supabase/ssr** for cookie-based auth across server + client
- **lucide-react** for icons

## Features

- 🏠 **Home** — Hero, features bar, category tiles, featured products, promo
- 🛒 **Shop** — Search, category chips, sort, responsive product grid (RLS hides `field_staff_only` items from public)
- 📦 **Product detail** — Gallery, ratings, stock status, related products
- 🛍️ **Cart** — Server-rendered cart from `cart_items` table, quantity controls, remove
- 💳 **Checkout** — Calls the atomic `create_order()` RPC with payment method (MTN MoMo / Airtel / FlexiPay / COD)
- 👤 **Account** — Profile, order history, order detail, addresses
- 🔐 **Auth** — Email/password sign in & signup, email confirmation callback, middleware-protected routes
- 🎨 **Brand-consistent** — Same Traford orange (#F15A24) + green (#22B14C) palette as the Flutter app

## Project structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout, header + footer
│   ├── page.tsx                # Home
│   ├── globals.css             # Tailwind + brand tokens
│   ├── shop/page.tsx           # Product listing + filter/search/sort
│   ├── product/[slug]/         # Product detail + AddToCartButton
│   ├── cart/                   # Cart with CartItemRow
│   ├── checkout/               # Checkout form → create_order() RPC
│   ├── login/ + signup/        # Email auth forms
│   ├── auth/callback/route.ts  # Supabase email confirmation handler
│   ├── account/                # Profile, orders, addresses
│   ├── about/, contact/        # Marketing pages
│   └── ...
├── components/
│   ├── Header.tsx              # Server-rendered, shows auth state
│   ├── Footer.tsx
│   ├── ProductCard.tsx         # Matches Flutter ProductCard
│   └── CategoryTile.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # RSC / Route Handler client
│   │   ├── middleware.ts       # Refreshes session cookies
│   │   └── types.ts            # Shared DB types
│   └── format.ts
└── middleware.ts               # Gates /account, /checkout
```

## Setup

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase URL + anon key

# 3. Apply the database migration (one-time, in trafordapp repo)
# Run trafordapp/supabase/migrations/20260101000000_traford_initial_schema.sql
# in your Supabase SQL Editor.

# 4. Run dev server
npm run dev
# → http://localhost:3000
```

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `NEXT_PUBLIC_SITE_URL` | Site origin (used by email-confirmation redirects) |

> Never commit `.env.local`. Only `.env.example` is tracked.

## Architecture notes

### Authentication
Cookie-based via `@supabase/ssr`. The middleware (`src/middleware.ts`) refreshes
the session on every request and gates `/account` and `/checkout` for
unauthenticated users. Server Components read the user via `createClient()` from
`lib/supabase/server.ts`.

### Row-Level Security (RLS)
The Supabase migration enables RLS on every table. The website only ever uses
the **anon key** — users see only their own cart, orders, addresses, and
notifications. Public users are blocked from `audience='field_staff_only'`
products by RLS, so the agro-input items are invisible from the website by
design.

### Atomic order creation
Checkout calls the **`create_order()`** Postgres RPC, which inside one
transaction:

1. Validates stock + audience for every item
2. Decrements stock + writes inventory movements
3. Inserts the `orders` row + `order_items`
4. Creates a pending `payments` row + `deliveries` row
5. Sends a notification

This guarantees consistency even when the same user has the mobile app,
website, and admin portal open simultaneously.

### Realtime sync (planned, Step 6)
Once Step 6 lands, the client will subscribe to changes on `orders`,
`payments`, and `deliveries` so order status updates pushed by the admin portal
appear instantly here too.

## Deployment

Designed for **Vercel** (or any Node host). Build command: `next build`,
output: `.next`. Set the same env vars in your hosting dashboard.

## License

Proprietary — © Traford Farm Fresh.
