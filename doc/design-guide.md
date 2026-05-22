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
| **Dziś** (Dashboard) | Szybki podgląd dnia | 4 kafelki w kolejności: Śniadanie → Przekąska → Obiad → Kolacja |
| **Plan tygodnia** | Planowanie i przeglądanie tygodni | Siatka (grid) z nagłówkiem zakresu dat, swipe między tygodniami |
| **Baza przepisów** | Przeglądanie i zarządzanie | Karty z miniaturami zdjęć |
| **Szczegóły przepisu** | Czytanie i gotowanie | Duże zdjęcie hero, kroki na dole |
| **Lista zakupów** | Zakupy w sklepie | Czysta lista, duże checkboxy |

### Interakcja z kafelkiem posiłku

Kafelek może być **pusty** (pora niezaplanowana) lub **wypełniony** (przepis lub ręczna nazwa).

**Pusty kafelek** — kliknięcie otwiera widok dodawania posiłku (wybór przepisu lub wpisanie nazwy).

**Wypełniony kafelek — ekran Dziś** (duże kafelki):
- Ikonka `⋯` w prawym górnym rogu, zawsze widoczna jako subtelna nakładka na zdjęcie
- Tap w ikonkę → bottom sheet z opcjami: *Otwórz przepis* / *Zmień posiłek* / *Usuń z planu*
- Tap w pozostałą część kafelka → przejście do przepisu

**Wypełniony kafelek — ekran Tygodnia** (małe komórki siatki):
- Komórki są za małe na stałą ikonkę `⋯` — tap w komórkę otwiera bottom sheet z tymi samymi opcjami: *Otwórz przepis* / *Zmień posiłek* / *Usuń z planu*
- Użytkownik zawsze może wybrać otwarcie przepisu z tego menu

---

### Nawigacja dolna (Bottom Navigation Bar)

Stały pasek na dole ekranu z czterema zakładkami: **Dziś**, **Plan**, **Przepisy**, **Zakupy**.

- Aktywna zakładka: kolor Głównego Akcentu `hsl(263, 70%, 50%)` + etykieta widoczna
- Nieaktywna zakładka: Tekst Pomocniczy `hsl(215, 20%, 65%)` + ikona bez etykiety
- Tło paska: efekt glass (jak `.glass-card`), lekko oddzielony od treści

### Nawigacja między tygodniami (swipe)

Ekran Planu tygodnia obsługuje gest przesunięcia poziomego. Karuzela 4 tygodni:

```
← [poprzedni tydzień]  [bieżący tydzień]  [następny tydzień]  [tydzień +2] →
      (tylko podgląd)      (domyślny)          (edytowalny)      (edytowalny)
```

- Nagłówek tygodnia zawsze pokazuje zakres dat, np. **"18–24 maja"**
- Przejście między tygodniami animowane — nowy tydzień wsuwa się z bocznej krawędzi
- Poprzedni tydzień (historia): subtelne przyciemnienie lub oznaczenie "archiwum" — wizualnie odróżniony od edytowalnych tygodni
- Poza karuzelą (dalej niż 4 tygodnie) swipe nie działa — brak efektu "gumki"

---

## 7. Tryb gotowania (Interactive Cooking Mode)

Ekran uruchamiany ze Szczegółów przepisu. Priorytet: czytelność i skupienie.

- **Pełny ekran** — chowany pasek nawigacji, żadnych rozpraszaczy
- Jeden krok na raz — duży numer kroku, duży tekst, dużo białej przestrzeni
- Przycisk "Następny krok" — duży, w kolorze akcentu, łatwy do kliknięcia mokrą ręką
- Pasek postępu u góry (np. Krok 3 z 7) — prosty, liniowy
- Odznaczony krok: przekreślony tekst + kolor Sukcesu `hsl(142, 70%, 45%)`

---

## 8. Lista zakupów — dwa tryby

### Tryb edycji
Standardowy widok listy — użytkownik przygotowuje zakupy przed wyjściem.

- Pozycje z możliwością usunięcia (przycisk × po prawej)
- Drag handle do przeciągania i grupowania pozycji
- Pole tekstowe + przycisk mikrofonu do głosowego dodawania/usuwania ("dodaj mleko", "usuń makaron")
- Przycisk "Tryb sklepowy" widoczny na górze ekranu

### Tryb sklepowy
Uruchamiany z trybu edycji. Priorytet: czytelność jedną ręką przy koszyku, zero rozpraszaczy.

- Pełny ekran — chowany pasek nawigacji i wszystkie kontrolki edycji
- Pozycje listy duże, wysokość wiersza min. `56px`
- Brak checkboxów — kliknięcie w tekst pozycji powoduje jej przekreślenie i wyszarzenie (`hsl(215, 20%, 40%)`)
- Ponowne kliknięcie cofa zaznaczenie
- Brak możliwości edycji głosowej w tym trybie
- Przycisk powrotu do trybu edycji (np. w lewym górnym rogu)

---

## 9. Asystent planowania (AI)

### Tryb błyskawiczny

Bottom sheet z 2–3 kartami propozycji. Każda karta zawiera: zdjęcie (miniatura), nazwę przepisu, czas przygotowania i źródło (własna baza lub internet). Karty z własnej bazy oznaczone subtelną ikonką "z Twoich przepisów". Na dole bottom sheetu przycisk "Pokaż więcej" i link "Przejdź do trybu planowania".

### Tryb planowania — flow ekranów

Ekran otwierany przyciskiem "Zaplanuj z AI ✨" widocznym na ekranie Planu — w prawej części linii z nagłówkiem zakresu dat tygodnia (np. "18–24 maja" po lewej, przycisk po prawej).

