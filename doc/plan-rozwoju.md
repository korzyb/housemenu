# Plan rozwoju housemenu (mealplanner)

> Lista następnych kroków, w kolejności rekomendowanej. Aktualizowana na bieżąco.
> Ostatnia aktualizacja: 24 października 2026.

## Do zrobienia

| # | Krok | Dlaczego | Szacunek |
| :---: | :--- | :--- | :--- |
| 1 | **Kopie zdjęć przepisów w Supabase Storage** — skopiować wszystkie zdjęcia z cudzych stron do własnego magazynu i podmienić `photo_url`; nowe importy od razu zapisują kopię | Zdjęcia to linki do obcych stron — mogą zniknąć przy zmianie adresów (Kuchnia Lidla zmieniła je po 3 tygodniach) albo być zablokowane | średni |
| 2 | **Tryb gotowania** — pełny ekran, krok po kroku, ekran nie gaśnie | Codzienne użycie w kuchni | średni |
| 3 | **Wgrywanie własnych zdjęć** przepisów (z aparatu / galerii) | Własne dania bez zdjęcia z internetu; korzysta z magazynu z kroku 1 | mały (po kroku 1) |
| 4 | **Sprzątanie tagów** — wspólna krótka lista tagów zamiast przypadkowych z importu („retro”, „pancakes”…) | Trafniejsze filtry i planowanie AI | mały |
| 5 | **Przeliczanie porcji na liście zakupów** wg tego, kto je (dzieci / dorośli) | Ilości dopasowane do domowników | średni — wymaga profili dzieci (Ustawienia → Domownicy) |
| 6 | **Import przepisów z linków w aplikacji** (wiele naraz), dalej import ze zdjęcia / głosu, głosowa lista zakupów | Dziś import hurtowy działa tylko skryptem | duży |
| 7 | **Przeciąganie pozycji na liście zakupów** + sprzątnięcie 8 starych ostrzeżeń lintera | Wygoda, porządek w kodzie | mały |
| 8 | **Logowanie domowników** (Supabase Auth, e-mail) + dostęp do danych tylko dla zalogowanych (RLS) | Aplikacja jest publiczna (GitHub Pages), a baza pozwala każdemu, kto zna adres, czytać i zmieniać przepisy, plan, zakupy i profile żywieniowe — świadomie odłożone | duży |
| 9 | **Osobny adres aplikacji** (np. Vercel) | Chrome na Androidzie myli dwie aplikacje pod jednym adresem `korzyb.github.io` (housebudget ↔ mealplanner) | mały |

## Po stronie użytkownika

- **Profile dzieci** w Ustawieniach → Domownicy (faza życia „małe dziecko” / „dziecko szkolne”) — AI planuje wtedy kolacje dzieci pod konkretne dzieci; potrzebne do kroku 6.

## Zrobione (ostatnio)

- Publikacja na GitHub Pages jako instalowalna aplikacja (PWA „mealplanner”).
- Kolacja osobno dla dzieci i dorosłych, „tylko dzieci”; Przekąska wycofana.
- Import 68 przepisów z listy (`doc/przepisy-do-importu.md`), w tym obsługa mikrodanych schema.org i Thermomix (Cookidoo).
- Filtry w bazie przepisów (pora, czas, Thermomix, tagi, sortowanie „dawno nie było”).
- Tagi pór posiłków wiążące dla AI (danie „obiad” nie trafia na kolację).
