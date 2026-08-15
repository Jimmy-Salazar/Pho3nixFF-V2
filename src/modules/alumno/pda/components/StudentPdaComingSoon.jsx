import { useMemo, useState } from "react"

import {
  getPdaPosterFallbackPath,
  getPdaPosterPath,
  getPdaSeasonYear,
} from "../utils/pdaVisibility.js"

import "../../../../styles/studentPdaComingSoon.css"

export default function StudentPdaComingSoon({ locale = "es" }) {
  const year = useMemo(() => getPdaSeasonYear(), [])
  const fallback = getPdaPosterFallbackPath()
  const [posterSrc, setPosterSrc] = useState(getPdaPosterPath(year))

  const isEnglish = String(locale || "").toLowerCase().startsWith("en")

  return (
    <section className="student-pda-coming-soon">
      <div className="student-pda-coming-soon__poster">
        <img
          src={posterSrc}
          alt={
            isEnglish
              ? `PHO3NIX PDA ${year} announcement`
              : `Afiche PHO3NIX PDA ${year}`
          }
          onError={() => {
            if (posterSrc !== fallback) setPosterSrc(fallback)
          }}
        />
      </div>

      <div className="student-pda-coming-soon__copy">
        <span>PDA {year}</span>
        <h2>{isEnglish ? "Coming soon" : "Próximamente"}</h2>
        <p>
          {isEnglish
            ? "The official PDA edition has not been published yet."
            : "La edición oficial del PDA todavía no ha sido publicada."}
        </p>
      </div>
    </section>
  )
}
