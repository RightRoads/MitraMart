# HomeServe — Home Services & Products Platform (MVP)

A single responsive web app (installable PWA) where customers can **search and book home
services** (cleaning, plumbing, painting, haircut, appliance repair…), **order products**
delivered by your firm, and **compare financial products** (insurance, loans, credit cards)
from banks, NBFCs and insurers. Staff can also record **offline (in-store) sales**, so online
and offline share one inventory and one revenue view.

Scope: **India-only**, **own delivery & stock** (no third-party sellers), **no property management**.

## Highlights
- **Unified search** across services, products *and* financial products — as-you-type
  suggestions, typo tolerance (`pg_trgm`), category/provider matching, and filters/sort.
- **Financial products** — insurance, loans and credit cards from multiple providers, with
  subtype-aware filters, side-by-side comparison, eligibility pre-qualification and an EMI
  calculator.
- **Reorder from history** — "Order again" quick actions on Home and My Orders.
- **Two order types** — service bookings (time slot + professional) and product orders (cart +
  delivery), with distinct status lifecycles.
- **Offline sales** — staff record in-store product sales that decrement the *same* inventory.
- **Admin dashboard** — add/edit catalog, enable/disable items, manage stock, advance orders,
  combined online+offline revenue + low-stock alerts.

## Tech stack
- **Frontend:** React + Vite, React Router, PWA (`vite-plugin-pwa`).
- **Backend:** Node.js + Express, JWT auth (phone + password; OTP-ready).
- **Database:** PostgreSQL (full-text + trigram search).

## Architecture
```
  Customer / Staff / Admin  (React responsive web + PWA)
                 │  /api
        ┌────────┴─────────┐
        │  Express API     │
        └────────┬─────────┘
                 │
   ┌─────────────┼───────────────┐
 Catalog     Orders (online+       Inventory (shared)
 + search    offline)              + low-stock alerts
```
Payments (Razorpay), SMS/WhatsApp OTP, and Google Maps are integration points left as
clearly-marked next steps — the MVP uses password auth and cash/online payment flags.

### Financial products

A financial product **is** a `catalog_items` row with `type = 'financial'`, so unified search,
categories and favorites work on it unchanged. Provider and comparison attributes live in a
1:1 `financial_products` extension table keyed by `catalog_item_id`:

```
catalog_items (type='financial') ──1:1── financial_products ──N:1── providers
                                          subtype: insurance | loan | credit_card
                                          rates, fees, cover, eligibility, commission_pct
```

They deliberately do **not** reuse `orders`: there is no stock, no cart quantity and no
delivery, and revenue is commission on an approved application rather than an order total.
The application lifecycle (submit → underwrite → approve → issue/disburse) is the next phase.

> The seeded rates, fees and premiums in `server/src/seed-finance.js` are **illustrative demo
> data** modelled on publicly advertised ranges — not live rate cards. Replace them with the
> real figures from each provider agreement before showing this to customers. Distributing
> insurance in India requires IRDAI registration, and loans/credit cards are normally
> distributed under a DSA agreement with each bank.

## Run locally

Prerequisites: Node 18+ and Docker (for Postgres).

```bash
# 1) Start Postgres
docker compose up -d

# 2) Backend
cd server
cp .env.example .env
npm install
npm run setup      # migrate + seed demo catalog & users
npm run dev        # http://localhost:4000

# 3) Frontend (new terminal)
cd web
npm install
npm run dev        # http://localhost:5173  (proxies /api -> :4000)
```

### Demo logins (from the seed)
| Role | Phone | Password |
|------|-------|----------|
| Admin | `9000000001` | `admin123` |
| Staff | `9000000002` | `admin123` |
| Customer | `9000000003` | `test123` |

## Project layout
```
server/   Express API
  src/routes/   auth, catalog, orders, admin, me, finance
  src/schema.sql, migrate.js, seed.js, seed-finance.js
web/      React + Vite PWA
  src/pages/       Home, SearchResults, ItemDetail, Cart, MyOrders, Admin, Login, Register,
                   FinanceList, FinanceProduct, FinanceCompare
  src/components/  Header, SearchBar, ItemCard, AddressPicker, FinanceCard, EmiCalculator
  src/context/     Auth, Cart, Toast
  src/lib/         api, finance
docker-compose.yml   Postgres 16
```

## Roadmap (next phases)
0. **Financial applications** — apply wizard, KYC document upload, customer status timeline,
   admin application queue, and commission as a third revenue line.
1. Assignment apps for professionals & delivery agents.
2. Razorpay online payments.
3. SMS/WhatsApp OTP login + order notifications (MSG91/Twilio).
4. Google Maps address autocomplete + live delivery tracking.
5. Meilisearch for large-catalog instant search; reviews; reports.
