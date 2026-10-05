-- Kolacja z podziałem na dzieci i dorosłych (alternatywa 1).
-- Slot posiłku = (date, meal_type, audience):
--   audience 'all'   — posiłek wspólny (domyślnie, jak dotąd)
--   audience 'kids'  — tylko dla dzieci
--   audience 'adults'— tylko dla dorosłych
-- skipped = true → ta grupa świadomie nie je tego posiłku („bez kolacji”), bez przepisu/nazwy.
-- Spójność (albo 'all', albo 'kids'/'adults' w danym slocie) pilnuje aplikacja.

ALTER TABLE meal_plans
  ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'all'
    CHECK (audience IN ('all', 'kids', 'adults')),
  ADD COLUMN IF NOT EXISTS skipped BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE meal_plans DROP CONSTRAINT IF EXISTS meal_plans_date_meal_type_key;
ALTER TABLE meal_plans
  ADD CONSTRAINT meal_plans_date_meal_type_audience_key UNIQUE (date, meal_type, audience);
