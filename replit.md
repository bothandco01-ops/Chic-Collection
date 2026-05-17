# BOTH & CO.

A luxury Nigerian womenswear accessories ecommerce site for heels and glasses. Dark pink/black editorial aesthetic, fully mobile-responsive.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/both-and-co run dev` — run the frontend (port 24865)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter routing, TanStack Query, Tailwind v4, shadcn/ui
- Auth: Clerk (whitelabel, dark rose theme)
- API: Express 5 with OpenAPI-first contract
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/db/src/schema/` — Drizzle ORM schema files
- `artifacts/both-and-co/src/pages/` — all frontend pages
- `artifacts/both-and-co/src/components/layout.tsx` — navbar + footer
- `artifacts/both-and-co/src/index.css` — design tokens and theme
- `artifacts/api-server/src/routes/` — all API route handlers

## Architecture decisions

- Contract-first API: OpenAPI spec is the source of truth; never edit generated files.
- Session-based cart: `localStorage` key `cartSessionId` passed as `x-session-id` header. No login required to add to cart.
- Payment: Nigerian bank transfer only. Bank = First Bank Nigeria, Account = BOTH & CO. LIMITED / 3012345678. Customer uploads screenshot proof (base64), admin confirms manually.
- Admin access: `user?.publicMetadata?.role === 'admin'` via Clerk's `useUser()`.
- Price display: Nigerian Naira — `₦{price.toLocaleString()}`.

## Product

- **Homepage** — Hero, featured products, brand story
- **Shop** (`/shop`) — All products with category filter (heels/glasses)
- **Product Detail** (`/shop/:id`) — Add to cart with size selection
- **Cart** (`/cart`) — View/edit cart, proceed to checkout
- **Checkout** (`/checkout`) — Shipping details form → bank transfer payment with proof upload
- **Orders** (`/orders`) — Signed-in user order history
- **Order Detail** (`/orders/:id`) — Full order view with payment status
- **About** (`/about`) — Brand story and values
- **Services** (`/services`) — Service offerings (personal styling, repairs, VIP, etc.)
- **FAQ** (`/faq`) — Accordion FAQ from database
- **Contact** (`/contact`) — Contact form + contact details
- **Account** (`/account`) — User profile + recent orders
- **Admin Dashboard** (`/admin`) — Stats overview + recent orders table
- **Admin Orders** (`/admin/orders`) — Full order management with status updates + payment proof viewer
- **Admin Products** (`/admin/products`) — Create/edit/delete products

## User preferences

- Dark luxury aesthetic: deep charcoal background, rose-pink primary, Playfair Display serif + Inter sans
- Nigerian market: prices in Naira (₦), Nigerian bank transfer payment
- Sharp edges (border-radius: 0)
- No emojis in code or UI

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Always run `pnpm --filter @workspace/db run push` after changing schema files
- Cart session ID must be passed as `x-session-id` header for cart/order API calls — see `lib/db/src/schema/cart.ts` and the `customFetch` in `lib/api-client-react`
- Do not use `pnpm dev` at workspace root — always use workflow restart or `--filter`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
