import { useState } from "react"

import StudentWodsListSection from "./StudentWodsListSection.jsx"
import { groupWodsByYearAndMonth } from "../utils/studentWodsUtils.js"

export default function StudentWodsArchivedSection({
  copy,
  rows = [],
  locale,
  onView,
  onEdit,
  onRegister,
  onRanking,
}) {
  const groups = groupWodsByYearAndMonth(rows, locale)
  const [openGroupKey, setOpenGroupKey] = useState(groups[0]?.key || "")

  if (groups.length === 0) {
    return (
      <article className="student-wods-card student-wods-archive-shell">
        <header className="student-wods-panel-header">
          <div>
            <p>{copy.archivedSubtitle}</p>
            <h2>{copy.archivedWods}</h2>
          </div>
          <span>0</span>
        </header>

        <div className="student-wods-empty">{copy.noArchivedWods}</div>
      </article>
    )
  }

  return (
    <article className="student-wods-card student-wods-archive-shell">
      <header className="student-wods-panel-header">
        <div>
          <p>{copy.archivedSubtitle}</p>
          <h2>{copy.archivedWods}</h2>
        </div>
        <span>{rows.length}</span>
      </header>

      <div className="student-wods-accordion">
        {groups.map((group) => {
          const isOpen = group.key === openGroupKey

          return (
            <section
              key={group.key}
              className={`student-wods-accordion-item ${isOpen ? "is-open" : ""}`}
            >
              <button
                type="button"
                className="student-wods-accordion-trigger"
                onClick={() => setOpenGroupKey(isOpen ? "" : group.key)}
                aria-expanded={isOpen}
              >
                <span>
                  <strong>{group.title}</strong>
                  <small>{group.rows.length} WODs</small>
                </span>

                <b>{isOpen ? "−" : "+"}</b>
              </button>

              {isOpen ? (
                <div className="student-wods-accordion-content">
                  <StudentWodsListSection
                    copy={copy}
                    title={group.title}
                    subtitle={copy.archivedWods}
                    rows={group.rows}
                    locale={locale}
                    emptyText={copy.noArchivedWods}
                    onView={onView}
                    onEdit={onEdit}
                    onRegister={onRegister}
                    onRanking={onRanking}
                  />
                </div>
              ) : null}
            </section>
          )
        })}
      </div>
    </article>
  )
}
