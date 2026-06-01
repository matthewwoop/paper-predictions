# Paper Predictions

A paper trading web app built against the [Kalshi](https://kalshi.com) public predictions API.
Browse live prediction markets, place simulated orders, and track your positions.

**Live demo:** https://paper-predictions.vercel.app/

---

## How to Run Locally

### Prerequisites
- Node.js 18+
- Accounts on [Clerk](https://clerk.com), [Supabase](https://supabase.com), and [Vercel](https://vercel.com)

### Setup

```bash
git clone https://github.com/matthewwoop/paper-predictions
cd paper-predictions
npm install
```

Create `.env.local` at the project root:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
```

Note: use the **direct connection** string locally (port 5432). Vercel requires the
**transaction pooler** string (port 6543) — configure that separately in the Vercel dashboard.

Apply the schema to Supabase:

```bash
npm run db:push
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Major Design Decisions & Tradeoffs

### Stack
| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router) | Full-stack monorepo, single deploy target, shared types |
| Styling | Tailwind CSS + shadcn/ui | Fastest path to a polished UI; shadcn components are owned, not imported |
| Auth | Clerk | Pre-built React components eliminate auth form development entirely |
| Database | Supabase (Postgres) | Hosted Postgres with zero local setup; clean dashboard for debugging |
| ORM | Drizzle | Schema defined in TypeScript, no generation step, feels close to SQL |
| Deployment | Vercel | Native Next.js integration, zero-config deploy, preview URLs on every push |

### App Framework

#### Options
- **Fullstack monorepo** — frontend and backend API routes live in the same codebase, deploy together, and share TypeScript types
- **Separate frontend and backend** — more flexibility but doubles deploy surface and introduces CORS complexity

**Choice:** Next.js (App Router)

#### Why this approach
A fullstack monorepo eliminates the overhead of managing two deploy targets and wiring them together. For a time-constrained build, shared types and a single deploy pipeline are meaningful advantages.

### Auth

#### Options
- **Auth-as-a-service** — hosted UI, session management, and user storage out of the box; no custom auth flows
- **Self-managed auth** — everything lives in your codebase but requires wiring up JWT handling, session storage, password hashing, and protected route middleware manually

**Choice:** Auth-as-a-service / Clerk

#### Why this approach
Self-managed auth is a significant time risk in a 90-minute build. JWT handling, session storage, password hashing, and protected route middleware are each small problems that together can consume 20-30 minutes, which is time better spent on the actual product.

#### Why this tool
Clerk's differentiator is its pre-built React components. `<SignIn />` and `<SignUp />` are drop-in components that render a complete, polished auth UI — you're placing a component, not building a form. Auth0 has a similar model but heavier setup and more complex pricing. Supabase Auth is a reasonable alternative but its UI components are less seamless in a Next.js context.

### Database

#### Options
- **Managed database hosting** — a connection string you paste into an environment variable and move on. No local setup, no infrastructure management
- **Self-hosted database** — full control but requires environment setup, connection configuration, and backup management; a non-starter in a 90-minute window

**Choice:** Hosted Postgres / Supabase

#### Why
The data model is fundamentally relational. Users have orders, orders produce fills, positions are derived from aggregating fills, and balances are affected by fills.

Within managed Postgres providers (Supabase, Neon, Railway), the technical differences are marginal. Supabase wins on pragmatic grounds since I have the most experience with it, and it's widely adopted.

### Live Prices — Page-Level Polling
Prices update via a single `setInterval` on the markets list parent component polling `/api/markets` every 3 seconds. All market cards receive updated prices as props from the parent. This avoids breaching Kalshi's 10 requests/second rate limit and keeps the polling architecture simple and stateless, which fits naturally into Vercel's serverless function model.

WebSockets or SSE would provide lower latency but require persistent connections incompatible with serverless functions without introducing a second service.

### Data Source — Kalshi Pivot from Onyx Predictions API
The take-home specified the Onyx Predictions API as the primary data source, with Kalshi as a fallback if Onyx was not returning data. When testing the endpoints on the SwaggerUI, most open markets on the Onyx API returned null prices across every price field. Integrating live price updates was crticial to the core functionality, so I pivoted to Kalshi as the data source.

### UX — Markets-First Homepage
The homepage is a public live markets list rather than a forced login screen. Users can browse markets and prices immediately without creating an account. Order placement requires auth — clicking Buy YES/NO triggers a Clerk sign-in modal that returns the user to the markets list after authentication. This mirrors how real prediction market platforms handle the unauthenticated experience and creates a more compelling first impression for evaluators opening the live URL cold.

### No Markets Table — Kalshi as Source of Truth
Market data is never cached in the database. Kalshi is always the live source of truth for prices, market metadata, and status. The only market reference stored locally is `market_ticker` and `market_title` denormalized onto each order record. This preserves a human-readable order history even after a market expires and disappears from the API.

### No Positions Table — Derived at Query Time
User positions are not stored as a separate table. They are derived by aggregating the orders table at query time: `avg_fill_price = SUM(fill_price * quantity) / SUM(quantity)`, `unrealized_pnl = (current_price - avg_fill_price) * total_quantity`. A separate positions table would require keeping it in sync with the orders table on every fill, which was a level of complexity that isn't justified for this data model.

### Supabase Connection — Dual URLs
Supabase requires different connection strings for local development vs Vercel. The direct connection (port 5432) is used locally and for `drizzle-kit push`. The transaction pooler (port 6543) is required for Vercel's serverless environment where the direct connection hostname does not resolve (`ENOTFOUND`). The pooler also requires `prepare: false` in the postgres client config as it does not support prepared statements.

---

## What I Would Do Next / Future Improvements

### Immediate Improvements
- **Styling/UI** - Redesign market cards, one per row with richer detail, Add color scheme, Refactor nav, Create richer profile page, Add table design to orders
- **Order Notifications** - Add some reactive UI feature to order placement
- **Close positions** — Sell YES/NO to close an existing position, realized P&L tracking

### Next Phase Improvements
- **Pagination** - Dynamically load more markets on-scroll
- **Market search** — Full-text search across market titles via Kalshi's API params
- **Market categories** - Enable filtering rather than a firehose of all Kalshi markets, enable sorting on volume, time to expiry
- **WebSocket price updates** — Replace polling with Kalshi's WebSocket feed for true real-time prices, which would require moving off Vercel's serverless model to a platform supporting persistent connections (Railway or Fly.io)