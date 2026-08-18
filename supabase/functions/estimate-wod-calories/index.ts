// supabase/functions/estimate-wod-calories/index.ts

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

type WodRequest = {
  nombre?: string
  descripcion?: string
  modalidad?: string
  modo_ranking?: string
}

type WodEstimate = {
  calorias_min: number
  calorias_max: number
  intensidad_estimada: "Moderada" | "Media" | "Alta" | "Extrema"
  duracion_estimada: string
  carga_metabolica: number
  cardio: number
  fuerza: number
  intensidad_score: number
  met_estimate: number | null
  scored_duration_seconds: number | null
  analysis_version: string
  calorias_nota: string
  tip: string
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    if (req.method !== "POST") {
      return json({ ok: false, error: "Método no permitido" }, 405)
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY")
    if (!apiKey) {
      return json({ ok: false, error: "Falta GEMINI_API_KEY en Supabase Secrets" }, 500)
    }

    const body = (await req.json()) as WodRequest

    const nombre = String(body.nombre || "").trim()
    const descripcion = String(body.descripcion || "").trim()
    const modalidad = String(body.modalidad || "single").trim()
    const modoRanking = String(body.modo_ranking || "sin_ranking").trim()

    if (!descripcion) {
      return json({ ok: false, error: "La descripción del WOD es obligatoria" }, 400)
    }

    const prompt = buildPrompt({
      nombre,
      descripcion,
      modalidad,
      modo_ranking: modoRanking,
    })

    const model = Deno.env.get("GEMINI_MODEL") || "gemini-3.1-flash-lite"

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.25,
            responseMimeType: "application/json",
          },
        }),
      }
    )

    const raw = await response.text()

    if (!response.ok) {
      return json(
        {
          ok: false,
          error: "Gemini no pudo estimar el WOD",
          detail: raw,
        },
        500
      )
    }

    const geminiData = JSON.parse(raw)
    const text =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ||
      ""

    const estimate = safeParseEstimate(text)

    return json({
      ok: true,
      estimate,
    })
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error inesperado",
      },
      500
    )
  }
})

function buildPrompt(input: Required<WodRequest>) {
  return `
Eres un analista deportivo especializado en CrossFit, fisiología del ejercicio y programación de WODs.

Analiza este WOD y estima calorías aproximadas para un adulto promedio entrenado de box de CrossFit.
NO des diagnóstico médico. NO prometas exactitud. Devuelve SOLO JSON válido.

Datos del WOD:
Nombre: ${input.nombre || "Sin nombre"}
Modalidad: ${input.modalidad}
Modo ranking: ${input.modo_ranking}
Descripción:
${input.descripcion}

Toma en cuenta:
- movimientos
- volumen total
- si hay carrera, remo, bike o burpees
- si es AMRAP, EMOM, For Time o tiempo fijo
- si es partner/duo/trio reduce gasto individual
- duración aproximada
- intensidad general
- carga metabólica
- componente cardio y fuerza
- densidad de trabajo y pausas previsibles
- un MET promedio representativo SOLO del segmento competitivo/registrado del WOD, no de toda una clase con calentamiento o cooldown
- para el MET, usa el patrón de movimientos, duración y densidad real del WOD; NO lo derives únicamente de la etiqueta Moderada/Media/Alta/Extrema

Devuelve EXACTAMENTE este JSON:
{
  "calorias_min": number,
  "calorias_max": number,
  "intensidad_estimada": "Moderada" | "Media" | "Alta" | "Extrema",
  "duracion_estimada": "string",
  "carga_metabolica": number,
  "cardio": number,
  "fuerza": number,
  "intensidad_score": number,
  "met_estimate": number,
  "scored_duration_seconds": number | null,
  "calorias_nota": "string",
  "tip": "string"
}

Reglas:
- cardio, fuerza, intensidad_score y carga_metabolica deben ser enteros de 0 a 100.
- met_estimate debe ser un número entre 3.5 y 12.0, con máximo 1 decimal.
- scored_duration_seconds representa SOLO la duración fija transcurrida del segmento que genera el resultado/score registrado, expresada como entero en segundos.
- Si modo_ranking es "menor_es_mejor", scored_duration_seconds debe ser null porque la duración depende del tiempo real de cada atleta.
- Para "mayor_es_mejor" o "sin_ranking", calcula scored_duration_seconds únicamente cuando la duración fija pueda deducirse con claridad del WOD.
- Incluye descansos programados que formen parte del mismo segmento puntuado.
- Ejemplo: AMRAP 10 min + Rest 5 min + AMRAP 10 min = 1500 segundos.
- Excluye calentamiento, Strength, Oly u otros bloques previos que no formen parte del resultado registrado.
- Ejemplo: Oly 10 min + Workout AMRAP 15 min = 900 segundos.
- Un bloque 00:00-05:00, 05:00-10:00 y 10:00-15:00 corresponde a 900 segundos.
- Si no es posible identificar con seguridad qué segmento genera el score o su duración exacta, scored_duration_seconds debe ser null.
- NO uses duracion_estimada para rellenar scored_duration_seconds.
- Como guía fisiológica, circuitos vigorosos pueden rondar 7.5 MET y HIFT puede abarcar aproximadamente 5.5 a 11.6 MET; ajusta dentro del rango permitido según los movimientos y la densidad del WOD.
- calorias_min y calorias_max deben ser enteros realistas.
- calorias_max debe ser mayor que calorias_min.
- calorias_nota debe explicar en 1 frase por qué estimaste ese rango.
- tip debe ser una recomendación breve para el coach o alumno.
`
}

