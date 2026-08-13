import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const ANALYSIS_FIELDS = [
  "resumen",
  "diagnostico",
  "nutricion",
  "entrenamiento",
  "pre_wod",
  "post_wod",
  "hidratacion",
  "descanso",
  "alerta",
] as const

type Locale = "es" | "en"
type AnalysisTranslation = Record<(typeof ANALYSIS_FIELDS)[number], string>

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  })
}

function normalizeLocale(value: unknown): Locale | null {
  if (value === "es" || value === "en") return value
  return null
}

function extractFields(row: Record<string, unknown>): AnalysisTranslation {
  return Object.fromEntries(
    ANALYSIS_FIELDS.map((field) => [field, String(row?.[field] || "")])
  ) as AnalysisTranslation
}

function isCompleteTranslation(value: unknown): value is AnalysisTranslation {
  if (!value || typeof value !== "object") return false
  const objectValue = value as Record<string, unknown>
  return ANALYSIS_FIELDS.every((field) => typeof objectValue[field] === "string")
}

function detectSourceLocale(row: Record<string, any>): Locale {
  const explicit = row?.respuesta_json?.source_locale
  if (explicit === "es" || explicit === "en") return explicit

  const payloadLanguage = String(
    row?.respuesta_json?.payload_ia?.reglas?.idioma || ""
  ).toLowerCase()

  if (payloadLanguage.includes("english") || payloadLanguage.includes("inglés")) {
    return "en"
  }

  if (payloadLanguage.includes("spanish") || payloadLanguage.includes("español")) {
    return "es"
  }

  // Compatibilidad con los análisis históricos de V1.
  return "es"
}

function stripJsonFence(value: string) {
  return value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
}

async function translateWithGemini(
  source: AnalysisTranslation,
  sourceLocale: Locale,
  targetLocale: Locale,
): Promise<AnalysisTranslation> {
  const apiKey = Deno.env.get("GEMINI_API_KEY")
  const model =
    Deno.env.get("GEMINI_TRANSLATION_MODEL")
    || "gemini-3.5-flash-lite"

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada.")
  }

  const sourceLanguage = sourceLocale === "en" ? "English" : "Spanish"
  const targetLanguage = targetLocale === "en" ? "English" : "Spanish"

  console.log("Nutrition translation model", {
    model,
    sourceLocale,
    targetLocale,
  })

  const prompt = [
    `Translate the JSON values from ${sourceLanguage} to ${targetLanguage}.`,
    "Return only a valid JSON object with exactly the same keys.",
    "Do not add, remove, summarize, reinterpret or soften information.",
    "Preserve all numbers, units, CrossFit terminology, WOD, PR, exercise names and safety warnings.",
    "Use natural professional sports-nutrition language.",
    "",
    JSON.stringify(source),
  ].join("\n")

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    },
  )

  const body = await response.json()

  if (!response.ok) {
    const message = body?.error?.message || "Gemini translation request failed."
    throw new Error(message)
  }

  const rawText = body?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!rawText) {
    throw new Error("Gemini no devolvió una traducción.")
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(stripJsonFence(rawText))
  } catch {
    throw new Error("Gemini devolvió un JSON de traducción inválido.")
  }

  if (!isCompleteTranslation(parsed)) {
    throw new Error("La respuesta traducida está incompleta.")
  }

  return parsed
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Método no permitido." }, 405)
  }

  try {
    const authorization = request.headers.get("Authorization")

    if (!authorization) {
      return jsonResponse({ error: "Sesión no encontrada." }, 401)
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const publicKey =
      Deno.env.get("SUPABASE_ANON_KEY")
      || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")
    const secretKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      || Deno.env.get("SUPABASE_SECRET_KEY")

    if (!supabaseUrl || !publicKey || !secretKey) {
      throw new Error("Faltan variables internas de Supabase.")
    }

    const userClient = createClient(supabaseUrl, publicKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return jsonResponse({ error: "Sesión inválida." }, 401)
    }

    const payload = await request.json()
    const analysisId = String(payload?.analysis_id || "").trim()
    const targetLocale = normalizeLocale(payload?.target_locale)

    if (!analysisId) {
      return jsonResponse({ error: "analysis_id es obligatorio." }, 400)
    }

    if (!targetLocale) {
      return jsonResponse({ error: "target_locale debe ser es o en." }, 400)
    }

    const adminClient = createClient(supabaseUrl, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { data: analysis, error: analysisError } = await adminClient
      .from("nutricion_analisis")
      .select("*")
      .eq("id", analysisId)
      .eq("usuario_id", user.id)
      .maybeSingle()

    if (analysisError) throw analysisError

    if (!analysis) {
      return jsonResponse({ error: "Análisis no encontrado." }, 404)
    }

    const responseJson = analysis.respuesta_json || {}
    const cached = responseJson?.translations?.[targetLocale]

    if (isCompleteTranslation(cached)) {
      return jsonResponse({
        translation: cached,
        source_locale: detectSourceLocale(analysis),
        target_locale: targetLocale,
        cached: true,
        respuesta_json: responseJson,
      })
    }

    const sourceLocale = detectSourceLocale(analysis)
    const original = extractFields(analysis)

    if (sourceLocale === targetLocale) {
      return jsonResponse({
        translation: original,
        source_locale: sourceLocale,
        target_locale: targetLocale,
        cached: true,
        respuesta_json: responseJson,
      })
    }

    const translation = await translateWithGemini(
      original,
      sourceLocale,
      targetLocale,
    )

    const nextResponseJson = {
      ...responseJson,
      source_locale: sourceLocale,
      translations: {
        ...(responseJson?.translations || {}),
        [sourceLocale]: isCompleteTranslation(
          responseJson?.translations?.[sourceLocale],
        )
          ? responseJson.translations[sourceLocale]
          : original,
        [targetLocale]: translation,
      },
    }

    const { error: updateError } = await adminClient
      .from("nutricion_analisis")
      .update({ respuesta_json: nextResponseJson })
      .eq("id", analysis.id)
      .eq("usuario_id", user.id)

    if (updateError) throw updateError

    return jsonResponse({
      translation,
      source_locale: sourceLocale,
      target_locale: targetLocale,
      cached: false,
      respuesta_json: nextResponseJson,
    })
  } catch (error) {
    console.error("traducir-analisis-nutricion:", error)

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo traducir el análisis.",
      },
      500,
    )
  }
})
