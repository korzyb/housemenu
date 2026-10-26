# Plan rozwoju housemenu (mealplanner)

> Lista następnych kroków, w kolejności rekomendowanej. Aktualizowana na bieżąco.
> Ostatnia aktualizacja: 26 października 2026.

## Do zrobienia

| # | Krok | Dlaczego | Szacunek |
| :---: | :--- | :--- | :--- |
| 1 | **Tryb gotowania** — pełny ekran, krok po kroku, ekran nie gaśnie | Codzienne użycie w kuchni | średni |
| 2 | **Wgrywanie własnych zdjęć** przepisów (z aparatu / galerii) | Własne dania bez zdjęcia z internetu; korzysta z magazynu zdjęć (już gotowy) | mały |
| 3 | **Sprzątanie tagów** — wspólna krótka lista tagów zamiast przypadkowych z importu („retro”, „pancakes”…) | Trafniejsze filtry i planowanie AI | mały |
| 4 | **Przeliczanie porcji na liście zakupów** wg tego, kto je (dzieci / dorośli) | Ilości dopasowane do domowników | średni — wymaga profili dzieci (Ustawienia → Domownicy) |
| 5 | **Import przepisów z linków w aplikacji** (wiele naraz), dalej import ze zdjęcia / głosu, głosowa lista zakupów | Dziś import hurtowy działa tylko skryptem | duży |
| 6 | **Przeciąganie pozycji na liście zakupów** + sprzątnięcie 8 starych ostrzeżeń lintera | Wygoda, porządek w kodzie | mały |
| 7 | **Logowanie domowników** (Supabase Auth, e-mail) + dostęp do danych tylko dla zalogowanych (RLS) | Aplikacja jest publiczna (GitHub Pages), a baza pozwala każdemu, kto zna adres, czytać i zmieniać przepisy, plan, zakupy i profile żywieniowe — świadomie odłożone | duży |
| 8 | **Osobny adres aplikacji** (np. Vercel) | Chrome na Androidzie myli dwie aplikacje pod jednym adresem `korzyb.github.io` (housebudget ↔ mealplanner) | mały |

## Po stronie użytkownika

- **Profile dzieci** w Ustawieniach → Domownicy (faza życia „małe dziecko” / „dziecko szkolne”) — AI planuje wtedy kolacje dzieci pod konkretne dzieci; potrzebne do kroku 4.

## Zrobione (ostatnio)

- **Kopie zdjęć przepisów we własnym magazynie** (Supabase Storage, bucket `recipe-photos`): wszystkie 68 zdjęć przeniesione, oryginalny adres w `photo_source_url`; zdjęcie zapisanego / zaimportowanego przepisu trafia do magazynu automatycznie (Edge Function `store-photo`). Miniatury 250×250 z Kwestii Smaku podmienione na pełne zdjęcia.
- Publikacja na GitHub Pages jako instalowalna aplikacja (PWA „mealplanner”).
- Kolacja osobno dla dzieci i dorosłych, „tylko dzieci”; Przekąska wycofana.
- Import 68 przepisów z listy (`doc/przepisy-do-importu.md`), w tym obsługa mikrodanych schema.org i Thermomix (Cookidoo).
- Filtry w bazie przepisów (pora, czas, Thermomix, tagi, sortowanie „dawno nie było”).
- Tagi pór posiłków wiążące dla AI (danie „obiad” nie trafia na kolację).
