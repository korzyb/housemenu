# PRD — housemenu

---

## 1. Wizja i cel

**housemenu** to asystent planowania posiłków dla domu. Przeznaczony dla osób, które chcą mieć tygodniowy plan jedzenia gotowy z wyprzedzeniem — zamiast decydować o tym codziennie od nowa. Główna obietnica: raz w tygodniu planujesz, przez całą resztę tygodnia wiesz co jesz.

---

## 2. Dla kogo?

Osoba prowadząca dom, która każdego dnia traci czas i energię na decyzję "co dziś ugotować". Chce mieć ten problem rozwiązany raz na tydzień — zaplanować posiłki w niedzielę, wygenerować listę zakupów i od poniedziałku po prostu gotować według planu. Nie jest profesjonalnym kucharzem, ale lubi dobre jedzenie i chce mieć porządek w kuchni.

---

## 3. Co aplikacja robi

1. **Tygodniowy plan posiłków**
   Użytkownik widzi cały tydzień przed sobą i przypisuje posiłki do każdego dnia (śniadanie, przekąska, obiad, kolacja). Po zaplanowaniu tygodnia jest gotowy — nie trzeba już codziennie myśleć co zjeść.

   **Dodawanie posiłku do dnia** działa na dwa sposoby:
   - **Z planu lub ekranu Dziś** — kliknięcie w pustą porę dnia otwiera wybór: przepis z bazy lub krótka nazwa wpisana ręcznie (np. "Kanapki"). Ręcznie wpisana nazwa wyświetla się w planie i na ekranie Dziś tak samo jak przepis — bez zdjęcia, ale z nazwą.
   - **Z przepisu** — przeglądając bazę przepisów, użytkownik może kliknąć "Dodaj do planu", wybrać dzień i porę, i przepis trafia do planu bez wychodzenia z widoku przepisów.

   **Zmiana lub usunięcie posiłku** — kafelek z już przypisanym posiłkiem ma w rogu ikonkę menu (⋯). Kliknięcie ikonki otwiera opcje: *Otwórz przepis*, *Zmień posiłek*, *Usuń z planu*. Kliknięcie w pozostałą część kafelka przechodzi bezpośrednio do przepisu.

2. **Baza przepisów**
   Użytkownik przechowuje swoje ulubione przepisy wraz ze zdjęciami, listą składników i instrukcją przygotowania. Każdy przepis można oznaczyć tagami (np. szybkie, wegetariańskie, dla dzieci).

   **Dodawanie przepisu** — użytkownik wybiera jedną z czterech ścieżek, efekt końcowy jest zawsze taki sam (ujednolicony przepis w formacie aplikacji):
   - **Ręcznie** — wypełnia formularz: nazwa, składniki, kroki, zdjęcie
   - **Z internetu** — wkleja link do strony z przepisem, asystent AI automatycznie pobiera treść i przetwarza ją do formatu aplikacji
   - **Ze zdjęcia** — robi zdjęcie przepisu z książki, gazety lub kartki, AI odczytuje tekst i zamienia na ustrukturyzowany przepis
   - **Głosem** — dyktuje przepis, AI przetwarza mowę na gotowy przepis ze składnikami i krokami

   Na karcie każdego przepisu widoczna jest data ostatniego zaplanowania — żeby można było sprawdzić czy dany posiłek był w menu w zeszłym tygodniu czy miesiąc temu.

3. **Interaktywny tryb gotowania**
   Podczas gotowania użytkownik przechodzi przez kroki przepisu jeden po drugim, odznaczając każdy wykonany krok. Ekran jest duży, czytelny i skupiony — żadnych rozpraszaczy.

4. **Automatyczna lista zakupów**
   Po zaplanowaniu tygodnia aplikacja sama zbiera wszystkie potrzebne składniki w jedną listę. Lista jest w pełni edytowalna w obie strony — można dodawać brakujące pozycje, ale też usuwać te, które już są w domu. Produkty można przeciągać, żeby pogrupować je po swojemu (np. wszystkie warzywa razem, nabiał osobno).

   W sklepie lista przełącza się w tryb pełnoekranowy — duże pozycje, duże checkboxy do odznaczania, żadnych rozpraszaczy. Kupiony produkt zostaje wyszarzony i przekreślony.

   Listę można edytować głosem: "dodaj mleko", "usuń makaron".

   W przyszłości: integracja z Frisco — możliwość wysłania gotowej listy zakupów bezpośrednio do koszyka w aplikacji do zakupów online.

