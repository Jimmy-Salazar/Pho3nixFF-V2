import { formatProfileDate } from "../utils/studentProfileUtils.js"

export default function StudentProfileStats({ copy, stats, locale }) {
  const cards = [
    { key: "total", icon: "🏆", label: copy.registeredPrs, value: stats.total, helper: copy.personalInfoSubtitle },
    { key: "latest", icon: "🕒", label: copy.latestPr, value: stats.latestPr?.peso_libras ? `${stats.latestPr.peso_libras} lb` : "—", helper: stats.latestPr ? `${stats.latestPr.ejercicio_nombre} · ${formatProfileDate(stats.latestPr.fecha, locale)}` : copy.noPrs },
    { key: "best", icon: "⭐", label: copy.bestPr, value: stats.bestGeneral?.peso_libras ? `${stats.bestGeneral.peso_libras} lb` : "—", helper: stats.bestGeneral?.ejercicio_nombre || copy.noPrs },
    { key: "strong", icon: "💪", label: copy.strongestExercise, value: stats.strongestExercise?.ejercicio_nombre || "—", helper: stats.strongestExercise?.peso_libras ? `${stats.strongestExercise.peso_libras} lb` : copy.noPrs },
  ]

  return (
    <section className="student-profile-stats" aria-label={copy.statsTitle}>
      {cards.map((card) => (
        <article key={card.key}>
          <span>{card.icon}</span>
          <div><small>{card.label}</small><strong>{card.value}</strong><p>{card.helper}</p></div>
        </article>
      ))}
    </section>
  )
}
