# Design Guide - housemenu

Niniejszy dokument definiuje system projektowy (Design System) oraz wytyczne wizualne dla aplikacji **housemenu**. Naszym celem jest stworzenie interfejsu o jakości **Premium** – nowoczesnego, żywego, responsywnego i niezwykle przyjemnego w codziennym użytkowaniu.

---

## 1. Filozofia Wizualna (Visual Language)
* **Glassmorphism (Efekt szkła):** Wykorzystanie półprzezroczystych tła z efektem rozmycia (`backdrop-filter: blur()`), nadające aplikacji lekkość i głębię.
* **Bento Grid:** Układ kafelkowy z zaokrąglonymi rogami, ułatwiający skanowanie informacji wzrokiem.
* **Ciemny Motyw Premium:** Domyślny, głęboki motyw ciemny oparty na stonowanych szarościach i granatach (unikamy czystej czerni `#000` na rzecz głębszych odcieni).
* **Żywe Akcenty (Vibrant Colors):** Dynamiczne, nowoczesne kolory akcentujące oparte na palecie HSL dla płynnego sterowania przezroczystością.

---

## 2. Paleta Kolorów (Color Palette)

Aplikacja korzysta z harmonijnej, nowoczesnej palety HSL:

| Rola koloru | Kod HSL | Przeznaczenie | Wizualny charakter |
| :--- | :--- | :--- | :--- |
| **Główne Tło** | `hsl(224, 25%, 8%)` | Cała strona | Bardzo ciemny granat/czerń |
| **Tło Kafelków (Glass)** | `hsla(224, 25%, 14%, 0.6)` | Panele, karty, bento boxy | Półprzezroczysty z rozmyciem tła |
| **Główny Akcent** | `hsl(263, 70%, 50%)` | Przyciski, aktywne stany, ikony | Żywy, nowoczesny fiolet (Neon Purple) |
| **Drugi Akcent** | `hsl(320, 80%, 60%)` | Wyróżnienia, efekty hover | Różowo-purpurowy (Vibrant Pink) |
| **Tekst Główny** | `hsl(210, 40%, 98%)` | Tytuły, główne napisy | Prawie biały, chłodny odcień |
| **Tekst Pomocniczy** | `hsl(215, 20%, 65%)` | Opisy, daty, małe teksty | Stonowany szary |
| **Sukces (Success)** | `hsl(142, 70%, 45%)` | Kupione produkty, gotowe zadania | Świeża zieleń |

---

## 3. Typografia (Typography)
Stosujemy nowoczesne, geometryczne fonty bezszeryfowe pobierane z Google Fonts:
* **Font główny:** `Outfit` lub `Inter` (wyglądają premium, doskonale czytelne na ekranach telefonów i komputerów).
* **Skala wielkości:**
  * `h1`: `2.25rem` (36px), Bold, śledzenie znaków `-0.025em`
  * `h2`: `1.5rem` (24px), Semi-Bold
  * `h3`: `1.25rem` (20px), Medium
  * `body`: `1rem` (16px), Regular
  * `small`: `0.875rem` (14px), Regular

---

## 4. Efekty i Mikro-animacje (Effects & Interactions)

### Szklany panel (Glass Card)
```css
.glass-card {
  background: rgba(30, 41, 59, 0.45);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
```

### Efekty Hover na przyciskach i kartach
Wszystkie elementy interaktywne muszą posiadać płynne przejścia (`transition`). Na przykład przy najechaniu na kartę:
* Delikatne powiększenie (`transform: translateY(-4px) scale(1.01)`).
* Zmiana koloru obramowania (rozjaśnienie `rgba(255, 255, 255, 0.2)`).
* Czas trwania: `0.3s cubic-bezier(0.4, 0, 0.2, 1)`.

---

## 5. Wygląd Elementów UI
* **Zaokrąglenia (Border Radius):** Standardowy promień to `16px` dla większych sekcji i `8px` dla mniejszych elementów (np. tagów, małych przycisków).
* **Przyciski:** Posiadają gradientowe tło (od Głównego Akcentu do Drugiego Akcentu) i delikatny cień dopasowany do koloru akcentu (`box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4)`).

