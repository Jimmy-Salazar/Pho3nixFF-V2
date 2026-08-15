const PDA_TIME_ZONE = "America/Guayaquil"

function getDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PDA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  const parts = formatter.formatToParts(date)
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  )

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    iso: `${values.year}-${values.month}-${values.day}`,
  }
}

export function getPdaSeasonYear(date = new Date()) {
  const { year, month, day } = getDateParts(date)

  // January 1–5 still belong to the PDA edition that began
  // on November 15 of the previous calendar year.
  if (month === 1 && day <= 5) return year - 1

  return year
}

export function isPdaSeasonVisible(date = new Date()) {
  /*
   * Explicit DEV preview only.
   * This can never affect a production build because import.meta.env.DEV
   * is false in production.
   */
  if (
    import.meta.env.DEV &&
    String(import.meta.env.VITE_PDA_FORCE_VISIBLE || "").toLowerCase() === "true"
  ) {
    return true
  }

  const { month, day } = getDateParts(date)

  // Final PHO3NIX production window:
  // visible Nov 15 through Jan 5.
  // hidden Jan 6 through Nov 14.
  if (month === 11) return day >= 15
  if (month === 12) return true
  if (month === 1) return day <= 5

  return false
}

export function isPdaResultDay(wodDate, date = new Date()) {
  if (!wodDate) return false
  return String(wodDate).slice(0, 10) === getDateParts(date).iso
}

export function getPdaTodayIso(date = new Date()) {
  return getDateParts(date).iso
}

export function getPdaPosterPath(year) {
  return `/images/pda/pda-${year}.png`
}

export function getPdaPosterFallbackPath() {
  return "/images/pda/pda-coming-soon.png"
}

export { PDA_TIME_ZONE }
