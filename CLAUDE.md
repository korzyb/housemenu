# housemenu — kontekst projektu dla Claude

## Dokumentacja produktowa
- `doc/PRD.md` — wymagania funkcjonalne (co i dlaczego)
- `doc/design-guide.md` — system wizualny (kolory, komponenty, układ ekranów)
- `mockups/` — PNG mockupy ekranów (Dziś, Plan, Zakupy, AI Wizard)

## Stack techniczny
- **Frontend:** React 18 + Vite 8
- **Routing:** react-router-dom
- **Backend/DB:** Supabase (`@supabase/supabase-js`)
- **AI:** Google Gemini API (przez Supabase Edge Functions — klucz NIE w frontendzie)
- **Język:** JavaScript (nie TypeScript)
- **Style:** CSS Modules (do ustalenia przed implementacją)

## Zmienne środowiskowe (.env — nie commitować)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
```

## Kluczowe decyzje architektoniczne
- Klucz Gemini API **nigdy w kodzie frontendowym** — wywołania AI idą przez Supabase Edge Functions
- Wersja 1 bez logowania — jeden wspólny widok, architektura gotowa na przyszłe konta/gospodarstwa
- Dane w Supabase (nie localStorage)

## Ekrany aplikacji (5 głównych)
1. **Dziś** — ekran startowy, 4 kafelki (Śniadanie/Przekąska/Obiad/Kolacja), zawsze widoczne
2. **Plan tygodnia** — siatka: dni jako wiersze (Pn–Nd), posiłki jako kolumny (Śn/Prz/Ob/Ko)
3. **Baza przepisów** — lista kart z miniaturami
4. **Szczegóły przepisu** — hero zdjęcie, składniki, klikalne kroki, tryb gotowania
5. **Lista zakupów** — tryb edycji + tryb sklepowy (pełny ekran, tap = przekreślenie)

## Nawigacja
Dolny pasek: **Dziś / Plan / Przepisy / Zakupy**

## Polecenia
```bash
npm run dev      # dev server na localhost:5173
npm run build    # produkcyjny build
npm run preview  # podgląd buildu
```