**Krok 1 — Składniki** *(opcjonalny)*
- Duże pole tekstowe z podpowiedzią "np. jajka, makaron, pomidory..."
- Przycisk mikrofonu do dyktowania
- Przycisk "Pomiń" zawsze widoczny

**Krok 2 — Preferencje** *(opcjonalny)*
Chipy do wielokrotnego wyboru, pogrupowane:

| Grupa | Opcje |
| :--- | :--- |
| Dieta | Wegetariańskie, Wegańskie, Bez glutenu, Bez laktozy, Bez mięsa czerwonego, Bez ryb |
| Czas | Błyskawiczne (do 15 min), Szybkie (15–30 min), Spokojne (ponad 30 min), Bez gotowania |
| Charakter | Na ciepło, Na zimno, Lekkie, Syte, Zupa, Sałatka, Jednogarnkowe, Coś słodkiego |
| Dla kogo | Dla dzieci, Dla całej rodziny |
| Kuchnia | Polska, Włoska, Azjatycka, Meksykańska, Śródziemnomorska |
| Inne | Coś nowego (nie gotowałem ostatnio), Sezonowe, Z resztek |

Pod chipami: otwarte pole tekstowe "Coś jeszcze? Wpisz własne wymagania..." — użytkownik może wpisać dowolne dodatkowe oczekiwania.

**Krok 3 — Zakres**
Trzy duże przyciski do wyboru: *Jeden posiłek* / *Cały dzień* / *Cały tydzień*

**Krok 4 — Propozycje asystenta**

Każdy slot posiłku zawiera mini-karuzelę 2–3 alternatyw:

```
┌─────────────────────────┐
│  Obiad — środa          │
│ ╔═══════════════════╗   │
│ ║  Makaron z pesto  ║   │
│ ║  [zdjęcie]  25min ║   │
│ ╚═══════════════════╝   │
│         ● ○ ○           │  ← dots: jesteś na 1 z 3
│    ← swipe żeby zmienić │
└─────────────────────────┘
```

- Swipe w lewo/prawo na karcie przełącza między alternatywami — można wracać do poprzednich
- Dots indicator pokazuje pozycję w karuzeli (np. ● ○ ○)
- **Widok "Cały tydzień":** domyślnie jedna propozycja na slot; mała ikonka `⟳` w rogu karty sygnalizuje dostępne alternatywy — tap lub swipe na tej karcie rozwija mini-karuzelę tylko dla wybranego slotu
- Karty przepisów z internetu oznaczone ikoną globusa `🌐`; kliknięcie pozwala podejrzeć przepis i zdecydować czy zapisać do własnej bazy
- Pole konwersacyjne na dole ekranu: użytkownik może wpisać lub powiedzieć korektę ("zamień środę na coś bez mięsa")

**Krok 5 — Zatwierdzenie**
Jeden duży przycisk "Dodaj do planu" w kolorze Głównego Akcentu. Propozycje trafiają do kalendarza tygodnia.

---

## 10. Szablon przepisu

Każdy przepis ma ujednolicony układ niezależnie od sposobu dodania. Pola oznaczone * są wymagane.

### Nagłówek
- **Nazwa*** — duży nagłówek, zawsze na górze
- **Zdjęcie** — pełna szerokość, format `3:2`, pod nazwą; placeholder jeśli brak (patrz sekcja 11)
- **Krótki opis** — 1–2 zdania kursywą pod zdjęciem; opcjonalny, może być generowany przez AI przy imporcie

### Chipy parametrów
Jeden wiersz scrollowalnych chipów pod opisem:

| Chip | Ikona | Przykład |
| :--- | :---: | :--- |
| Czas przygotowania* | ⏱ | 25 min |
| Liczba porcji* | 👤 | 4 porcje |
| Trudność | ⭐ | Łatwy |
| Podawać | 🌡 | Na ciepło |
| Tagi | — | Wegetariańskie, Dla dzieci |
| Źródło | 🌐 | link lub "Własny przepis" |

### Składniki
- Format: ilość + jednostka + nazwa (np. `200 g mąki`, `2 jajka`, `szczypta soli`)
- Lista wypunktowana
- Nad listą: przelicznik porcji (np. `4 porcje ▾`) — tap otwiera pole liczbowe i przelicza wszystkie ilości

### Instrukcja
- Numerowane kroki (`1.`, `2.`, `3.` ...)
- W trybie gotowania każdy krok zajmuje cały ekran (patrz sekcja 7)

### Notatki własne
- Opcjonalne pole tekstowe na własne modyfikacje i wskazówki użytkownika
- Wizualnie odróżnione od instrukcji — tło w kolorze `hsla(224, 25%, 14%, 0.6)`, tekst kursywą

### Stopka (automatyczna, nieedytowalna)
- Data dodania przepisu
- Data ostatniego zaplanowania
- Ikona źródła importu: ✏️ ręczny / 🌐 z URL / 📷 ze zdjęcia / 🎙 głosem

---

## 11. Zdjęcia przepisów

Zdjęcia są kluczowym elementem estetyki aplikacji — muszą być traktowane z uwagą.

- **Proporcje:** Kafelki na listach — format `16:9` lub `4:3`. Ekran szczegółów — pełna szerokość, format `3:2`, wysokość ok. 40% ekranu.
- **Nakładka (overlay):** Na kafelkach z tekstem — gradient od `transparent` do `rgba(0,0,0,0.6)` od dołu, by tytuł był zawsze czytelny.
- **Brak zdjęcia:** Placeholder w kolorze tła kafelka z ikoną aparatu lub emoji potrawy — nigdy puste białe pole.
- **Ładowanie:** Skeleton loader w kolorze `hsla(224, 25%, 14%, 0.6)` zamiast migającego spinnera.

---

## 12. Przykładowa Wizualizacja Interfejsu (Mockup UI)

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
