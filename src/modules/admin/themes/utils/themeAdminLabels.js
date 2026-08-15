const THEME_LABELS = {
  phoenix: "PHOENIX",
  new_year: "Año Nuevo",
  valentines_day: "San Valentín",
  carnival: "Carnaval",
  international_womens_day:
    "Día Internacional de la Mujer",
  good_friday: "Viernes Santo",
  labor_day: "Día del Trabajo",
  mothers_day: "Día de la Madre",
  battle_of_pichincha:
    "Batalla de Pichincha",
  childrens_day: "Día del Niño",
  fathers_day: "Día del Padre",
  guayaquil_foundation:
    "Fundación de Guayaquil",
  first_cry_of_independence:
    "Primer Grito de Independencia",
  flag_day: "Día de la Bandera",
  guayaquil_independence:
    "Independencia de Guayaquil",
  halloween: "Halloween",
  all_souls_day:
    "Día de los Difuntos",
  cuenca_independence:
    "Independencia de Cuenca",
  quito_foundation:
    "Fundación de Quito",
  christmas: "Navidad",
  year_end: "Fin de Año",
}

export function getThemeLabel(
  themeKey
) {
  const key =
    String(
      themeKey || ""
    )
      .trim()
      .toLowerCase()

  return (
    THEME_LABELS[key] ||
    key ||
    "PHOENIX"
  )
}

export function describeThemeRule(
  rule
) {
  if (!rule) return "—"

  if (
    rule.type ===
    "annual_datetime_range"
  ) {
    return (
      `${pad(rule.startDay)}/${pad(rule.startMonth)} ` +
      `${pad(rule.startHour)}:${pad(rule.startMinute)} → ` +
      `${pad(rule.endDay)}/${pad(rule.endMonth)} ` +
      `${pad(rule.endHour)}:${pad(rule.endMinute)}`
    )
  }

  if (
    rule.type === "annual_date"
  ) {
    return (
      `${pad(rule.day)}/${pad(rule.month)} ` +
      "00:00 → 23:59"
    )
  }

  if (
    rule.type === "annual_range"
  ) {
    return (
      `${pad(rule.startDay)}/${pad(rule.startMonth)} 00:00 → ` +
      `${pad(rule.endDay)}/${pad(rule.endMonth)} 23:59`
    )
  }

  if (
    rule.type ===
    "easter_offset_range"
  ) {
    return (
      `Pascua ${signed(rule.startOffsetDays)} días → ` +
      `Pascua ${signed(rule.endOffsetDays)} días`
    )
  }

  if (
    rule.type ===
    "easter_offset"
  ) {
    return (
      `Pascua ${signed(rule.offsetDays)} días`
    )
  }

  if (
    rule.type ===
    "nth_weekday_of_month"
  ) {
    return (
      `${ordinal(rule.occurrence)} domingo de ` +
      monthName(rule.month) +
      " 00:00 → 23:59"
    )
  }

  return rule.type || "Regla"
}

function pad(value) {
  return String(
    Number(value || 0)
  ).padStart(2, "0")
}

function signed(value) {
  const number =
    Number(value || 0)

  return number >= 0
    ? `+${number}`
    : String(number)
}

function ordinal(value) {
  const number =
    Number(value || 1)

  if (number === 2) return "2.º"
  if (number === 3) return "3.er"

  return `${number}.º`
}

function monthName(value) {
  const months = [
    "",
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ]

  return (
    months[
      Number(value || 0)
    ] || "mes"
  )
}
