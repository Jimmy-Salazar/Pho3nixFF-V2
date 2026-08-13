import EmptyState from "./EmptyState.jsx"

export default function AnnouncementsList({ copy, items }) {
  if (!items.length) {
    return <EmptyState text={copy.noAnnouncements} />
  }

  return (
    <div className="student-list">
      {items.map((item) => (
        <article key={item.id}>
          {item.media_url && item.media_tipo !== "video" ? (
            <img src={item.media_url} alt={item.titulo || "PHO3NIX"} />
          ) : (
            <span>📣</span>
          )}
          <div>
            <strong>{item.titulo || "PHO3NIX"}</strong>
            <p>{item.resumen || item.contenido || copy.announcements}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