---

## 6. Struktura aplikacji i ekrany

Aplikacja składa się z pięciu głównych ekranów. Każdy ma odrębny cel i styl treści.

| Ekran | Cel | Dominujący element |
| :--- | :--- | :--- |
| **Dziś** (Dashboard) | Szybki podgląd dnia | Duże kafelki posiłków ze zdjęciem |
| **Plan tygodnia** | Planowanie 7 dni × 4 pory | Siatka (grid) — kompaktowa, przejrzysta |
| **Baza przepisów** | Przeglądanie i zarządzanie | Karty z miniaturami zdjęć |
| **Szczegóły przepisu** | Czytanie i gotowanie | Duże zdjęcie hero, kroki na dole |
| **Lista zakupów** | Zakupy w sklepie | Czysta lista, duże checkboxy |

### Nawigacja dolna (Bottom Navigation Bar)

Stały pasek na dole ekranu z czterema zakładkami: **Dziś**, **Plan**, **Przepisy**, **Zakupy**.

- Aktywna zakładka: kolor Głównego Akcentu `hsl(263, 70%, 50%)` + etykieta widoczna
- Nieaktywna zakładka: Tekst Pomocniczy `hsl(215, 20%, 65%)` + ikona bez etykiety
- Tło paska: efekt glass (jak `.glass-card`), lekko oddzielony od treści

---

## 7. Tryb gotowania (Interactive Cooking Mode)

Ekran uruchamiany ze Szczegółów przepisu. Priorytet: czytelność i skupienie.

- **Pełny ekran** — chowany pasek nawigacji, żadnych rozpraszaczy
- Jeden krok na raz — duży numer kroku, duży tekst, dużo białej przestrzeni
- Przycisk "Następny krok" — duży, w kolorze akcentu, łatwy do kliknięcia mokrą ręką
- Pasek postępu u góry (np. Krok 3 z 7) — prosty, liniowy
- Odznaczony krok: przekreślony tekst + kolor Sukcesu `hsl(142, 70%, 45%)`

---

## 8. Zdjęcia przepisów

Zdjęcia są kluczowym elementem estetyki aplikacji — muszą być traktowane z uwagą.

- **Proporcje:** Kafelki na listach — format `16:9` lub `4:3`. Ekran szczegółów — pełna szerokość, format `3:2`, wysokość ok. 40% ekranu.
- **Nakładka (overlay):** Na kafelkach z tekstem — gradient od `transparent` do `rgba(0,0,0,0.6)` od dołu, by tytuł był zawsze czytelny.
- **Brak zdjęcia:** Placeholder w kolorze tła kafelka z ikoną aparatu lub emoji potrawy — nigdy puste białe pole.
- **Ładowanie:** Skeleton loader w kolorze `hsla(224, 25%, 14%, 0.6)` zamiast migającego spinnera.

---

## 9. Przykładowa Wizualizacja Interfejsu (Mockup UI)

Mockup ekranu **Dziś** — zgodny z PRD i design guide.

![Przykładowy Mockup UI Aplikacji housemenu](file:///c:/Users/user/AntigtravityProjects/housemenu/doc/housemenu_mockup.png)

> **Status zgodności z PRD i design guide — ✅ zgodny**
>
> - Mobile-first, orientacja pionowa
> - Ekran startowy `Dziś` z kartami Śniadanie / Obiad / Kolacja
> - Dolny pasek nawigacji: **Dziś / Plan / Przepisy / Zakupy** (aktywna zakładka w fiolecie)
> - Ciemne tło, glass cards, fioletowy akcent — zgodne z paletą HSL
>
> **Do dopracowania przy implementacji:**
> - Nazwy potraw na kartach po angielsku — zastąpić polskimi przy docelowych danych
> - Brak kafelka `Przekąska` — zdecydować czy pojawia się zawsze czy tylko gdy zaplanowana
