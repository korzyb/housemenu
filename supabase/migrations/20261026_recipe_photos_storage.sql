-- Kopie zdjęć przepisów we własnym magazynie (Supabase Storage).
-- Zdjęcia z cudzych stron potrafią zniknąć (zmiana adresów) albo być blokowane — trzymamy kopię u siebie.
--   recipe-photos — publiczny odczyt; zapis tylko przez Edge Function store-photo (service role)
--   recipes.photo_source_url — skąd pochodzi zdjęcie (oryginalny adres), do ewentualnego ponownego pobrania

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('recipe-photos', 'recipe-photos', true, 5242880,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS photo_source_url TEXT;
