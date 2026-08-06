# HomeServe — Home Services & Products Platform (MVP)

A single responsive web app (installable PWA) where customers can **search and book home
services** (cleaning, plumbing, painting, haircut, appliance repair…) and **order products**
delivered by your firm. Staff can also record **offline (in-store) sales**, so online and
offline share one inventory and one revenue view.

Scope: **India-only**, **own delivery & stock** (no third-party sellers), **no property management**.

## Highlights
- **Unified search** across services + products — as-you-type suggestions, typo tolerance
  (`pg_trgm`), category matching, and filters/sort.
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
  src/routes/   auth, catalog, orders, admin, me
  src/schema.sql, migrate.js, seed.js
web/      React + Vite PWA
  src/pages/       Home, SearchResults, ItemDetail, Cart, MyOrders, Admin, Login, Register
  src/components/  Header, SearchBar, ItemCard, AddressPicker
  src/context/     Auth, Cart, Toast
docker-compose.yml   Postgres 16
```

## Roadmap (next phases)
1. Assignment apps for professionals & delivery agents.
2. Razorpay online payments.
3. SMS/WhatsApp OTP login + order notifications (MSG91/Twilio).
4. Google Maps address autocomplete + live delivery tracking.
5. Meilisearch for large-catalog instant search; reviews; reports.
