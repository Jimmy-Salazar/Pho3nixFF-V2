import AnnouncementsList from "./AnnouncementsList.jsx"
import SectionHeader from "./SectionHeader.jsx"

export default function AnnouncementsSection({ copy, items }) {
  return (
    <section className="student-section">
      <SectionHeader title={copy.announcementsTitle} action={copy.announcements} />
      <AnnouncementsList copy={copy} items={items} />
    </section>
  )
}
