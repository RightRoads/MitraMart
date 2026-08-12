---
name: testing-homeserve
description: How to bring up and end-to-end test the HomeServe / MitraMart home-services + products marketplace (React+Vite web/, Express server/, Postgres via docker-compose), including demo logins, the exact UI paths for each golden flow, and known unwired features.
---

# Testing HomeServe / MitraMart

## Bring-up (README steps work verbatim; Node 18+, tested on v20)

```bash
docker compose up -d                      # Postgres 16 on host port 5433 (db home_services, app/app)
cd server && cp .env.example .env && npm install && npm run setup && npm run dev   # :4000
cd web && npm install && npm run dev      # :5173, proxies /api -> :4000
```

`npm run setup` = migrate + seed (drops and reseeds — re-run it to reset demo data to a
known state, e.g. All-Purpose Cleaner 1L = 120, Gas Stove Burner = 3).
If `docker compose` is unavailable, point `DATABASE_URL` at any Postgres that has the
`pg_trgm` extension available (search relies on `similarity()`).

## Demo logins (from the seed)

| Role | Phone | Password |
|------|-------|----------|
| Admin | 9000000001 | admin123 |
| Staff | 9000000002 | admin123 |
| Customer | 9000000003 | test123 |

Auth is phone + password only (no OTP). Admin/staff see an extra **Admin** button in the
header; `/admin` is role-gated in `web/src/App.jsx`.
Tip: test customer and admin simultaneously in a normal window + an incognito window
(JWT lives in localStorage, so two profiles avoid re-logging in), then `alt+Tab` between
them. Maximize each window with
`DISPLAY=:0 wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`.

## UI paths for each flow

- **Unified search**: header search box. Suggestions are debounced 180 ms. Good demo terms:
  `cleaning` (returns both services and products), `fridge`, `tap`. Typo tolerance:
  `cleening`, `plubming` work in *search*; the `/catalog/suggest` endpoint is stricter
  (name-only similarity) so misspellings may yield no dropdown suggestions — that is
  expected, not a bug.
- **Service booking** (`/item/:slug` for a service): needs BOTH a `datetime-local` slot and
  an address, else you get a toast and no order. Creates status `requested`.
- **datetime-local gotcha**: typing a full date string into the input mangles the year.
  Click the month segment, then type segments separately (`06`, `15`, `2026`, Tab, `10`,
  `00`, `AM`) and verify the value before submitting.
- **Product order**: item page or card "Add" → header 🛒 Cart → pick address + payment →
  "Place order". Creates status `placed` and decrements `inventory` immediately.
- **My Orders** (`/orders`): both order types plus "Order again" chips (from
  `GET /orders/reorder`) — chips only appear after the user has at least one order.
- **Admin** (`/admin`): Stats row (total / per-channel revenue / low stock where
  `stock_qty <= low_stock_at`, default 5) + tabs Catalog / Orders / Offline sale.
  - Catalog: add form is admin-only; stock is edited inline and saves **on blur**;
    Disable/Enable toggles `active` (inactive items disappear from customer search).
  - Orders: status buttons follow `NEXT_STATUS` in `web/src/pages/Admin.jsx`.
  - Offline sale: staff/admin record in-store sales; they decrement the SAME `inventory`
    rows as online orders. Strongest assertion for the headline feature: note the stock
    number in the admin panel, record a sale of N units, then confirm the **customer**
    item page shows the same reduced number, and that the offline amount shows up in the
    combined revenue stat.

## PWA testing

No service worker in `npm run dev` (`VitePWA` has no `devOptions.enabled`). Use
`npm run build && npm run preview` (:4173) — `vite preview` also proxies `/api`, so the
production build is fully usable for a demo. Assert `GET /sw.js` and
`/manifest.webmanifest` return 200 and that Chrome's omnibox install icon opens an
"Install app — HomeServe" dialog.

## Known unwired / absent (do not report as regressions)

- **Favorites**: `GET/PUT/DELETE /me/favorites` and the `favorites` table exist, but no
  frontend code references them — no heart control, no favorites page.
- **Catalog edit**: `PATCH /admin/items/:id` (name/price/description) has no frontend
  caller; the UI can only change stock and active state.
- Payments (Razorpay), SMS/WhatsApp OTP, Google Maps autocomplete/tracking,
  professional & delivery-agent apps, reviews (table only, no routes).

## Devin Secrets Needed

None — everything runs locally with seeded credentials.
