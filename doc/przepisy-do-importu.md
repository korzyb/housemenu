# Przepisy do importu — z notatki domowej

> Plik roboczy do przejrzenia przed importem do bazy housemenu. Wygenerowano: 4.10.2026.
> Każdy link sprawdzony automatycznie (strona działa, ma zdjęcie, rodzaj danych przepisu).

## Podsumowanie

- **63 pozycji** po usunięciu duplikatów z notatki (np. jajecznica, oskarki, zapiekanki, pasta jajeczna, polędwiczki, rosół występowały 2–3×); pancakes pominięte — już są w bazie.
- **53 przepisów ze zdjęciem** (ze strony źródłowej albo — przy mini-przepisach — ze strony-wzoru) (podgląd poniżej, w kolumnie „Zdjęcie”) — import z linku pobierze je automatycznie.
- **13 mini-przepisów ręcznych** — proste posiłki bez sensownego przepisu w sieci albo w Waszej domowej wersji (kanapki, parówki, oskarki, szybkie spaghetti…). Gotowe propozycje składników i kroków są w sekcji [Mini-przepisy](#mini-przepisy-do-wstawienia) na końcu pliku.

### Źródła i jak zaimportują się dziś

| Tryb | Ile | Co to znaczy |
| :--- | :---: | :--- |
| 🟢 JSON-LD z krokami (Winiary) | 1 | Pełne dane schema.org — składniki i kroki wprost ze strony; AI tylko rozbija kroki na atomowe. Działa już dziś. |
| 🔵 mikrodane (aniagotuje.pl) | 31 | Strona ma składniki zapisane w standardzie schema.org (**mikrodane**). Nasz import czyta dziś tylko wariant JSON-LD, więc te przepisy pójdą przez AI — zadziała, ale zużywa limit Gemini i może coś przekręcić. **Rekomendacja:** dodać do importu obsługę mikrodanych → dokładne składniki bez AI. |
| 🟢 Thermomix (Cookidoo) | 9 | Import bierze nazwę, zdjęcie, składniki, czas, porcje i trudność; przepis dostaje oznaczenie **Thermomix** — kroki prowadzi urządzenie, w aplikacji zamiast kroków jest link „Otwórz w Cookidoo”. **Działa już dziś.** |
| 🤖 AI (Kwestia Smaku, Olga Smile) | 9 | Brak danych strukturalnych — AI czyta treść strony (jak przy mojewypieki.com). |
| ✍️ ręcznie | 13 | Bez linku — mini-przepis do wpisania (mogę je przygotować hurtem). |

### Uzgodnione decyzje (✅ w tabelach)

1. **Pierogi z serem** — na słodko z twarogiem.
2. **Tortilla** — z kurczakiem.
3. **Sałatki** — Cezar + bardzo prosta: sałata, pomidor, ogórek, oliwa (mini-przepis).
4. **Szaszłyki** — z kurczakiem.
5. **Skrzydełka** — gotowe marynowane z Biedronki (mini-przepis z 1 produktem).
6. **Spaghetti bolognese** — domowe: mięso mielone smażone i doprawione, sos ze słoika doprawiony ziołami (oregano, bazylia), makaron osobno (mini-przepis).
7. **Jajecznica** — dwa przepisy: „Jajecznica na boczku z cebulą” (osobno) + „Jajecznica” z wariantami (na maśle, ze szczypiorkiem, z cebulą, z pieczarkami).
8. **Oskarki** — podgrzewane kanapki z ciabatty: salami, sałata, pomidor, ogórek, cebula + sos ketchup-majonez, w opiekaczu (mini-przepis).
9. **Jajka sadzone** — zestaw z bagietką czosnkową/ziołową na ciepło (opiekacz/piekarnik) i prostą sałatką (mini-przepis).
10. **Jajka na miękko** — z Cookidoo („Gotowanie jajek”, Kulinarne ABC).
11. **Omlet z ziemniakami** = **Tortilla de patatas** (ziemniaki, cebula, jajka) — Kwestia Smaku.
12. **Pancakes** — już są w bazie (z mojewypieki.com), usunięte z listy. ⚠️ W bazie są **dwa identyczne** wpisy „Pancakes” — jeden do usunięcia.
13. **Makaron z krewetkami** — z pomidorkami koktajlowymi, cebulą i czosnkiem; ugotowany makaron na koniec do patelni.
14. **Pierogi** — gotowe mrożone, do wrzucenia na garnek: jeden przepis „Pierogi” + 3 warianty (zamiast trzech przepisów do lepienia; pierogi leniwe z Thermomix zostają).
15. **Pasta jajeczna** — tylko jajka starte na tarce, majonez, musztarda, sól, pieprz, szczypiorek/natka (mini-przepis).
16. **Kanapki** (jeden przepis z wariantami) i **parówki/frankfurterki** — ręczne mini-przepisy.
17. **Gofry z jajkiem sadzonym** — z boczkiem albo szynką, sałatą i majonezem/ketchupem (mini-przepis, wzór Food&More).

### Legenda kolumn

**Pory:** Ś — śniadanie, P — przekąska, O — obiad, K — kolacja, G — grill. **Czas / porcje / trudność** — z przepisu źródłowego albo szacunek (do poprawy przy imporcie).


## 🍳 Śniadania

| Zdjęcie | Danie | Parametry | Źródło i import | Uwagi |
| :---: | :--- | :--- | :--- | :--- |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2022/01/23318618-v-1500x1500.jpg" width="110" alt="Jajecznica (z wariantami)"> | **Jajecznica (z wariantami)**<br><sub>z notatki: jajecznica (szczypiorek / cebula)</sub> | Ś, K<br>⏱ 10 min · 👤 2<br>łatwy · na ciepło<br><sub>jajka, szybkie, wegetariańskie</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/jajecznica)<br>🔵 mikrodane<br><sub>alt.: [aniagotuje.pl](https://aniagotuje.pl/przepis/jajecznica-z-grzybami)</sub> | ✅ Baza na maśle + warianty w notatkach przepisu: ze szczypiorkiem / z cebulą / z pieczarkami (wariant z pieczarkami — link alt.). |
| <img src="https://images.aws.nestle.recipes/original/d1c97a9e7d00f05b9e3ca8b7c3915dd3_jajecznica.jpg" width="110" alt="Jajecznica na boczku z cebulą"> | **Jajecznica na boczku z cebulą**<br><sub>z notatki: jajecznica (boczek + cebula)</sub> | Ś, K<br>⏱ 15 min · 👤 2<br>łatwy · na ciepło<br><sub>jajka, boczek, szybkie</sub> | [winiary.pl](https://www.winiary.pl/przepisy/jajecznica-na-boczku-z-cebula/)<br>🟢 JSON-LD | ✅ Osobny przepis. Winiary ma pełne dane schema.org z krokami — najdokładniejszy import z całej listy. |
| <img src="https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480/img/recipe/ras/Assets/68bd4dcea7246f9709512f1caf5e8e1a/Derivates/eabaaa053140ea01d9a43738e3e5f4bf47cec0b6.jpg" width="110" alt="Jajka na miękko (Thermomix)"> | **Jajka na miękko (Thermomix)**<br><sub>z notatki: jajka na miękko</sub> | Ś<br>⏱ 20 min · 👤 4<br>łatwy · na ciepło<br><sub>thermomix, jajka</sub> | [cookidoo.pl](https://cookidoo.pl/recipes/recipe/pl-PL/r55348)<br>🟢 Thermomix | ✅ Cookidoo „Gotowanie jajek” (Kulinarne ABC) — 4 jajka prosto z lodówki + 400 g wody, w Varomie. Kroki prowadzi Thermomix. |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2018/05/105371-v-1000x1000.jpg" width="110" alt="Jajka sadzone z bagietką i sałatką"> | **Jajka sadzone z bagietką i sałatką**<br><sub>z notatki: jajka sadzone z bagietką</sub> | Ś, K<br>⏱ 20 min · 👤 2<br>łatwy · na ciepło<br><sub>jajka, bagietka, sałatka</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/jak-zrobic-jajko-sadzone)<br>🔵 mikrodane | ✅ Zestaw: jajka sadzone + bagietka czosnkowa/ziołowa na ciepło (opiekacz/piekarnik) + prosta sałatka. Jeden wpis złożony — mini-przepis (niżej); link = technika jajka sadzonego. |
| <img src="https://www.kwestiasmaku.com/sites/v123.kwestiasmaku.com/files/tortilla-ziemniaczana-00.jpg" width="110" alt="Tortilla de patatas (omlet z ziemniakami i cebulą)"> | **Tortilla de patatas (omlet z ziemniakami i cebulą)**<br><sub>z notatki: omlet z ziemniakami</sub> | Ś, O, K<br>⏱ 35 min · 👤 4<br>średni · na ciepło<br><sub>jajka, ziemniaki, hiszpańskie, wegetariańskie</sub> | [kwestiasmaku.com](https://www.kwestiasmaku.com/przepis/tortilla-de-patatas-hiszpanska-tortilla-z-ziemniakami)<br>🔵 mikrodane | ✅ Klasyczna hiszpańska: tylko ziemniaki, cebula, jajka, olej i sól. Kwestia Smaku ma mikrodane schema.org (5 składników). |
| <img src="https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480/img/recipe/ras/Assets/BF8451DA-A394-4757-A709-27541C2C50DB/Derivates/38499A74-62BB-4A6B-8EAE-72D397111CC2.jpg" width="110" alt="Omlet biszkoptowy (Thermomix)"> | **Omlet biszkoptowy (Thermomix)**<br><sub>z notatki: omlet biszkoptowe</sub> | Ś<br>⏱ 10 min · 👤 1<br>łatwy · na ciepło<br><sub>thermomix, jajka, słodkie</sub> | [cookidoo.pl](https://cookidoo.pl/recipes/recipe/pl/r56894)<br>🟢 Thermomix | Cookidoo: nazwa, zdjęcie, składniki, porcje i trudność się zaimportują; kroki prowadzi Thermomix. |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2016/03/102460-v-1000x1000.jpg" width="110" alt="Naleśniki z serem"> | **Naleśniki z serem**<br><sub>z notatki: naleśniki z serem</sub> | Ś, O<br>⏱ 40 min · 👤 4<br>łatwy · na ciepło<br><sub>słodkie, twaróg, dla dzieci</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/nalesniki-aksamitne-z-serem)<br>🔵 mikrodane |  |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2023/04/41891848-v-1500x1500.jpg" width="110" alt="Placki bananowe"> | **Placki bananowe**<br><sub>z notatki: placki z banana</sub> | Ś, P<br>⏱ 20 min · 👤 3<br>łatwy · na ciepło<br><sub>słodkie, dla dzieci, szybkie</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/placuszki-bananowe)<br>🔵 mikrodane |  |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2018/01/104433-v-1000x1000.jpg" width="110" alt="Placki owsiane"> | **Placki owsiane**<br><sub>z notatki: placki owsiane</sub> | Ś, P<br>⏱ 20 min · 👤 2<br>łatwy · na ciepło<br><sub>owsiane, fit, szybkie</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/placki-owsiane-z-bananem)<br>🔵 mikrodane | Wersja z bananem (3 składniki). |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2023/12/52594504-v-1500x1500.jpg" width="110" alt="Racuchy z jabłkami"> | **Racuchy z jabłkami**<br><sub>z notatki: racuchy z jabłkami</sub> | Ś, O, P<br>⏱ 40 min · 👤 4<br>łatwy · na ciepło<br><sub>słodkie, jabłka</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/racuchy-z-jablkami)<br>🔵 mikrodane |  |
| <img src="https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480/img/recipe/ras/Assets/dc7c90076f21c34128aef08d780dcf0b/Derivates/74e008df37384b8bae4a29667ab36b2e385c368a.jpg" width="110" alt="Gofry (Thermomix)"> | **Gofry (Thermomix)**<br><sub>z notatki: gofry</sub> | Ś, P<br>⏱ 30 min · 👤 4<br>łatwy · na ciepło<br><sub>thermomix, słodkie</sub> | [cookidoo.pl](https://cookidoo.pl/recipes/recipe/pl/r904543)<br>🟢 Thermomix | Cookidoo „Gofry klasyczne” — kroki prowadzi Thermomix. |
| <img src="https://foodandmore.pl/wp-content/uploads/2022/01/S_C4581.jpg" width="110" alt="Gofry z jajkiem sadzonym i boczkiem"> | **Gofry z jajkiem sadzonym i boczkiem**<br><sub>z notatki: gofry (+ z jajkiem sadzonym)</sub> | Ś, K<br>⏱ 30 min · 👤 3<br>łatwy · na ciepło<br><sub>wytrawne, jajka, boczek, gofry</sub> | ✍️ ręcznie<br><sub>wzór i zdjęcie: [foodandmore.pl](https://foodandmore.pl/2022/01/gofry-z-sadzonym-jajkiem-i-boczkiem/)</sub> | ✅ Wzór: Food&More (gofry + sałata + pomidor + jajko sadzone + boczek). U nich bez sosu i z chili — w mini-przepisie (niżej) dodałem majonez/ketchup i wariant z szynką zamiast boczku. |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2024/08/66144659-v-1500x1500.jpg" width="110" alt="Kasza jaglana z owocami (jaglanka)"> | **Kasza jaglana z owocami (jaglanka)**<br><sub>z notatki: kasza jaglana z owocami</sub> | Ś<br>⏱ 25 min · 👤 2<br>łatwy · na ciepło<br><sub>fit, owoce, bez glutenu</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/jaglanka)<br>🔵 mikrodane |  |
| 📷 brak | **Parówki / frankfurterki**<br><sub>z notatki: parówki, frankfurterki</sub> | Ś, K<br>⏱ 10 min · 👤 2<br>łatwy · na ciepło<br><sub>szybkie, dla dzieci</sub> | ✍️ ręcznie | ✅ Ręczny mini-przepis (niżej) — dzięki niemu parówki trafią na listę zakupów. |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2021/07/16974341-v-1500x1500.jpg" width="110" alt="Hot dogi"> | **Hot dogi**<br><sub>z notatki: hot-dog</sub> | Ś, K<br>⏱ 20 min · 👤 4<br>łatwy · na ciepło<br><sub>dla dzieci, szybkie</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/hot-dogi)<br>🔵 mikrodane |  |
| <img src="https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480/img/recipe/ras/Assets/C198F16F-29BD-4A92-A369-61042DAF412A/Derivates/e8969ec982d09d7bb33ccedd2b0c30d247b0f96d.jpg" width="110" alt="Hot dogi kibica (Thermomix)"> | **Hot dogi kibica (Thermomix)**<br><sub>z notatki: hot dog kibica / „hot-dog Kubica”</sub> | Ś, K, P<br>⏱ 1 h 50 min · 👤 15<br>łatwy · na ciepło<br><sub>thermomix, drożdżowe, impreza</sub> | [cookidoo.pl](https://cookidoo.pl/recipes/recipe/pl-PL/r127849)<br>🟢 Thermomix | 15 sztuk, 10 min pracy / 1 h 50 min z wyrastaniem. Kroki prowadzi Thermomix. |
| 📷 brak | **Kanapki (z wariantami)**<br><sub>z notatki: kanapki (dżem / wędlina / Almette / miód / pasta orzechowa)</sub> | Ś, K<br>⏱ 10 min · 👤 2<br>łatwy · na zimno<br><sub>szybkie, bez gotowania</sub> | ✍️ ręcznie | ✅ Ręczny przepis — jak „Jajecznica”: jeden wpis, baza w składnikach, warianty w notatkach. Dodatek wybranego wariantu dopisujesz na listę zakupów ręcznie. |
| <img src="https://www.zajadam.pl/wp-content/uploads/2015/03/pasta-jajeczna-1-891x500.jpg" width="110" alt="Pasta jajeczna"> | **Pasta jajeczna**<br><sub>z notatki: pasta jajeczna (2×)</sub> | Ś, K<br>⏱ 20 min · 👤 2<br>łatwy · na zimno<br><sub>jajka, do kanapek, wegetariańskie</sub> | ✍️ ręcznie<br><sub>wzór i zdjęcie: [zajadam.pl](https://www.zajadam.pl/wielkanoc/pasta-jajeczna)</sub> | ✅ Tylko: jajka, majonez, musztarda, sól, pieprz + szczypiorek/natka. Wzór: zajadam.pl (dokładnie te składniki), ale tam jajka idą do blendera — mini-przepis (niżej) ma wersję z tarką. Odpada aniagotuje (ser żółty, ogórek, śmietana). |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2021/09/19799464-v-1500x1500.jpg" width="110" alt="Zapiekanki"> | **Zapiekanki**<br><sub>z notatki: zapiekanki (śniadania + kolacje)</sub> | Ś, K<br>⏱ 25 min · 👤 4<br>łatwy · na ciepło<br><sub>bagietka, pieczarki, ser</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/zapiekanki)<br>🔵 mikrodane |  |
| 📷 brak | **Oskarki**<br><sub>z notatki: oskarki (śniadania + kolacje)</sub> | Ś, K<br>⏱ 15 min · 👤 2<br>łatwy · na ciepło<br><sub>kanapki na ciepło, opiekacz, szybkie</sub> | ✍️ ręcznie | ✅ Wasz domowy przepis: podgrzewana kanapka z ciabatty z salami, warzywami i sosem ketchup-majonez, w opiekaczu (jak kebab/tortilla). Mini-przepis (niżej) — popraw ilości, jeśli robicie inaczej. |

## 🍽 Obiady — dania główne

| Zdjęcie | Danie | Parametry | Źródło i import | Uwagi |
| :---: | :--- | :--- | :--- | :--- |
| <img src="https://www.kwestiasmaku.com/sites/v123.kwestiasmaku.com/files/filet-z-kurczaka-00.jpg" width="110" alt="Kotlety z piersi kurczaka (panierowane)"> | **Kotlety z piersi kurczaka (panierowane)**<br><sub>z notatki: kurczaka kotlet</sub> | O<br>⏱ 30 min · 👤 4<br>łatwy · na ciepło<br><sub>kurczak, panierowane, dla dzieci</sub> | [kwestiasmaku.com](https://www.kwestiasmaku.com/kuchnia_polska/piersi_kurczaka_w_panierce/przepis.html)<br>🤖 AI |  |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2017/06/103799-v-1000x1000.jpg" width="110" alt="Kotlety schabowe"> | **Kotlety schabowe**<br><sub>z notatki: schabowy</sub> | O<br>⏱ 40 min · 👤 4<br>łatwy · na ciepło<br><sub>wieprzowina, panierowane, polskie</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/kotlety-schabowe)<br>🔵 mikrodane |  |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2020/03/2463382-v-1500x1500.jpg" width="110" alt="Kotlety mielone"> | **Kotlety mielone**<br><sub>z notatki: mielone</sub> | O<br>⏱ 40 min · 👤 4<br>łatwy · na ciepło<br><sub>mięso mielone, polskie</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/kotlety-mielone)<br>🔵 mikrodane |  |
| <img src="https://www.kwestiasmaku.com/sites/v123.kwestiasmaku.com/files/stek_z_pieprzem_00.jpg" width="110" alt="Stek wołowy"> | **Stek wołowy**<br><sub>z notatki: steki</sub> | O, G<br>⏱ 25 min · 👤 2<br>średni · na ciepło<br><sub>wołowina</sub> | [kwestiasmaku.com](https://www.kwestiasmaku.com/kuchnia_francuska/stek_z_pieprzem/przepis.html)<br>🤖 AI | Wersja z sosem pieprzowym (można pominąć sos). Jeśli robicie inaczej (np. tylko sól/pieprz/masło) — zrobię prostszy wpis. |
| <img src="https://www.olgasmile.com/images/000028274-poledwiczki-z-cebula-1.JPG" width="110" alt="Polędwiczki wieprzowe z cebulą"> | **Polędwiczki wieprzowe z cebulą**<br><sub>z notatki: polędwiczki wieprzowe z cebulą (2×)</sub> | O<br>⏱ 30 min · 👤 4<br>łatwy · na ciepło<br><sub>wieprzowina, szybkie</sub> | [olgasmile.com](https://www.olgasmile.com/poledwiczki-wieprzowe-z-cebula.html)<br>🤖 AI |  |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2021/02/12660139-v-1500x1500.jpg" width="110" alt="Pieczone udka z kurczaka"> | **Pieczone udka z kurczaka**<br><sub>z notatki: pieczone udka z kurczaka (2×)</sub> | O<br>⏱ 1 h 15 min · 👤 4<br>łatwy · na ciepło<br><sub>kurczak, piekarnik</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/udka-pieczone)<br>🔵 mikrodane |  |
| <img src="https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480/img/recipe/ras/Assets/BCEAF003-FEAA-483E-B5E1-C53A578681D7/Derivates/148ef20d-b251-490b-9008-671ceb0e7e86.jpg" width="110" alt="Kurczak w cieście pomidorowym (Thermomix)"> | **Kurczak w cieście pomidorowym (Thermomix)**<br><sub>z notatki: kurczak w cieście (pomidorowym)</sub> | O<br>⏱ 40 min · 👤 4<br>łatwy · na ciepło<br><sub>thermomix, kurczak, smażone</sub> | [cookidoo.pl](https://cookidoo.pl/recipes/recipe/pl-PL/r146451)<br>🟢 Thermomix | Ocena 4,5 (886 opinii). Z sosem czosnkowym. Kroki prowadzi Thermomix. |
| 📷 brak | **Spaghetti bolognese (domowe, z sosem ze słoika)**<br><sub>z notatki: spaghetti bolognese</sub> | O<br>⏱ 40 min · 👤 4<br>łatwy · na ciepło<br><sub>makaron, mięso mielone, włoskie</sub> | ✍️ ręcznie | ✅ Wersja domowa: mięso mielone smażone i doprawione osobno, potem sos ze słoika doprawiony ziołami, makaron gotowany oddzielnie — mini-przepis (niżej). |
| <img src="https://zpierwszegotloczenia.pl/obrazek/duze/makaron-z-krewetkami-i-pomidorkami-koktajlowymi-423430.jpeg" width="110" alt="Makaron z krewetkami i pomidorkami koktajlowymi"> | **Makaron z krewetkami i pomidorkami koktajlowymi**<br><sub>z notatki: krewetki z makaronem (Internet), makaron z krewetkami</sub> | O, K<br>⏱ 20 min · 👤 3<br>łatwy · na ciepło<br><sub>makaron, owoce morza, szybkie</sub> | [zpierwszegotloczenia.pl](https://zpierwszegotloczenia.pl/przepis/makaron-z-krewetkami-i-pomidorkami-koktajlowymi/2)<br>🤖 AI<br><sub>alt.: [primipiatti.pl](https://primipiatti.pl/2024/01/29/makaron-z-krewetkami-i-pomidorkami-koktajlowymi/)</sub> | ✅ Cebula + czosnek, krewetki, pomidorki koktajlowe; ugotowany makaron na koniec do patelni i wszystko razem mieszane. Przepis podaje olej Kujawski „z oregano, pomidorami i cebulą” — przy imporcie zamienię na oliwę + oregano. Alt. (z masłem i śmietaną): Primi Piatti. |
| <img src="https://www.kwestiasmaku.com/sites/v123.kwestiasmaku.com/files/nalesniki_00_0.jpg" width="110" alt="Naleśniki (podstawowe)"> | **Naleśniki (podstawowe)**<br><sub>z notatki: naleśniki</sub> | O, Ś<br>⏱ 30 min · 👤 4<br>łatwy · na ciepło<br><sub>słodkie, dla dzieci</sub> | [kwestiasmaku.com](https://www.kwestiasmaku.com/przepis/nalesniki)<br>🤖 AI | Ciasto bazowe — nadzienie dowolne (dżem, ser, nutella…). |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2020/01/2063431-v-1500x1500.jpg" width="110" alt="Pierogi (mrożone, z wariantami)"> | **Pierogi (mrożone, z wariantami)**<br><sub>z notatki: pierogi z serem, z kapustą, z mięsem</sub> | O, K<br>⏱ 20 min · 👤 4<br>łatwy · na ciepło<br><sub>pierogi, polskie, szybkie, gotowe</sub> | ✍️ ręcznie | ✅ Gotowe mrożone pierogi do wrzucenia na garnek — nie do lepienia. Jeden przepis z 3 wariantami (jak „Jajecznica”). Zdjęcie poglądowe (aniagotuje.pl). |
| <img src="https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480/img/recipe/ras/Assets/42adda4e9720dc462de01b31b4a99cf0/Derivates/45d73f7fbad461e8ae25dfc0a92a40f6b58b2bfb.jpg" width="110" alt="Pierogi leniwe (Thermomix)"> | **Pierogi leniwe (Thermomix)**<br><sub>z notatki: pierogi leniwe</sub> | O<br>⏱ 45 min · 👤 4<br>łatwy · na ciepło<br><sub>thermomix, twaróg, dla dzieci</sub> | [cookidoo.pl](https://cookidoo.pl/recipes/recipe/pl-PL/r5420)<br>🟢 Thermomix | Ocena 4,6 (7,5 tys. opinii). Kroki prowadzi Thermomix. |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2020/10/8437530-v-1500x1500.jpg" width="110" alt="Placki ziemniaczane"> | **Placki ziemniaczane**<br><sub>z notatki: placki ziemniaczane</sub> | O<br>⏱ 45 min · 👤 4<br>łatwy · na ciepło<br><sub>ziemniaki, polskie, wegetariańskie</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/tradycyjne-placki-ziemniaczane)<br>🔵 mikrodane |  |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2020/05/3989474-v-1500x1500.jpg" width="110" alt="Burgery wołowe"> | **Burgery wołowe**<br><sub>z notatki: burgery / burger (obiady + grill)</sub> | O, G, K<br>⏱ 40 min · 👤 4<br>łatwy · na ciepło<br><sub>wołowina, grill</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/burgery-wolowe)<br>🔵 mikrodane | Jeden przepis dla obiadu i grilla. |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2021/01/11536436-v-1500x1500.jpg" width="110" alt="Frytki z jajkiem sadzonym i fasolką / kalafiorem"> | **Frytki z jajkiem sadzonym i fasolką / kalafiorem**<br><sub>z notatki: frytki z jajkiem i kalafiorem/fasolką (2×)</sub> | O<br>⏱ 45 min · 👤 4<br>łatwy · na ciepło<br><sub>ziemniaki, jajka, wegetariańskie</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/frytki-z-piekarnika)<br>🔵 mikrodane<br><sub>alt.: [aniagotuje.pl](https://aniagotuje.pl/przepis/fasolka-szparagowa)</sub> | Danie złożone — jeden wpis (niżej) zbudowany z frytek z piekarnika (link) + jajka sadzonego + fasolki (link alt.) lub kalafiora. |
| <img src="https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480/img/recipe/ras/Assets/7df6ac6d54fc070027b4003119d3c019/Derivates/6385028873fe7c6cace34efeae8324eea2bf2fca.jpg" width="110" alt="Pizza — ciasto (Thermomix)"> | **Pizza — ciasto (Thermomix)**<br><sub>z notatki: pizza (ciasto na pizzę)</sub> | O, K<br>⏱ 1 h · 👤 4<br>łatwy · na ciepło<br><sub>thermomix, pizza, drożdżowe</sub> | [cookidoo.pl](https://cookidoo.pl/recipes/recipe/pl-PL/r55375)<br>🟢 Thermomix | Ciasto bazowe; dodatki dowolne. |
| <img src="https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480/img/recipe/ras/Assets/64acade5d739820b5d2089364a3e61cb/Derivates/0571b2a66d2298c171f98b30ec149ee68aa18763.jpg" width="110" alt="Pizza retro na grubym cieście (Thermomix)"> | **Pizza retro na grubym cieście (Thermomix)**<br><sub>z notatki: pizza retro</sub> | O, K<br>⏱ 1 h 45 min · 👤 6<br>łatwy · na ciepło<br><sub>thermomix, pizza, retro</sub> | [cookidoo.pl](https://cookidoo.pl/recipes/recipe/pl/r804406)<br>🟢 Thermomix | Z pieczarkami, papryką, kiełbasą, ketchupem — klimat lat 90. |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2022/05/27876812-v-1500x1500.jpg" width="110" alt="Burrito"> | **Burrito**<br><sub>z notatki: burrito</sub> | O, K<br>⏱ 40 min · 👤 4<br>łatwy · na ciepło<br><sub>meksykańskie, tortilla</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/burrito)<br>🔵 mikrodane |  |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2019/09/1153195-v-1500x1500.jpg" width="110" alt="Tortilla z kurczakiem"> | **Tortilla z kurczakiem**<br><sub>z notatki: tortilla (kolacje)</sub> | K, O<br>⏱ 30 min · 👤 4<br>łatwy · na ciepło<br><sub>kurczak, tortilla, szybkie</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/tortilla-z-kurczakiem)<br>🔵 mikrodane | ✅ Z kurczakiem. |
| <img src="https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480/img/recipe/ras/Assets/08C973AE-9622-4828-AFFF-05593DCCB534/Derivates/E1CA2467-AFD0-48AC-9436-5E47707C0832.jpg" width="110" alt="Pita (Thermomix)"> | **Pita (Thermomix)**<br><sub>z notatki: pita</sub> | K, O<br>⏱ 2 h 30 min · 👤 8<br>łatwy · na ciepło<br><sub>thermomix, pieczywo, drożdżowe</sub> | [cookidoo.pl](https://cookidoo.pl/recipes/recipe/pl/r44087)<br>🟢 Thermomix | Samo pieczywo pita (ocena 4,8). Jest też „Pity z marynowanym kurczakiem” (cookidoo r489019) — jeśli to o to chodzi. |

## 🥣 Zupy i dania jednogarnkowe

| Zdjęcie | Danie | Parametry | Źródło i import | Uwagi |
| :---: | :--- | :--- | :--- | :--- |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2020/01/1968771-v-1500x1500.jpg" width="110" alt="Rosół"> | **Rosół**<br><sub>z notatki: rosół (2×)</sub> | O<br>⏱ 3 h · 👤 6<br>łatwy · na ciepło<br><sub>zupa, polskie, kurczak</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/rosol-z-kury)<br>🔵 mikrodane |  |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2021/10/20290189-v-1500x1500.jpg" width="110" alt="Zupa pomidorowa"> | **Zupa pomidorowa**<br><sub>z notatki: pomidorówka / pomidorowa</sub> | O<br>⏱ 40 min · 👤 6<br>łatwy · na ciepło<br><sub>zupa, polskie, dla dzieci</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/zupa-pomidorowa)<br>🔵 mikrodane | Klasyczna — na rosole, z koncentratem; dobra na „drugi dzień po rosole”. |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2020/11/9086298-v-1500x1500.jpg" width="110" alt="Krupnik"> | **Krupnik**<br><sub>z notatki: krupnik (2×)</sub> | O<br>⏱ 1 h · 👤 6<br>łatwy · na ciepło<br><sub>zupa, polskie, kasza</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/krupnik)<br>🔵 mikrodane |  |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2020/11/9334534-v-1500x1500.jpg" width="110" alt="Zupa ogórkowa"> | **Zupa ogórkowa**<br><sub>z notatki: ogórkowa (2×)</sub> | O<br>⏱ 45 min · 👤 6<br>łatwy · na ciepło<br><sub>zupa, polskie</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/zupa-ogorkowa-na-rosole)<br>🔵 mikrodane |  |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2020/11/9328968-v-1500x1500.jpg" width="110" alt="Kapuśniak"> | **Kapuśniak**<br><sub>z notatki: kapuśniak (2×)</sub> | O<br>⏱ 1 h 30 min · 👤 6<br>łatwy · na ciepło<br><sub>zupa, polskie, kiszona kapusta</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/kapusniak)<br>🔵 mikrodane |  |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2019/04/523856-v-1000x1000.jpg" width="110" alt="Botwinka"> | **Botwinka**<br><sub>z notatki: botwina</sub> | O<br>⏱ 45 min · 👤 6<br>łatwy · na ciepło<br><sub>zupa, polskie, sezonowe</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/botwinka)<br>🔵 mikrodane | Sezonowa (maj–lipiec). |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2021/01/11097736-v-1500x1500.jpg" width="110" alt="Zupa warzywna (jarzynowa)"> | **Zupa warzywna (jarzynowa)**<br><sub>z notatki: warzywna</sub> | O<br>⏱ 45 min · 👤 6<br>łatwy · na ciepło<br><sub>zupa, wegetariańskie, dla dzieci</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/zupa-jarzynowa)<br>🔵 mikrodane |  |

## 🌙 Kolacje (pozostałe)

| Zdjęcie | Danie | Parametry | Źródło i import | Uwagi |
| :---: | :--- | :--- | :--- | :--- |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2020/07/5570713-v-1500x1500.jpg" width="110" alt="Bruschetta"> | **Bruschetta**<br><sub>z notatki: bruschetta</sub> | K, P<br>⏱ 15 min · 👤 4<br>łatwy · na ciepło<br><sub>włoskie, pomidory, szybkie</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/bruschetta)<br>🔵 mikrodane |  |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2021/11/21731412-v-1500x1500.jpg" width="110" alt="Sałatka cezar"> | **Sałatka cezar**<br><sub>z notatki: sałatka cesarska</sub> | K, O<br>⏱ 30 min · 👤 4<br>łatwy · na zimno<br><sub>sałatka, kurczak</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/salatka-cezar)<br>🔵 mikrodane |  |
| 📷 brak | **Prosta sałatka (sałata, pomidor, ogórek)**<br><sub>z notatki: sałatka (dopisek)</sub> | K, O<br>⏱ 10 min · 👤 4<br>łatwy · na zimno<br><sub>sałatka, wegetariańskie, szybkie, dodatek</sub> | ✍️ ręcznie | ✅ „Sałata, pomidor, ogórek, oliwa i finito” — mini-przepis (niżej). Pasuje też jako dodatek do obiadu. |
| 📷 brak | **Tosty (sandwiche)**<br><sub>z notatki: tosty, tosty (sandwiche)</sub> | K, Ś<br>⏱ 10 min · 👤 2<br>łatwy · na ciepło<br><sub>szybkie, ser, szynka</sub> | ✍️ ręcznie | Mini-przepis (niżej). |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2015/10/102201-v-1000x1000.jpg" width="110" alt="Tosty francuskie"> | **Tosty francuskie**<br><sub>z notatki: tosty francuskie (2×)</sub> | K, Ś<br>⏱ 15 min · 👤 2<br>łatwy · na ciepło<br><sub>słodkie, jajka, szybkie</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/klasyczne-tosty-francuskie)<br>🔵 mikrodane |  |
| 📷 brak | **Ryba wędzona**<br><sub>z notatki: ryba wędzona (dopisek)</sub> | K<br>⏱ 5 min · 👤 2<br>łatwy · na zimno<br><sub>ryby, bez gotowania</sub> | ✍️ ręcznie | Gotowy produkt — mini-przepis (niżej). Alternatywa: szybka pasta z wędzonej makreli (aniagotuje.pl/przepis/szybka-pasta-z-wedzonej-makreli). |
| 📷 brak | **Kiełbasa (na ciepło / z grilla)**<br><sub>z notatki: kiełbasa (kolacje + grill)</sub> | K, G<br>⏱ 15 min · 👤 4<br>łatwy · na ciepło<br><sub>grill, szybkie</sub> | ✍️ ręcznie | Mini-przepis (niżej). |

## 🔥 Grill

| Zdjęcie | Danie | Parametry | Źródło i import | Uwagi |
| :---: | :--- | :--- | :--- | :--- |
| 📷 brak | **Skrzydełka z grilla (gotowe z Biedronki)**<br><sub>z notatki: skrzydełka (Biedronka)</sub> | G<br>⏱ 30 min · 👤 4<br>łatwy · na ciepło<br><sub>grill, kurczak, gotowe</sub> | ✍️ ręcznie | ✅ Gotowe marynowane z Biedronki — mini-przepis z 1 produktem (niżej). |
| <img src="https://www.kwestiasmaku.com/sites/v123.kwestiasmaku.com/files/steki10.jpg" width="110" alt="Filet z kurczaka z grilla"> | **Filet z kurczaka z grilla**<br><sub>z notatki: filet z kurczaka</sub> | G, O<br>⏱ 30 min · 👤 4<br>łatwy · na ciepło<br><sub>grill, kurczak</sub> | [kwestiasmaku.com](https://www.kwestiasmaku.com/przepis/marynat-do-mies-z-grilla)<br>🤖 AI | Link to uniwersalna marynata (oliwa, balsamico, rozmaryn, czosnek) — przepis złożę: filet + marynata + grillowanie ok. 6–7 min/stronę. |
| <img src="https://www.kwestiasmaku.com/sites/v123.kwestiasmaku.com/files/poledwiczka-z-grilla-sos-rabarbarowy-00.jpg" width="110" alt="Polędwiczka wieprzowa z grilla"> | **Polędwiczka wieprzowa z grilla**<br><sub>z notatki: polędwica wieprzowa</sub> | G<br>⏱ 1 h 20 min · 👤 3<br>łatwy · na ciepło<br><sub>grill, wieprzowina</sub> | [kwestiasmaku.com](https://www.kwestiasmaku.com/kuchnia_polska/dania_z_grilla/poledwiczka_z_grilla/przepis.html)<br>🤖 AI | Z marynowaniem min. 1 h. |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2018/04/105322-v-1000x1000.jpg" width="110" alt="Karkówka z grilla"> | **Karkówka z grilla**<br><sub>z notatki: karkówka</sub> | G<br>⏱ 30 min · 👤 4<br>łatwy · na ciepło<br><sub>grill, wieprzowina</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/soczysta-karkowka-z-grilla)<br>🔵 mikrodane | Plus czas marynowania (najlepiej na noc). |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2024/05/62228987-v-1500x1500.jpg" width="110" alt="Warzywa z grilla"> | **Warzywa z grilla**<br><sub>z notatki: warzywa (pieczarki / papryka / cukinia)</sub> | G<br>⏱ 30 min · 👤 4<br>łatwy · na ciepło<br><sub>grill, wegetariańskie</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/warzywa-na-grilla)<br>🔵 mikrodane |  |
| <img src="https://cdn.aniagotuje.com/pictures/articles/2018/05/105409-v-1000x1000.jpg" width="110" alt="Halloumi z grilla"> | **Halloumi z grilla**<br><sub>z notatki: ser hallumi</sub> | G, K<br>⏱ 20 min · 👤 4<br>łatwy · na ciepło<br><sub>grill, wegetariańskie, ser</sub> | [aniagotuje.pl](https://aniagotuje.pl/przepis/cukinia-z-grilla-z-serem-halloumi)<br>🔵 mikrodane | Wersja z cukinią. Sam halloumi: plastry 1 cm, 2–3 min/stronę. |
| <img src="https://www.kwestiasmaku.com/sites/v123.kwestiasmaku.com/files/szaszlyki_z_lososia_ananasa04.jpg" width="110" alt="Krewetki z ananasem (szaszłyki)"> | **Krewetki z ananasem (szaszłyki)**<br><sub>z notatki: krewetki z ananasem</sub> | G<br>⏱ 25 min · 👤 4<br>łatwy · na ciepło<br><sub>grill, owoce morza</sub> | [kwestiasmaku.com](https://www.kwestiasmaku.com/kuchnia_polska/dania_z_grilla/szaszlyki_z_lososia/przepis.html)<br>🤖 AI | Nie znalazłem dokładnie tego przepisu — link to „szaszłyki z łososia i ananasa”; przy imporcie zamienię łososia na krewetki (grill ~1 min/stronę). |
| <img src="https://www.kwestiasmaku.com/sites/v123.kwestiasmaku.com/files/szaszlyki_z_kurczakiem_00.jpg" width="110" alt="Szaszłyki z kurczakiem"> | **Szaszłyki z kurczakiem**<br><sub>z notatki: szaszłyki</sub> | G<br>⏱ 40 min · 👤 4<br>łatwy · na ciepło<br><sub>grill, kurczak</sub> | [kwestiasmaku.com](https://www.kwestiasmaku.com/dania_dla_dwojga/party/szaszlyki_z_kurczakiem/przepis.html)<br>🤖 AI | ✅ Z kurczakiem. Przepis z ananasem i papryką — ananas można pominąć przy edycji. |
| 📷 brak | **Bagietka z grilla (czosnkowa)**<br><sub>z notatki: bagietka</sub> | G<br>⏱ 10 min · 👤 4<br>łatwy · na ciepło<br><sub>grill, pieczywo</sub> | ✍️ ręcznie | Mini-przepis (niżej). |

## Mini-przepisy do wstawienia

Propozycje dla pozycji bez linku (✍️). Kroki w stylu „atomowym”, jak przy imporcie. Popraw ilości, jeśli robicie inaczej.

### Jajka sadzone z bagietką i sałatką

*Ś, K · ⏱ 20 min · 👤 2 · łatwy · na ciepło · tagi: jajka, bagietka, sałatka*

**Składniki:**
- 4 jajka
- 1 łyżka masła lub oleju
- 1 bagietka
- 40 g masła
- 1–2 ząbki czosnku lub 1 łyżeczka ziół prowansalskich
- 1 główka sałaty
- 2 pomidory
- 1 ogórek
- 2 łyżki oliwy
- sól, pieprz

**Kroki:**
1. Rozgrzej piekarnik do 200°C lub opiekacz.
2. Utrzyj miękkie masło z przeciśniętym czosnkiem lub ziołami.
3. Przekrój bagietkę wzdłuż i pokrój na kawałki.
4. Posmaruj bagietkę masłem czosnkowym.
5. Zapiekaj bagietkę 5–7 min (w opiekaczu 3–4 min).
6. Porwij sałatę do miski.
7. Pokrój pomidory w cząstki.
8. Pokrój ogórek w plastry.
9. Polej sałatkę 2 łyżkami oliwy i dopraw solą i pieprzem.
10. Rozgrzej masło na patelni.
11. Wbij 4 jajka na patelnię.
12. Smaż 3–4 min, aż białko się zetnie, a żółtko zostanie płynne.
13. Dopraw jajka solą i pieprzem.
14. Podawaj jajka z ciepłą bagietką i sałatką.

### Gofry z jajkiem sadzonym i boczkiem

*Ś, K · ⏱ 30 min · 👤 3 · łatwy · na ciepło · tagi: wytrawne, jajka, boczek, gofry*

**Składniki:**
- 6 gofrów wytrawnych (ciasto jak „Gofry klasyczne”, bez cukru, ze szczyptą soli)
- 6 jajek
- 6 plastrów boczku wędzonego (albo 6 plastrów szynki)
- 6 liści sałaty (np. rzymskiej)
- 2 pomidory
- majonez lub ketchup
- 1 łyżka oleju
- sól, pieprz

**Kroki:**
1. Upiecz gofry z ciasta bez cukru.
2. Rozgrzej patelnię bez tłuszczu.
3. Smaż boczek 3 min z każdej strony, aż będzie chrupiący (szynkę tylko podgrzej 1 min).
4. Odłóż boczek na ręcznik papierowy.
5. Umyj i osusz liście sałaty.
6. Pokrój pomidory w plastry.
7. Rozgrzej 1 łyżkę oleju na patelni.
8. Wbij jajka na patelnię.
9. Smaż jajka 3–4 min, aż białko się zetnie, a żółtko zostanie płynne.
10. Dopraw jajka solą i pieprzem.
11. Posmaruj gofry majonezem lub ketchupem.
12. Połóż na gofrach sałatę i pomidor.
13. Dodaj jajko sadzone.
14. Dodaj boczek lub szynkę i od razu podawaj.

### Parówki / frankfurterki

*Ś, K · ⏱ 10 min · 👤 2 · łatwy · na ciepło · tagi: szybkie, dla dzieci*

**Składniki:**
- 6 parówek lub 4 frankfurterki
- 4 kromki pieczywa lub 2 bułki
- ketchup
- musztarda
- ogórek kiszony (opcjonalnie)

**Kroki:**
1. Zagotuj wodę w garnku.
2. Zmniejsz ogień, żeby woda tylko lekko mrugała (we wrzątku parówki pękają).
3. Włóż parówki do wody.
4. Podgrzewaj 4–5 min (frankfurterki 6–8 min).
5. Wyjmij parówki łyżką cedzakową.
6. Podawaj z pieczywem, ketchupem i musztardą.

### Kanapki (z wariantami)

*Ś, K · ⏱ 10 min · 👤 2 · łatwy · na zimno · tagi: szybkie, bez gotowania*

**Składniki:**
- 6 kromek chleba lub 4 bułki
- 2 łyżki masła

**Kroki:**
1. Pokrój pieczywo na kromki (bułki przekrój).
2. Posmaruj kromki masłem.
3. Połóż dodatki wybranego wariantu.
4. Podawaj od razu.

**Warianty (do notatek przepisu):**
- z dżemem — dżem
- z wędliną — wędlina + pomidor lub ogórek
- z Almette — serek Almette zamiast masła + szczypiorek lub rzodkiewka
- z miodem — miód
- z masłem orzechowym — masło orzechowe zamiast masła + plasterki banana

### Pasta jajeczna

*Ś, K · ⏱ 20 min · 👤 2 · łatwy · na zimno · tagi: jajka, do kanapek, wegetariańskie*

**Składniki:**
- 4 jajka
- 2 łyżki majonezu
- 1 łyżeczka musztardy
- sól, pieprz
- 1 łyżka posiekanego szczypiorku lub natki (opcjonalnie)

**Kroki:**
1. Włóż jajka do garnka z zimną wodą.
2. Zagotuj wodę.
3. Gotuj jajka 9–10 min od zagotowania (na twardo).
4. Przełóż jajka do zimnej wody na 5 min.
5. Obierz jajka.
6. Zetrzyj jajka na tarce o grubych oczkach do miski.
7. Dodaj 2 łyżki majonezu.
8. Dodaj 1 łyżeczkę musztardy.
9. Dopraw solą i pieprzem.
10. Dodaj posiekany szczypiorek lub natkę.
11. Wymieszaj pastę widelcem.

### Oskarki

*Ś, K · ⏱ 15 min · 👤 2 · łatwy · na ciepło · tagi: kanapki na ciepło, opiekacz, szybkie*

**Składniki:**
- 2 ciabatty pszenne
- 8 plastrów salami
- 4 liście sałaty
- 1 pomidor
- 1 ogórek
- ½ cebuli
- 2 łyżki ketchupu
- 2 łyżki majonezu

**Kroki:**
1. Rozgrzej opiekacz.
2. Wymieszaj 2 łyżki ketchupu z 2 łyżkami majonezu.
3. Przekrój ciabatty wzdłuż.
4. Posmaruj obie połówki sosem.
5. Pokrój pomidor w plastry.
6. Pokrój ogórek w plastry.
7. Pokrój cebulę w cienkie piórka.
8. Połóż na dolnej połówce salami.
9. Dodaj sałatę.
10. Dodaj pomidor, ogórek i cebulę.
11. Przykryj górną połówką.
12. Podgrzewaj w opiekaczu 4–5 min, aż pieczywo będzie chrupiące.

### Spaghetti bolognese (domowe, z sosem ze słoika)

*O · ⏱ 40 min · 👤 4 · łatwy · na ciepło · tagi: makaron, mięso mielone, włoskie*

**Składniki:**
- 400 g makaronu spaghetti
- 500 g mięsa mielonego (wołowe lub wieprzowo-wołowe)
- 1 słoik sosu pomidorowego do spaghetti (ok. 500 g)
- 1 cebula
- 2 ząbki czosnku
- 2 łyżki oliwy lub oleju
- 1 łyżeczka oregano
- 1 łyżeczka bazylii suszonej
- ½ łyżeczki słodkiej papryki
- szczypta cukru (opcjonalnie)
- sól, pieprz
- tarty parmezan do podania

**Kroki:**
1. Posiekaj cebulę w kostkę.
2. Przeciśnij 2 ząbki czosnku.
3. Rozgrzej 2 łyżki oliwy na dużej patelni.
4. Zeszklij cebulę 3–4 min.
5. Dodaj czosnek i smaż 30 s.
6. Dodaj 500 g mięsa mielonego.
7. Smaż mięso na dużym ogniu 8–10 min, rozbijając łyżką, aż się zrumieni.
8. Dopraw mięso solą, pieprzem i ½ łyżeczki papryki.
9. Wlej sos ze słoika.
10. Dodaj 1 łyżeczkę oregano.
11. Dodaj 1 łyżeczkę bazylii.
12. Duś sos 15 min na małym ogniu, mieszając od czasu do czasu.
13. Spróbuj sosu i dopraw solą, pieprzem lub szczyptą cukru.
14. W międzyczasie zagotuj osoloną wodę w dużym garnku.
15. Ugotuj 400 g makaronu al dente według opakowania.
16. Odcedź makaron.
17. Podawaj makaron z sosem, posypany parmezanem.

### Pierogi (mrożone, z wariantami)

*O, K · ⏱ 20 min · 👤 4 · łatwy · na ciepło · tagi: pierogi, polskie, szybkie, gotowe*

**Składniki:**
- 1 kg mrożonych pierogów (ruskie / z mięsem / z serem)
- 1 łyżka soli do wody
- dodatki wg wariantu (niżej)

**Kroki:**
1. Zagotuj w dużym garnku ok. 3 l osolonej wody.
2. Wrzuć pierogi prosto z zamrażarki (nie rozmrażaj), partiami.
3. Zamieszaj delikatnie, żeby nie przywarły do dna.
4. Gotuj 3–5 min od wypłynięcia (czas z opakowania).
5. Wyjmij pierogi łyżką cedzakową.
6. Polej dodatkami wybranego wariantu i podawaj.

**Warianty (do notatek przepisu):**
- ruskie / z mięsem — z cebulką: 1 cebulę w kostkę zeszklij na 2 łyżkach masła (albo skwarki z 100 g boczku)
- z serem na słodko — z 200 g śmietany 18% i 1–2 łyżkami cukru (albo z roztopionym masłem i cukrem)
- odsmażane (każdy wariant) — ugotowane pierogi podsmaż na maśle 2–3 min z każdej strony

### Frytki z jajkiem sadzonym i fasolką / kalafiorem

*O · ⏱ 45 min · 👤 4 · łatwy · na ciepło · tagi: ziemniaki, jajka, wegetariańskie*

**Składniki:**
- 1 kg ziemniaków (lub mrożone frytki)
- 2 łyżki oleju
- 4 jajka
- 400 g fasolki szparagowej lub 1 kalafior
- 2 łyżki masła
- 2 łyżki bułki tartej (do kalafiora, opcjonalnie)
- sól

**Kroki:**
1. Rozgrzej piekarnik do 220°C.
2. Pokrój ziemniaki w słupki.
3. Wymieszaj ziemniaki z olejem i solą.
4. Piecz frytki 35–40 min, przewracając w połowie.
5. Zagotuj osoloną wodę.
6. Gotuj fasolkę 8–10 min (kalafior w różyczkach 10–12 min).
7. Odcedź warzywa.
8. Polej warzywa masłem (kalafior: masłem z bułką tartą).
9. Rozgrzej olej na patelni.
10. Usmaż 4 jajka sadzone, 3–4 min.
11. Podawaj frytki z jajkiem i warzywami.

### Prosta sałatka (sałata, pomidor, ogórek)

*K, O · ⏱ 10 min · 👤 4 · łatwy · na zimno · tagi: sałatka, wegetariańskie, szybkie, dodatek*

**Składniki:**
- 1 główka sałaty
- 2 pomidory
- 1 ogórek
- 2 łyżki oliwy
- sól, pieprz

**Kroki:**
1. Umyj i osusz sałatę.
2. Porwij sałatę do miski.
3. Pokrój pomidory w cząstki.
4. Pokrój ogórek w plastry.
5. Dodaj warzywa do sałaty.
6. Polej 2 łyżkami oliwy.
7. Dopraw solą i pieprzem.
8. Wymieszaj tuż przed podaniem.

### Tosty (sandwiche)

*K, Ś · ⏱ 10 min · 👤 2 · łatwy · na ciepło · tagi: szybkie, ser, szynka*

**Składniki:**
- 4 kromki chleba tostowego
- 4 plastry szynki
- 4 plastry sera żółtego
- 1 łyżka masła
- ketchup (opcjonalnie)

**Kroki:**
1. Rozgrzej opiekacz.
2. Posmaruj kromki masłem.
3. Połóż na 2 kromkach szynkę.
4. Połóż ser.
5. Przykryj pozostałymi kromkami.
6. Opiekaj 3–4 min do zrumienienia.
7. Podawaj z ketchupem.

### Ryba wędzona

*K · ⏱ 5 min · 👤 2 · łatwy · na zimno · tagi: ryby, bez gotowania*

**Składniki:**
- ryba wędzona (np. makrela, ok. 300 g)
- pieczywo
- masło
- cytryna
- cebula / ogórek kiszony (opcjonalnie)

**Kroki:**
1. Obierz rybę ze skóry i ości.
2. Pokrój cytrynę w cząstki.
3. Podawaj rybę z pieczywem, masłem i cytryną.

### Kiełbasa (na ciepło / z grilla)

*K, G · ⏱ 15 min · 👤 4 · łatwy · na ciepło · tagi: grill, szybkie*

**Składniki:**
- 4 kiełbasy (np. śląskie / na grill)
- pieczywo
- musztarda
- ketchup

**Kroki:**
1. Rozgrzej grill lub patelnię.
2. Natnij kiełbasy w kilku miejscach.
3. Grilluj/smaż 10–12 min, obracając.
4. Podawaj z pieczywem, musztardą i ketchupem.

### Skrzydełka z grilla (gotowe z Biedronki)

*G · ⏱ 30 min · 👤 4 · łatwy · na ciepło · tagi: grill, kurczak, gotowe*

**Składniki:**
- skrzydełka marynowane z Biedronki (1 opak.)

**Kroki:**
1. Rozgrzej grill.
2. Grilluj skrzydełka 20–25 min, często obracając, aż będą chrupiące.

### Bagietka z grilla (czosnkowa)

*G · ⏱ 10 min · 👤 4 · łatwy · na ciepło · tagi: grill, pieczywo*

**Składniki:**
- 1 bagietka
- 50 g masła
- 2 ząbki czosnku
- natka pietruszki

**Kroki:**
1. Rozgrzej grill.
2. Utrzyj miękkie masło z przeciśniętym czosnkiem i natką.
3. Natnij bagietkę w poprzek co 2 cm, nie do końca.
4. Posmaruj nacięcia masłem czosnkowym.
5. Zawiń bagietkę w folię aluminiową.
6. Grilluj 8–10 min, obracając.

## Proponowany sposób importu

1. ~~Decyzje~~ — ✅ uzgodnione (wyżej).
2. **Rozszerzenie importu o mikrodane schema.org** (aniagotuje.pl) — 31 przepisów zaimportuje się dokładnie i bez zużywania limitu AI (AI tylko rozbije kroki na atomowe, jak przy innych źródłach).
3. **Import hurtowy** — zamiast wklejać 50 linków po kolei w formularzu, mogę dodać prosty „import z listy linków” (wklejasz wiele URL-i naraz, przepisy trafiają do bazy, potem je przeglądasz/poprawiasz). Przy darmowym limicie Gemini rozłożyłbym to na 2–3 dni albo partie po ~15.
4. **Mini-przepisy ręczne** (13) — przygotuję je jako gotowe dane do wstawienia jednym ruchem.
5. **Thermomix (Cookidoo)** — ✅ obsłużone: import z linku oznacza przepis jako Thermomix (bez kroków).

> Zdjęcia w tabelach są wczytywane bezpośrednio ze stron źródłowych (te same adresy, które zapisze import). Jeśli podgląd ich nie pokazuje, otwórz plik w przeglądarce Markdown z dostępem do internetu (np. GitHub / VS Code).
