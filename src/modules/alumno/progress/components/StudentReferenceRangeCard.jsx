import {
  getBmiStatus,
  getRangeDifferenceStatus,
  numberText,
} from "../utils/studentProgressUtils.js"

export default function StudentReferenceRangeCard({ copy, reference, hasReference }) {
  const bmiStatus = getBmiStatus(reference?.bmi, copy)
  const difference = getRangeDifferenceStatus(reference?.rangeDifference, copy)

  return (
    <article className="student-progress-card student-reference-card">
      <header>
        <div><p>◎ {copy.healthyRange}</p><h2>{copy.referenceByHeight}</h2></div>
        <span>IMC</span>
      </header>

      {!hasReference ? (
        <div className="student-progress-empty">{copy.referenceEmpty}</div>
      ) : (
        <>
          <div className="student-reference-main">
            <small>{copy.estimatedRange}</small>
            <strong>{numberText(reference.minWeight)} – {numberText(reference.maxWeight)} kg</strong>
          </div>

          <div className="student-reference-metrics">
            <div className={`is-${bmiStatus.tone}`}>
              <small>{copy.currentBmi}</small>
              <strong>{numberText(reference.bmi)}</strong>
              <span>{bmiStatus.label}</span>
            </div>
            <div className={`is-${difference.tone}`}>
              <small>{copy.difference}</small>
              <strong>{difference.value}</strong>
              <span>{difference.label}</span>
            </div>
          </div>

          <p className="student-reference-note">{copy.referenceNote}</p>
        </>
      )}
    </article>
  )
}