5. **Podgląd dnia na ekranie startowym**
   Ekran główny pokazuje co jest zaplanowane na dziś. Użytkownik od razu widzi co gotuje — bez szukania i przeglądania.

6. **Asystent planowania (AI)**
   Wbudowany asystent AI pomaga zaplanować posiłki — od pojedynczej sugestii po cały tydzień. Priorytetem są przepisy z własnej bazy użytkownika; jeśli baza nie zawiera odpowiednich dopasowań, asystent proponuje przepisy z internetu i może od razu przetworzyć je do formatu aplikacji.

   **Tryb błyskawiczny** — dostępny bezpośrednio z pustego kafelka posiłku (przycisk ✨) lub jako floating button na ekranie Planu. Otwiera bottom sheet z 2–3 propozycjami dopasowanymi do pory dnia, historii ostatnio gotowanych posiłków i aktualnego planu tygodnia (żeby unikać powtórzeń). Kliknięcie propozycji dodaje ją do planu.

   **Tryb planowania** — uruchamiany przyciskiem "Zaplanuj z AI" na ekranie Planu. Prowadzony krok po kroku:

   - **Krok 1 — Co masz w domu?** *(opcjonalnie)* — użytkownik wpisuje lub dyktuje składniki, które chce wykorzystać. Można pominąć.
   - **Krok 2 — Preferencje** *(opcjonalnie)* — wybór z gotowych opcji (wielokrotny wybór) i/lub wpisanie własnych wymagań w polu tekstowym.
   - **Krok 3 — Zakres** — jeden posiłek / cały dzień / cały tydzień.
   - **Krok 4 — Propozycje** — asystent prezentuje plan w postaci kart. Każdy slot zawiera mini-karuzelę 2–3 alternatyw — użytkownik swipuje między nimi i może wrócić do poprzedniej propozycji. Przy zakresie "Cały tydzień" domyślnie widoczna jest jedna propozycja na slot, a mała ikonka sygnalizuje że są alternatywy do przeswipowania. Asystent może dopytać lub zasugerować uzupełnienie ("jeśli masz jeszcze śmietanę, możesz zrobić zupę zamiast sałatki"). Użytkownik może też wpisać lub powiedzieć korektę ("zamień środę na coś bez mięsa").
   - **Krok 5 — Zatwierdź** — jednym przyciskiem cały zaproponowany plan trafia do kalendarza tygodnia.

---

## 4. Widoki / ekrany

### Dziś (ekran startowy)
- **Cel:** natychmiastowy podgląd bez potrzeby szukania
- **Zawiera:** zaplanowane posiłki na dziś w kolejności: **Śniadanie → Przekąska → Obiad → Kolacja** (każde z nazwą, zdjęciem i skrótem przepisu), szybkie przyciski do planera i listy zakupów
- Wszystkie cztery pory wyświetlają się zawsze, nawet jeśli nie są zaplanowane — puste miejsce sygnalizuje że można coś dodać

### Plan tygodnia
- **Cel:** zaplanowanie posiłków na cały tydzień jednorazowo i przeglądanie historii
- **Zawiera:** nagłówek z zakresem dat (np. "18–24 maja"), siatka z **dniami tygodnia jako wierszami** (7 wierszy: Pn–Nd) i **porami posiłku jako kolumnami** (4 kolumny: Śn / Prz / Ob / Ko) — cały tydzień widoczny na jednym ekranie bez scrollowania, każda komórka pokazuje zaplanowany posiłek lub jest pusta do wypełnienia
- **Nawigacja między tygodniami** — karuzela 4 tygodni obsługiwana gestem przesunięcia (swipe):
  - przesunięcie w lewo → następny tydzień (do zaplanowania)
  - przesunięcie w lewo ponownie → tydzień za następnym (do zaplanowania)
  - przesunięcie w prawo → poprzedni tydzień (historia, tylko do podglądu)
  - dalej w prawo ani dalej w lewo już nie można — 4 tygodnie to granica

