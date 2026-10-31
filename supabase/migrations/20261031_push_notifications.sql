-- Powiadomienia push na żywo: nowy przepis / zmiana w planie na jednym urządzeniu → powiadomienie na pozostałych.
--   push_subscriptions — urządzenia z włączonymi powiadomieniami (zapis tylko przez funkcje push_subscribe/unsubscribe;
--                        tabela niewidoczna dla anon — adresy subskrypcji nie wyciekają)
--   meal_plans.updated_at — kiedy wpis się zmienił (send-push wysyła tylko o świeżych zmianach)
--   wyzwalacze (raz na zapytanie, nie na wiersz — plan z kreatora = jedno powiadomienie) wołają Edge Function
--   send-push przez pg_net, z id zmienionych wierszy i id urządzenia, które zmianę zrobiło (nagłówek x-device-id).

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint   TEXT PRIMARY KEY,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  device_id  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY; -- bez polityk: dostęp tylko przez funkcje niżej i service role

CREATE OR REPLACE FUNCTION push_subscribe(p_endpoint TEXT, p_p256dh TEXT, p_auth TEXT, p_device TEXT)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO push_subscriptions (endpoint, p256dh, auth, device_id)
  VALUES (p_endpoint, p_p256dh, p_auth, p_device)
  ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, device_id = EXCLUDED.device_id;
$$;

CREATE OR REPLACE FUNCTION push_unsubscribe(p_endpoint TEXT)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM push_subscriptions WHERE endpoint = p_endpoint;
$$;

GRANT EXECUTE ON FUNCTION push_subscribe(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION push_unsubscribe(TEXT) TO anon, authenticated;

-- meal_plans.updated_at
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS meal_plans_touch ON meal_plans;
CREATE TRIGGER meal_plans_touch BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Zmiana → send-push (asynchronicznie, po zatwierdzeniu transakcji). Błąd wysyłki nigdy nie blokuje zapisu.
CREATE OR REPLACE FUNCTION notify_push() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ids UUID[];
  dev TEXT;
BEGIN
  SELECT array_agg(id) INTO ids FROM new_rows;
  IF ids IS NULL THEN RETURN NULL; END IF;
  BEGIN
    dev := nullif(current_setting('request.headers', true), '')::json ->> 'x-device-id';
  EXCEPTION WHEN others THEN dev := NULL;
  END;
  PERFORM net.http_post(
    url     := 'https://cgssusknfktlowhjfdpd.supabase.co/functions/v1/send-push',
    body    := jsonb_build_object('table', TG_TABLE_NAME, 'ids', to_jsonb(ids), 'device', dev),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NULL;
EXCEPTION WHEN others THEN
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS recipes_push ON recipes;
CREATE TRIGGER recipes_push AFTER INSERT ON recipes
  REFERENCING NEW TABLE AS new_rows FOR EACH STATEMENT EXECUTE FUNCTION notify_push();

DROP TRIGGER IF EXISTS meal_plans_push_insert ON meal_plans;
CREATE TRIGGER meal_plans_push_insert AFTER INSERT ON meal_plans
  REFERENCING NEW TABLE AS new_rows FOR EACH STATEMENT EXECUTE FUNCTION notify_push();

DROP TRIGGER IF EXISTS meal_plans_push_update ON meal_plans;
CREATE TRIGGER meal_plans_push_update AFTER UPDATE ON meal_plans
  REFERENCING NEW TABLE AS new_rows FOR EACH STATEMENT EXECUTE FUNCTION notify_push();
