// Generuje kartę profilu żywieniowego domownika (doc/profil_zywieniowy_kontekst.md → "System Prompt dla Agenta AI").
// Wejście: { profileText } — profil jako czytelny tekst (src/lib/profile.js → profileToPromptText).
// Wyjście: { card } — obiekt karty; zapis do household_members.ai_profile_card robi frontend.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
      return new Response(JSON.stringify({ error: 'Brakuje danych profilu' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) throw new Error('GEMINI_API_KEY nie jest skonfigurowany w Supabase secrets')

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{
            parts: [{ text: `${OUTPUT_FORMAT}\n\n---\nOto dane wejściowe domownika:\n${profileText}` }],
          }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 1024 },
          },
        }),
        signal: AbortSignal.timeout(60000),
      }
    )

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      throw new Error(`Gemini API error ${geminiRes.status}: ${errText.slice(0, 200)}`)
    }

    const geminiData = await geminiRes.json()
    const raw = (geminiData.candidates?.[0]?.content?.parts ?? [])
      .filter((p: { thought?: boolean }) => !p.thought)
      .map((p: { text?: string }) => p.text ?? '')
      .join('')
      .replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    const card = JSON.parse(raw)
    if (!card?.goal || !Array.isArray(card.tips)) {
      throw new Error('AI zwróciło kartę w nieoczekiwanym formacie')
    }

    return new Response(JSON.stringify({ card }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('generate-profile-card error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
