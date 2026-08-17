
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const MAX_ANALYSIS_TEXT_LENGTH = 3000
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

  return ANALYSIS_FIELDS.every((field) => {
    const text = objectValue[field]
    return typeof text === "string"
      && text.trim().length > 0
      && text.length <= MAX_ANALYSIS_TEXT_LENGTH
  })
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
    throw new Error("AI_CONFIGURATION_ERROR")
  }

  const sourceLanguage = sourceLocale === "en" ? "English" : "Spanish"
  const targetLanguage = targetLocale === "en" ? "English" : "Spanish"

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
    console.error("Gemini nutrition translation failed", {
      status: response.status,
      model,
      error: body?.error?.message || "unknown",
    })
    throw new Error("AI_PROVIDER_ERROR")
  }

  const rawText = body?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText) throw new Error("INVALID_TRANSLATION_RESPONSE")

  let parsed: unknown

  try {
    parsed = JSON.parse(stripJsonFence(String(rawText)))
  } catch {
    throw new Error("INVALID_TRANSLATION_RESPONSE")
  }

  if (!isCompleteTranslation(parsed)) {
    throw new Error("INVALID_TRANSLATION_RESPONSE")
  }

  return parsed
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "METHOD_NOT_ALLOWED" }, 405)
  }

  try {
    const authorization = request.headers.get("Authorization")

    if (!authorization) {
      return jsonResponse({ error: "NO_AUTH_USER" }, 401)
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const publicKey =
      Deno.env.get("SUPABASE_ANON_KEY")
      || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")

    if (!supabaseUrl || !publicKey) {
      throw new Error("SERVER_CONFIGURATION_ERROR")
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
      return jsonResponse({ error: "NO_AUTH_USER" }, 401)
    }

    const payload = await request.json().catch(() => ({}))
    const analysisId = String(payload?.analysis_id || "").trim()
    const targetLocale = normalizeLocale(payload?.target_locale)

    if (!analysisId) {
      return jsonResponse({ error: "INVALID_ANALYSIS_ID" }, 400)
    }

    if (!targetLocale) {
      return jsonResponse({ error: "INVALID_TARGET_LOCALE" }, 400)
    }

    const { data: analysis, error: analysisError } = await userClient
      .from("nutricion_analisis")
      .select("id,usuario_id,resumen,diagnostico,nutricion,entrenamiento,pre_wod,post_wod,hidratacion,descanso,alerta,respuesta_json")
      .eq("id", analysisId)
      .eq("usuario_id", user.id)
      .maybeSingle()

    if (analysisError) throw analysisError

    if (!analysis) {
      return jsonResponse({ error: "ANALYSIS_NOT_FOUND" }, 404)
    }

    const responseJson = analysis.respuesta_json || {}
    const cached = responseJson?.translations?.[targetLocale]
    const sourceLocale = detectSourceLocale(analysis)

    if (isCompleteTranslation(cached)) {
      return jsonResponse({
        translation: cached,
        source_locale: sourceLocale,
        target_locale: targetLocale,
        cached: true,
      })
    }

    const original = extractFields(analysis)

    if (!isCompleteTranslation(original)) {
      return jsonResponse({ error: "INVALID_SOURCE_ANALYSIS" }, 422)
    }

    if (sourceLocale === targetLocale) {
      return jsonResponse({
        translation: original,
        source_locale: sourceLocale,
        target_locale: targetLocale,
        cached: true,
      })
    }

    const translation = await translateWithGemini(
      original,
      sourceLocale,
      targetLocale,
    )

    const secretKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      || Deno.env.get("SUPABASE_SECRET_KEY")

    if (!secretKey) {
      throw new Error("SERVER_CONFIGURATION_ERROR")
    }

    const adminClient = createClient(supabaseUrl, secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { data: merged, error: mergeError } = await adminClient.rpc(
      "merge_nutrition_analysis_translation",
      {
        p_analysis_id: analysis.id,
        p_usuario_id: user.id,
        p_source_locale: sourceLocale,
        p_target_locale: targetLocale,
        p_source: original,
        p_translation: translation,
      },
    )

    if (mergeError) throw mergeError
    if (merged !== true) {
      return jsonResponse({ error: "ANALYSIS_NOT_FOUND" }, 404)
    }

    return jsonResponse({
      translation,
      source_locale: sourceLocale,
      target_locale: targetLocale,
      cached: false,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || "")

    if (
      message === "AI_PROVIDER_ERROR"
      || message === "AI_CONFIGURATION_ERROR"
      || message === "INVALID_TRANSLATION_RESPONSE"
    ) {
      return jsonResponse({ error: message }, 502)
    }

    if (message === "SERVER_CONFIGURATION_ERROR") {
      return jsonResponse({ error: message }, 500)
    }

    console.error("traducir-analisis-nutricion:", error)
    return jsonResponse({ error: "TRANSLATION_FAILED" }, 500)
  }
})
