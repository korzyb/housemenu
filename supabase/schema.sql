-- housemenu schema
-- Wklej i wykonaj w: Supabase Dashboard → SQL Editor → New query

-- ─────────────────────────────────────────
-- TABELA: recipes
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  description     TEXT,
  photo_url       TEXT,
  prep_time       INTEGER,                    -- minuty
  servings        INTEGER     DEFAULT 4,
  difficulty      TEXT        CHECK (difficulty IN ('easy', 'medium', 'hard')),
  temperature     TEXT        CHECK (temperature IN ('hot', 'cold')),
  tags            TEXT[]      DEFAULT '{}',
  source_url      TEXT,
  source_type     TEXT        DEFAULT 'manual'
                              CHECK (source_type IN ('manual', 'url', 'photo', 'voice')),
  notes           TEXT,
  ingredients     JSONB       DEFAULT '[]'::jsonb,
  -- format: [{ "amount": "200", "unit": "g", "name": "mąka" }, ...]
  steps           JSONB       DEFAULT '[]'::jsonb,
  -- format: [{ "order": 1, "text": "Zagotuj wodę" }, ...]
  created_at      TIMESTAMPTZ DEFAULT now(),
  last_planned_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────
-- TABELA: meal_plans
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_plans (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE        NOT NULL,
  meal_type   TEXT        NOT NULL
              CHECK (meal_type IN ('breakfast', 'snack', 'lunch', 'dinner')),
  recipe_id   UUID        REFERENCES recipes(id) ON DELETE SET NULL,
  custom_name TEXT,        -- ręcznie wpisana nazwa (bez przepisu)
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (date, meal_type)
);

-- ─────────────────────────────────────────
-- TABELA: shopping_list
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopping_list (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  amount      TEXT,                           -- np. "200 g", "2 sztuki"
  category    TEXT        DEFAULT 'Inne',
  is_checked  BOOLEAN     DEFAULT false,
  sort_order  INTEGER     DEFAULT 0,
  source      TEXT        DEFAULT 'manual'
              CHECK (source IN ('auto', 'manual')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- V1: brak logowania — dostęp dla roli anon
-- ─────────────────────────────────────────
ALTER TABLE recipes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans    ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- recipes
CREATE POLICY "anon full access on recipes"
  ON recipes FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- meal_plans
CREATE POLICY "anon full access on meal_plans"
  ON meal_plans FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- shopping_list
CREATE POLICY "anon full access on shopping_list"
  ON shopping_list FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────
-- INDEKSY
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS meal_plans_date_idx ON meal_plans (date);
CREATE INDEX IF NOT EXISTS shopping_list_sort_idx ON shopping_list (sort_order);
