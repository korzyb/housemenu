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
   Użytkownik widzi cały tydzień przed sobą i przypisuje posiłki do każdego dnia (śniadanie, obiad, kolacja, przekąska). Plan można układać przez przeciąganie lub wybór z listy przepisów. Po zaplanowaniu tygodnia jest gotowy — nie trzeba już codziennie myśleć co zjeść.

2. **Baza przepisów**
   Użytkownik przechowuje swoje ulubione przepisy wraz ze zdjęciami, listą składników i instrukcją przygotowania. Każdy przepis można oznaczyć tagami (np. szybkie, wegetariańskie, dla dzieci). Zamiast przepisywać przepis z internetu, można też po prostu zapisać link do zewnętrznej strony.

3. **Interaktywny tryb gotowania**
   Podczas gotowania użytkownik przechodzi przez kroki przepisu jeden po drugim, odznaczając każdy wykonany krok. Ekran jest duży, czytelny i skupiony — żadnych rozpraszaczy.

4. **Automatyczna lista zakupów**
   Po zaplanowaniu tygodnia aplikacja sama zbiera wszystkie potrzebne składniki w jedną listę. Użytkownik może ją uzupełnić ręcznie o inne artykuły. W sklepie odznacza kupione produkty.

5. **Podgląd dnia na ekranie startowym**
   Ekran główny pokazuje co jest zaplanowane na dziś. Użytkownik od razu widzi co gotuje — bez szukania i przeglądania.

---

## 4. Widoki / ekrany

### Dziś (ekran startowy)
- **Cel:** natychmiastowy podgląd bez potrzeby szukania
- **Zawiera:** zaplanowane posiłki na dziś (nazwa, zdjęcie, skrót przepisu), szybkie przyciski do planera i listy zakupów

### Plan tygodnia
- **Cel:** zaplanowanie posiłków na cały tydzień jednorazowo
- **Zawiera:** siatka 7 dni × 4 pory posiłku, każda komórka pokazuje zaplanowany posiłek lub jest pusta do wypełnienia, wybór przepisu z bazy lub szybkie dodanie własnego

### Baza przepisów
- **Cel:** przeglądanie i zarządzanie przepisami
- **Zawiera:** lista przepisów ze zdjęciami, wyszukiwarka, filtry według tagów i czasu przygotowania, przycisk dodania nowego przepisu

### Szczegóły przepisu
- **Cel:** zapoznanie się z przepisem i gotowanie krok po kroku
- **Zawiera:** zdjęcie, lista składników z ilościami, instrukcja w trybie klikanych kroków, link do źródła (jeśli jest), przycisk "dodaj do planu tygodnia"

### Lista zakupów
- **Cel:** zakupy na podstawie zaplanowanego tygodnia
- **Zawiera:** składniki zebrane automatycznie z przepisów, możliwość dopisania własnych pozycji, checkboxy do odznaczania kupionych produktów

---

## 5. Nawigacja

Dolny pasek z czterema zakładkami: **Dziś**, **Plan**, **Przepisy**, **Zakupy**. Ze szczegółów przepisu można bezpośrednio uruchomić tryb gotowania lub dodać przepis do wybranego dnia w planie.

---

## 6. Integracje zewnętrzne

**Chmura** — dane użytkownika (przepisy, plan tygodnia, lista zakupów) są zapisywane w chmurze za pośrednictwem Supabase. Dzięki temu plan jest dostępny zarówno na telefonie w sklepie, jak i na komputerze przy planowaniu. Dane nie giną po zamknięciu przeglądarki.

**Cookido / Thermomix** *(planowane na przyszłość)* — aplikacja będzie mogła pobierać przepisy i sugestie bezpośrednio z Cookido, bez ręcznego przepisywania. Dla użytkowników Thermomix skróci to czas tworzenia planu do minimum.

---

## 7. Co jest poza zakresem

- Aplikacja nie liczy kalorii ani wartości odżywczych
- Aplikacja nie układa diety i nie sugeruje co powinieneś jeść
- Aplikacja nie jest katalogiem tysięcy gotowych przepisów z internetu — to miejsce na własne, ulubione potrawy
- Aplikacja nie obsługuje płatności ani zamawiania zakupów online
- Aplikacja nie ocenia przepisów, nie daje porad kulinarnych i nie jest "szefem kuchni"
