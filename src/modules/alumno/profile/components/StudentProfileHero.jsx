import { useRef } from "react"

export default function StudentProfileHero({ copy, profile, initials, membership, stats, uploading, onUpload }) {
  const inputRef = useRef(null)

  function handleChange(event) {
    const file = event.target.files?.[0]
    if (file) onUpload(file)
    event.target.value = ""
  }

  return (
    <article className="student-profile-hero-card">
      <div className="student-profile-hero-glow" />

      <div className="student-profile-avatar-wrap">
        {profile?.foto_url ? (
          <img className="student-profile-avatar-image" src={profile.foto_url} alt={profile?.nombre || copy.athlete} />
        ) : (
          <div className="student-profile-avatar-fallback">{initials}</div>
        )}

        <button
          type="button"
          className="student-profile-camera-button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label={copy.changePhoto}
        >
          {uploading ? "…" : "📷"}
        </button>

        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleChange} />
      </div>

      <div className="student-profile-hero-copy">
        <p>{copy.athlete}</p>
        <h1>{profile?.nombre || copy.athlete}</h1>
        <span>{profile?.email || copy.noValue}</span>

        <div className={`student-profile-status is-${membership.status}`}>
          <i />
          <strong>{membership.title}</strong>
          <small>{membership.subtitle}</small>
        </div>
      </div>

      <div className="student-profile-hero-stats">
        <div><strong>{stats.total}</strong><small>{copy.registeredPrs}</small></div>
        <div><strong>{stats.bestGeneral?.peso_libras ? `${stats.bestGeneral.peso_libras} lb` : "—"}</strong><small>{copy.bestPr}</small></div>
      </div>
    </article>
  )
}
