// Wspólne wywołanie Gemini dla Edge Functions.
// - 429/503 z krótkim czasem oczekiwania → jedna ponowna próba na tym samym modelu
// - wyczerpany DZIENNY limit modelu → przejście na model zapasowy (limity są liczone per model)
// - błędy zamienia na AiError z kodem HTTP i komunikatem po polsku dla użytkownika

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite']
const MAX_AUTO_RETRY_WAIT_S = 8

export class AiError extends Error {
  status: number
  retryAfter?: number
  quota?: string
  constructor(message: string, status = 500, retryAfter?: number, quota?: string) {
    super(message)
    this.status = status
    this.retryAfter = retryAfter
    this.quota = quota
  }
}

type GeminiRequest = {
  prompt: string
  systemInstruction?: string
  temperature?: number
  maxOutputTokens?: number
  thinkingBudget?: number
  json?: boolean
  timeoutMs?: number
}

// Czas oczekiwania z odpowiedzi 429 (details[].retryDelay, np. "23s")
function parseRetryDelay(body: string): number | undefined {
  const m = body.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/)
  return m ? Math.ceil(parseFloat(m[1])) : undefined
}

// Nazwa przekroczonego limitu, np. GenerateRequestsPerDayPerProjectPerModel-FreeTier
function parseQuotaId(body: string): string | undefined {
  return body.match(/"quotaId"\s*:\s*"([^"]+)"/)?.[1]
}

function quotaError(retryAfter?: number, quota?: string) {
  if (quota?.includes('PerDay')) {
    return new AiError(
      'Wyczerpano dzienny limit zapytań do AI (darmowy plan Gemini). Limit odnawia się ok. 9:00 rano.',
      429, undefined, quota,
    )
  }
  return new AiError(
    retryAfter && retryAfter < 120
      ? `Asystent AI jest chwilowo zajęty (limit darmowego planu Gemini). Spróbuj ponownie za ok. ${retryAfter} s.`
      : 'Asystent AI jest chwilowo zajęty (limit darmowego planu Gemini). Spróbuj ponownie za chwilę.',
    429, retryAfter, quota,
  )
}

function request(model: string, req: GeminiRequest, key: string) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(req.systemInstruction && { systemInstruction: { parts: [{ text: req.systemInstruction }] } }),
        contents: [{ parts: [{ text: req.prompt }] }],
        generationConfig: {
          temperature: req.temperature ?? 0.7,
          maxOutputTokens: req.maxOutputTokens ?? 2048,
          ...(req.json && { responseMimeType: 'application/json' }),
          thinkingConfig: { thinkingBudget: req.thinkingBudget ?? 0 },
        },
      }),
      signal: AbortSignal.timeout(req.timeoutMs ?? 45000),
    },
  )
}

type Attempt =
  | { ok: true; text: string }
  | { ok: false; dailyQuota: boolean; error: AiError }

// Jedno podejście do modelu (z ewentualną jedną ponowną próbą po krótkim czekaniu)
async function tryModel(model: string, req: GeminiRequest, key: string): Promise<Attempt> {
  let res = await request(model, req, key)

  for (let attempt = 0; attempt < 2 && (res.status === 429 || res.status === 503); attempt++) {
    const body = await res.text()
    const quota = parseQuotaId(body)
    const wait = parseRetryDelay(body) ?? 2
    console.warn(`[${model}] Gemini ${res.status}, quota=${quota ?? '?'}, retryDelay=${wait}s`)

    if (res.status === 429 && quota?.includes('PerDay')) {
      return { ok: false, dailyQuota: true, error: quotaError(wait, quota) }
    }
    if (attempt === 1 || wait > MAX_AUTO_RETRY_WAIT_S) {
      const error = res.status === 429
        ? quotaError(wait, quota)
        : new AiError('Asystent AI jest przeciążony. Spróbuj ponownie za chwilę.', 503)
      return { ok: false, dailyQuota: false, error }
    }
    await new Promise(r => setTimeout(r, wait * 1000 + 300))
    res = await request(model, req, key)
  }

  if (!res.ok) {
    console.error(`[${model}] Gemini API error ${res.status}:`, (await res.text()).slice(0, 1000))
    return { ok: false, dailyQuota: false, error: new AiError(`Błąd asystenta AI (${res.status}). Spróbuj ponownie.`, 502) }
  }

  const data = await res.json()
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .filter((p: { thought?: boolean }) => !p.thought)
    .map((p: { text?: string }) => p.text ?? '')
    .join('')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
  return { ok: true, text }
}

// Zwraca tekst odpowiedzi modelu (bez bloków ```json i bez „myśli”)
export async function callGemini(req: GeminiRequest): Promise<string> {
  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) throw new AiError('GEMINI_API_KEY nie jest skonfigurowany w Supabase secrets')

  let last: AiError | undefined
  for (const model of MODELS) {
    const result = await tryModel(model, req, key)
    if (result.ok) return result.text
    last = result.error
    if (!result.dailyQuota) break   // model zapasowy tylko przy wyczerpanym limicie dziennym
  }
  throw last ?? new AiError('Nieznany błąd asystenta AI', 502)
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function errorResponse(err: unknown, fnName: string) {
  console.error(`${fnName} error:`, err)
  if (err instanceof AiError) {
    return jsonResponse({ error: err.message, retryAfter: err.retryAfter, quota: err.quota }, err.status)
  }
  return jsonResponse({ error: (err as Error).message || 'Nieznany błąd' }, 500)
}
