import { useMemo, useState } from "react"

import { getStudentPdaPoster } from "../i18n/studentPdaCopy.js"

export default function StudentPdaComingSoon({ copy, locale, year }) {
  const localizedPoster = useMemo(() => getStudentPdaPoster(locale, year), [locale, year])
  const [failed, setFailed] = useState(false)
  const src = failed ? "/images/pda/pda-2026-es.png" : localizedPoster

  return (
    <section className="student-pda-coming">
      <div className="student-pda-poster-frame">
        <img
          key={localizedPoster}
          src={src}
          alt={copy.posterAlt}
          onError={() => setFailed(true)}
        />
      </div>

      <div className="student-pda-coming-copy">
        <span>{copy.comingSoon}</span>
        <h2>PDA {year}</h2>
        <p>{copy.comingSoonText}</p>
      </div>
    </section>
  )
}