### Baza przepisów
- **Cel:** przeglądanie i zarządzanie przepisami
- **Zawiera:** lista przepisów ze zdjęciami, wyszukiwarka, filtry według tagów i czasu przygotowania, przycisk dodania nowego przepisu

### Szczegóły przepisu
- **Cel:** zapoznanie się z przepisem i gotowanie krok po kroku
- **Zawiera:**
  - zdjęcie, nazwa, krótki opis (opcjonalny)
  - chipy parametrów: czas przygotowania, liczba porcji, trudność, na ciepło/zimno, tagi, źródło
  - przelicznik porcji — zmiana liczby porcji automatycznie przelicza ilości składników
  - lista składników z ilościami (ilość + jednostka + nazwa)
  - instrukcja krok po kroku (klikalna w trybie gotowania)
  - notatki własne (opcjonalne pole na własne modyfikacje i wskazówki)
  - stopka: data dodania i data ostatniego zaplanowania
  - przycisk "Dodaj do planu tygodnia"

### Lista zakupów
- **Cel:** zakupy na podstawie zaplanowanego tygodnia
- **Zawiera:** składniki zebrane automatycznie z przepisów, możliwość dodawania i usuwania pozycji, przeciąganie do własnego grupowania, checkboxy do odznaczania
- **Tryb sklepowy** — pełny ekran, duże pozycje i checkboxy, odznaczone produkty wyszarzone; dostępny też głosowy sposób edycji listy

---

## 5. Nawigacja

Dolny pasek z czterema zakładkami: **Dziś**, **Plan**, **Przepisy**, **Zakupy**. Ze szczegółów przepisu można bezpośrednio uruchomić tryb gotowania lub dodać przepis do wybranego dnia w planie. Na ekranie Planu tygodnia między tygodniami nawiguje się gestem przesunięcia (swipe lewo/prawo).

---

## 6. Integracje zewnętrzne

**Chmura (Supabase)** — dane użytkownika (przepisy, plan tygodnia, lista zakupów) są zapisywane w chmurze. Dzięki temu plan jest dostępny zarówno na telefonie w sklepie, jak i na komputerze przy planowaniu. Dane nie giną po zamknięciu przeglądarki.

W pierwszej wersji aplikacja działa bez logowania — wszystkie osoby w gospodarstwie domowym widzą i edytują te same dane. Architektura jest jednak przygotowana na przyszłe konta użytkowników i podział na gospodarstwa: każde gospodarstwo będzie miało własny, odizolowany zestaw przepisów i planów, niedostępny dla innych.

Wyjątkiem będzie możliwość udostępniania pojedynczych przepisów między gospodarstwami — z poziomu przepisu użytkownik może kliknąć "Udostępnij", podać nazwę lub adres e-mail innego użytkownika aplikacji, a ten otrzyma link lub powiadomienie. Odbiorca dostaje podgląd przepisu i może go zapisać do swojej własnej bazy.

**Asystent AI** — wbudowany w funkcję dodawania przepisów. Przetwarza przepisy z dowolnego źródła (adres strony, zdjęcie, dyktowanie) i zamienia je na ujednolicony format aplikacji. Nie wymaga od użytkownika żadnej wiedzy technicznej — wystarczy podać źródło.

**Rozpoznawanie głosu** — używane do edycji listy zakupów ("dodaj mleko") oraz dyktowania przepisów. Działa w przeglądarce bez instalowania dodatkowych aplikacji.

**Cookido / Thermomix** *(planowane)* — pobieranie przepisów i sugestii bezpośrednio z Cookido, bez ręcznego przepisywania.

**Frisco** *(planowane)* — wysłanie gotowej listy zakupów bezpośrednio do koszyka w aplikacji do zakupów online.

**Technologia frontendu** — aplikacja zbudowana w React. Oprócz Supabase i asystenta AI nie wymaga integracji z zewnętrznymi serwisami na starcie.

---

## 7. Co jest poza zakresem

- Aplikacja nie liczy kalorii ani wartości odżywczych
- Aplikacja nie układa diety i nie sugeruje co powinieneś jeść
- Aplikacja nie jest katalogiem tysięcy gotowych przepisów z internetu — to miejsce na własne, ulubione potrawy
- Aplikacja nie obsługuje płatności ani zamawiania zakupów online
- Aplikacja nie ocenia przepisów, nie daje porad kulinarnych i nie jest "szefem kuchni"
