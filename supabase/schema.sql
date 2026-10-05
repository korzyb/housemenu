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
  -- dla kogo: 'all' wspólny | 'kids' dzieci | 'adults' dorośli (kolacja z podziałem)
  audience    TEXT        NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'kids', 'adults')),
  skipped     BOOLEAN     NOT NULL DEFAULT false,  -- ta grupa nie je tego posiłku („bez kolacji”)
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (date, meal_type, audience)
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
-- TABELA: households  (V1: jedno wspólne gospodarstwo)
-- Architektura gotowa na przyszłe konta i podział na gospodarstwa.
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS households (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL DEFAULT 'Mój dom',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed: jedno gospodarstwo, jeśli tabela jest pusta
INSERT INTO households (name)
SELECT 'Mój dom'
WHERE NOT EXISTS (SELECT 1 FROM households);

-- ─────────────────────────────────────────
-- TABELA: household_members  (domownicy + profil żywieniowy)
-- profile = 5 filarów wg doc/profil_zywieniowy_kontekst.md
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS household_members (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    UUID        REFERENCES households(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  emoji           TEXT,                       -- awatar na karcie (np. 👩 👨 🧒)
  profile         JSONB       DEFAULT '{}'::jsonb,
  -- struktura: { base:{}, red_flags:{}, daily_rhythm:{}, taste_profile:{}, kitchen_resources:{} }
  -- każde pole listowe = tablica, każdy filar ma pole notes (waga równa wyborom)
  ai_profile_card TEXT,                        -- cache karty wygenerowanej przez AI
  card_stale      BOOLEAN     DEFAULT true,    -- czy karta wymaga regeneracji po edycji profilu
  is_active       BOOLEAN     DEFAULT true,    -- domyślnie uwzględniaj w generowaniu AI
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY — households / household_members
-- V1: brak logowania — dostęp dla roli anon
-- ─────────────────────────────────────────
ALTER TABLE households        ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon full access on households"
  ON households FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "anon full access on household_members"
  ON household_members FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────
-- INDEKSY
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS meal_plans_date_idx ON meal_plans (date);
CREATE INDEX IF NOT EXISTS shopping_list_sort_idx ON shopping_list (sort_order);
CREATE INDEX IF NOT EXISTS household_members_household_idx ON household_members (household_id);
