-- Home services & products platform — MVP schema
-- Safe to run repeatedly (drops and recreates for the dev/seed workflow).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS catalog_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role          TEXT NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer','professional','delivery','staff','admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  slug  TEXT UNIQUE NOT NULL,
  kind  TEXT NOT NULL DEFAULT 'both' CHECK (kind IN ('service','product','both')),
  icon  TEXT
);

CREATE TABLE catalog_items (
  id            SERIAL PRIMARY KEY,
  type          TEXT NOT NULL CHECK (type IN ('service','product')),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  category_id   INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  price_cents   INTEGER NOT NULL DEFAULT 0,     -- price in paise (INR * 100)
  duration_min  INTEGER,                        -- services only
  image_url     TEXT,
  rating        NUMERIC(2,1) NOT NULL DEFAULT 4.5,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_tsv    tsvector GENERATED ALWAYS AS (
                  to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''))
                ) STORED
);

CREATE INDEX catalog_search_idx ON catalog_items USING GIN (search_tsv);
CREATE INDEX catalog_name_trgm_idx ON catalog_items USING GIN (name gin_trgm_ops);
CREATE INDEX catalog_type_idx ON catalog_items (type);

-- Product stock. One row per product catalog item.
CREATE TABLE inventory (
  catalog_item_id INTEGER PRIMARY KEY REFERENCES catalog_items(id) ON DELETE CASCADE,
  stock_qty       INTEGER NOT NULL DEFAULT 0,
  low_stock_at    INTEGER NOT NULL DEFAULT 5
);

CREATE TABLE addresses (
  id       SERIAL PRIMARY KEY,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label    TEXT NOT NULL DEFAULT 'Home',
  line1    TEXT NOT NULL,
  city     TEXT NOT NULL,
  pincode  TEXT NOT NULL
);

CREATE TABLE orders (
  id            SERIAL PRIMARY KEY,
  customer_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- null for walk-in offline sales
  channel       TEXT NOT NULL DEFAULT 'online' CHECK (channel IN ('online','offline')),
  type          TEXT NOT NULL CHECK (type IN ('service','product')),
  status        TEXT NOT NULL
                CHECK (status IN (
                  'requested','confirmed','in_progress','completed','cancelled',
                  'placed','packed','out_for_delivery','delivered')),
  address_id    INTEGER REFERENCES addresses(id) ON DELETE SET NULL,
  scheduled_at  TIMESTAMPTZ,                    -- services only
  total_cents   INTEGER NOT NULL DEFAULT 0,
  payment_mode  TEXT NOT NULL DEFAULT 'online' CHECK (payment_mode IN ('online','cash','upi','card')),
  customer_note TEXT,
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- staff who logged an offline sale
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX orders_customer_idx ON orders (customer_id);
CREATE INDEX orders_channel_idx ON orders (channel);

CREATE TABLE order_items (
  id               SERIAL PRIMARY KEY,
  order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  catalog_item_id  INTEGER REFERENCES catalog_items(id) ON DELETE SET NULL,
  name_snapshot    TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  qty              INTEGER NOT NULL DEFAULT 1,
  line_total_cents INTEGER NOT NULL
);

CREATE TABLE favorites (
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  catalog_item_id INTEGER NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, catalog_item_id)
);

CREATE TABLE reviews (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
