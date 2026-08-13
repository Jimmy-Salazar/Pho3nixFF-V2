import SectionHeader from "./SectionHeader.jsx"
import WodCard from "./WodCard.jsx"

export default function WodSection({ copy, wod, navigate }) {
  return (
    <section className="student-section student-wod-section">
      <SectionHeader title={copy.wodTitle} action={copy.viewWod} onAction={() => navigate("/alumno/wods")} />
      <WodCard copy={copy} wod={wod} navigate={navigate} />
    </section>
  )
}
