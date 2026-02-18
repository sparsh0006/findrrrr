# BNB Chain Explorer Frontend

A custom BNB Smart Chain blockchain explorer built with Next.js 14, TypeScript, Tailwind CSS, and Recharts.

## 📁 Folder Structure

```
bnb-explorer-frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (sidebar + header)
│   │   ├── page.tsx                  # Dashboard page
│   │   ├── globals.css               # Global styles + Tailwind
│   │   ├── transactions/
│   │   │   └── page.tsx              # Transactions page (tabs, filters, pagination)
│   │   ├── tx/
│   │   │   └── [hash]/
│   │   │       └── page.tsx          # Transaction detail page
│   │   └── address/
│   │       └── [address]/
│   │           └── page.tsx          # Address detail page
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   │   └── Header.tsx            # Top header with search + live block
│   │   ├── DashboardClient.tsx       # Dashboard charts, stats, recent txs
│   │   ├── TransactionsClient.tsx    # Multi-view tabs, token filters, table
│   │   ├── TxDetailClient.tsx        # Tx detail: overview, gas, token transfers, raw JSON
│   │   └── AddressClient.tsx         # Address: stats, activity chart, balances, txs
│   ├── lib/
│   │   ├── api.ts                    # Data fetching layer (mock + real API)
│   │   ├── utils.ts                  # Formatters: BNB, hash, date, clipboard
│   │   ├── types.ts                  # TypeScript interfaces
│   │   └── constants.ts              # Token configs, DeFi contracts, API URL
│   └── hooks/
│       ├── usePolling.ts             # Auto-refresh hook (5s interval)
│       └── useDebouncedSearch.ts     # Debounced input value hook
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
└── README.md
```

## 🚀 Quick Start (Test with Mock Data)

The app ships with **demo mode enabled** so you can test it immediately without a backend.

```bash
# 1. Navigate to project
cd bnb-explorer-frontend

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Open in browser
open http://localhost:3000
```

That's it! You'll see the full explorer with realistic mock data.

## 🔌 Connect to Your Backend

When your BNB indexer backend is running at `http://localhost:3001`:

1. Open `src/lib/api.ts`
2. Change line 7:
   ```typescript
   const USE_DEMO_MODE = false;  // ← change from true to false
   ```
3. (Optional) Set your API URL via env:
   ```bash
   # .env.local
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```
4. Restart the dev server

### Expected Backend API Endpoints

The frontend expects these REST endpoints from your backend:

| Endpoint                         | Method | Description                    |
|----------------------------------|--------|--------------------------------|
| `GET /stats`                     | GET    | Dashboard stats                |
| `GET /chart/blocks`              | GET    | Block chart data               |
| `GET /transactions`              | GET    | Paginated transactions         |
| `GET /token-transfers`           | GET    | Paginated token transfers      |
| `GET /large-transfers`           | GET    | Paginated large transfers      |
| `GET /failed-transactions`       | GET    | Paginated failed transactions  |
| `GET /tx/:hash`                  | GET    | Single transaction detail      |
| `GET /address/:address`          | GET    | Address info + transactions    |

**Query params** supported by `/transactions`:
- `page`, `limit` — pagination
- `search` — filter by hash/address/block
- `tokens` — comma-separated token symbols (e.g., `BNB,USDT`)
- `min_BNB`, `max_BNB`, `min_USDT`, etc. — threshold filters
- `defi` — boolean, filter DeFi transactions only

## 🧪 What to Test

### Dashboard (`/`)
- [ ] 6 stat cards show mock numbers
- [ ] Area chart renders tx/block data
- [ ] Pie chart shows success vs failed split
- [ ] Recent transactions table shows 12 rows
- [ ] Numbers auto-update every 5 seconds
- [ ] "View All →" navigates to `/transactions`

### Transactions (`/transactions`)
- [ ] 5 tabs work: All, Large, Failed, Tokens, DeFi
- [ ] Each tab shows appropriate columns
- [ ] Search bar filters results (debounced)
- [ ] Token filter panel toggles on/off
- [ ] Toggle switches enable per-token filters
- [ ] Min/Max inputs appear when token is enabled
- [ ] Apply/Reset buttons work
- [ ] Pagination prev/next works
- [ ] Clicking a tx hash navigates to `/tx/[hash]`
- [ ] Clicking an address navigates to `/address/[addr]`

### Transaction Detail (`/tx/[hash]`)
- [ ] Overview section shows status, block, from, to, value
- [ ] Gas section shows gas used, price, nonce
- [ ] Token transfers table appears (if present)
- [ ] Raw JSON section expands/collapses
- [ ] Copy button copies hash to clipboard
- [ ] BscScan link opens in new tab
- [ ] Back button returns to transactions

### Address (`/address/[address]`)
- [ ] 3 stat cards: total txns, sent, received
- [ ] Activity bar chart renders
- [ ] Token balances list shows
- [ ] Recent transactions table shows
- [ ] Copy and BscScan links work

### Global Search (Header)
- [ ] Enter a 66-char hex → navigates to `/tx/...`
- [ ] Enter a 42-char hex → navigates to `/address/...`
- [ ] Enter a number → navigates to `/transactions`

## 🏗 Build for Production

```bash
npm run build
npm start
```

## 📝 Notes

- **Server Components**: Layout, page wrappers are Server Components
- **Client Components**: Charts, filters, interactive tables are Client Components
- **Caching strategy**:
  - Dashboard stats: `revalidate: 5` (refresh every 5s)
  - Transaction detail: `revalidate: 30`
  - Transaction lists: `cache: 'no-store'` (always fresh)
- All value conversions handle BigInt wei strings safely
