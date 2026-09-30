// Generuje kartę profilu żywieniowego domownika (doc/profil_zywieniowy_kontekst.md → "System Prompt dla Agenta AI").
// Wejście: { profileText } — profil jako czytelny tekst (src/lib/profile.js → profileToPromptText).
// Wyjście: { card } — obiekt karty; zapis do household_members.ai_profile_card robi frontend.

import { AiError, callGemini, corsHeaders, errorResponse, jsonResponse } from '../_shared/gemini.ts'

const SYSTEM_PROMPT = `Występujesz w roli doświadczonego dietetyka rodzinnego oraz eksperta ds. logistyki kuchennej.
Twoim zadaniem jest zarządzenie "mikroklimatem żywieniowym rodziny" poprzez stworzenie
uproszczonego, domowego Profilu Żywieniowego na podstawie dostarczonych odpowiedzi z ankiety.

Nie skupiasz się na odchudzaniu ani celach klinicznych, ale na tym, aby posiłki były:
- pełnowartościowe (dostarczały odpowiednich wartości w odpowiednich porach dnia)
- smaczne (zgodne z preferencjami i granicami tej osoby)
- łatwe do wdrożenia przez kucharza (szacunek dla czasu, sprzętu i budżetu)

Informacje wpisane swobodnie przez rodzinę ("Informacje od rodziny") mają TAKĄ SAMĄ wagę jak odpowiedzi z listy.
Bądź bezpośredni, praktyczny i pisz prostym, kuchennym językiem po polsku. Unikaj akademickiego żargonu medycznego.
Nie wymyślaj faktów, których nie ma w danych — jeśli czegoś brakuje, pomiń to.`

const OUTPUT_FORMAT = `Zwróć WYŁĄCZNIE obiekt JSON o strukturze:
{
  "goal": "Główny cel odżywczy — 1–2 zdania (np. uzupełnienie żelaza u dziecka wege)",
  "logistics": "Okno logistyczne — kiedy i gdzie podawać najważniejsze posiłki, 1–2 zdania",
  "loves": ["co lubi / pewniaki — krótkie hasła"],
  "avoids": ["czego unika lub nie może — krótkie hasła; twarde wykluczenia jako pierwsze"],
  "textures": "Tekstury i temperatury — 1 zdanie lub pusty string",
  "alerts": ["sygnały alarmowe: leki, alergie, historia żywieniowa wymagające uwagi; pusta tablica jeśli brak"],
  "tips": [{"title": "krótki tytuł", "text": "konkretna, życiowa wskazówka dla kucharza (1–3 zdania)"}],
  "planner_brief": "Streszczenie dla asystenta planującego menu, max 50 słów: najpierw twarde wykluczenia (alergie, dieta), potem najważniejsze preferencje i ograniczenia czasowe"
}
Pole "tips" ma zawierać od 3 do 5 wskazówek, m.in.: jak przemycić nielubiane składniki w ulubionych strukturach,
jak zrobić bazę posiłku (one-pot / meal prep) modyfikowalną pod całą rodzinę, jak ułatwić logistykę czasową,
jak dopasować strategię do sprzętu i budżetu.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { profileText } = await req.json()
    if (!profileText?.trim()) {
      return jsonResponse({ error: 'Brakuje danych profilu' }, 400)
    }

    const raw = await callGemini({
      systemInstruction: SYSTEM_PROMPT,
      prompt: `${OUTPUT_FORMAT}\n\n---\nOto dane wejściowe domownika:\n${profileText}`,
      temperature: 0.5,
      maxOutputTokens: 8192,
      thinkingBudget: 1024,
      json: true,
      timeoutMs: 60000,
    })

    const card = JSON.parse(raw)
    if (!card?.goal || !Array.isArray(card.tips)) {
      throw new AiError('AI zwróciło kartę w nieoczekiwanym formacie — spróbuj ponownie', 502)
    }

    return jsonResponse({ card })
  } catch (err) {
    return errorResponse(err, 'generate-profile-card')
  }
})
