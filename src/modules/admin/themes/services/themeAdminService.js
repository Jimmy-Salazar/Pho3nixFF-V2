import {
  fetchThemeRuntimeSnapshot,
  getDefaultThemeRuntimeConfig,
  subscribeThemeRuntimeChanges,
} from "../../../../theme/themeRuntimeService.js"

import {
  resolveRuntimeThemeSelection,
} from "../../../../shared/theme/themeRuntimeResolver.js"

import {
  findNextThemeTransition,
} from "../../../../shared/theme/themeTimeline.js"

import {
  THEME_KEYS,
} from "../../../../shared/theme/themeRegistry.js"

import {
  getDateTimeKeyInTimeZone,
} from "../../../../theme/themeCalendar.js"

const DEFAULT_THEME_KEY = "phoenix"

export async function getThemeAdminOverview() {
  const snapshot =
    await fetchThemeRuntimeSnapshot()

  const runtimeConfig = {
    ...getDefaultThemeRuntimeConfig(),
    ...(snapshot?.runtimeConfig || {}),

    // Production authority:
    mode: "auto",
    manualThemeKey: null,
  }

  const calendarEntries =
    snapshot?.calendarEntries || []

  const timeZone =
    runtimeConfig.timeZone ||
    "America/Guayaquil"

  const dateTimeKey =
    getDateTimeKeyInTimeZone(
      new Date(),
      timeZone
    )

  const currentSelection =
    resolveRuntimeThemeSelection({
      dateTimeKey,
      runtimeConfig,
      calendarEntries,
      availableThemeKeys:
        THEME_KEYS,
      defaultThemeKey:
        DEFAULT_THEME_KEY,
    })

  const nextTransition =
    findNextThemeTransition({
      startDate: new Date(),
      timeZone,
      calendarEntries,
      availableThemeKeys:
        THEME_KEYS,
      defaultThemeKey:
        DEFAULT_THEME_KEY,
      toDateTimeKey:
        (date) =>
          getDateTimeKeyInTimeZone(
            date,
            timeZone
          ),
    })

  return {
    ...snapshot,
    runtimeConfig,
    calendarEntries,
    currentSelection,
    nextTransition,
    themeKeys:
      THEME_KEYS,
  }
}

export function subscribeThemeAdminChanges(
  onChange
) {
  return subscribeThemeRuntimeChanges(
    onChange
  )
}