function safeParseEstimate(text: string): WodEstimate {
  const cleaned = String(text || "")
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim()

  const parsed = JSON.parse(cleaned)

  const estimate: WodEstimate = {
    calorias_min: clampInt(parsed.calorias_min, 80, 2500),
    calorias_max: clampInt(parsed.calorias_max, 120, 3000),
    intensidad_estimada: normalizeIntensity(parsed.intensidad_estimada),
    duracion_estimada: String(parsed.duracion_estimada || "15-30 min"),
    carga_metabolica: clampInt(parsed.carga_metabolica, 0, 100),
    cardio: clampInt(parsed.cardio, 0, 100),
    fuerza: clampInt(parsed.fuerza, 0, 100),
    intensidad_score: clampInt(parsed.intensidad_score, 0, 100),
    met_estimate: parseMetEstimate(parsed.met_estimate),
    scored_duration_seconds: parseScoredDurationSeconds(
      parsed.scored_duration_seconds
    ),
    analysis_version: "pho3nix-wod-analysis-2.1",
    calorias_nota: String(
      parsed.calorias_nota ||
        "Estimación generada por IA según duración, volumen e intensidad del WOD."
    ),
    tip: String(parsed.tip || "Usa esta cifra como referencia aproximada, no como medición exacta."),
  }

  if (estimate.calorias_max <= estimate.calorias_min) {
    estimate.calorias_max = estimate.calorias_min + 80
  }

  return estimate
}

function parseMetEstimate(value: unknown) {
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  if (number < 3.5 || number > 12.0) return null
  return Math.round(number * 10) / 10
}

function parseScoredDurationSeconds(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const number = Number(value)

  if (!Number.isFinite(number)) return null
  if (!Number.isInteger(number)) return null

  // Defensive range: 30 seconds to 2 hours.
  if (number < 30 || number > 7200) return null

  return number
}

function normalizeIntensity(value: unknown): WodEstimate["intensidad_estimada"] {
  const text = String(value || "").toLowerCase()
  if (text.includes("extrema")) return "Extrema"
  if (text.includes("alta")) return "Alta"
  if (text.includes("media")) return "Media"
  return "Moderada"
}

function clampInt(value: unknown, min: number, max: number) {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, n))
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}
