const PDA_TIME_ZONE = "America/Guayaquil"

function getDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: PDA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  const parts = formatter.formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    iso: `${values.year}-${values.month}-${values.day}`,
  }
}

export function getPdaSeasonYear(date = new Date()) {
  return getDateParts(date).year
}

export function isPdaSeasonVisible(date = new Date()) {
  if (import.meta.env.DEV && String(import.meta.env.VITE_PDA_FORCE_VISIBLE) === "true") {
    return true
  }

  const { month, day } = getDateParts(date)
  return month === 12 || (month === 11 && day >= 15)
}

export function isPdaResultDay(wodDate, date = new Date()) {
  if (!wodDate) return false
  return wodDate === getDateParts(date).iso
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
