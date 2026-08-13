import BirthdaysList from "./BirthdaysList.jsx"
import SectionHeader from "./SectionHeader.jsx"

export default function BirthdaysSection({ copy, items }) {
  return (
    <section className="student-section">
      <SectionHeader title={copy.birthdays} action={copy.community} />
      <BirthdaysList copy={copy} items={items} />
    </section>
  )
}
