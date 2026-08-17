import {
  getBmiStatus,
  getRangeDifferenceStatus,
  numberText,
} from "../utils/studentProgressUtils.js"

export default function StudentReferenceRangeCard({ copy, reference, hasReference, locale }) {
  const adultReference = reference?.isAdultReference === true
  const bmiStatus = getBmiStatus(reference?.bmi, copy, adultReference)
  const difference = getRangeDifferenceStatus(reference?.rangeDifference, copy, locale)

  return (
    <article className="student-progress-card student-reference-card">
      <header>
        <div><p>◎ {copy.healthyRange}</p><h2>{copy.referenceByHeight}</h2></div>
        <span>{copy.bmi}</span>
      </header>

      {!hasReference ? (
        <div className="student-progress-empty">{copy.referenceEmpty}</div>
      ) : !adultReference ? (
        <>
          <div className="student-reference-main">
            <small>{copy.currentBmi}</small>
            <strong>{numberText(reference?.bmi, 1, locale)}</strong>
          </div>

          <div className="student-reference-metrics">
            <div className="is-muted">
              <small>{copy.bmiReference}</small>
              <strong>—</strong>
              <span>{bmiStatus.label}</span>
            </div>
          </div>

          <p className="student-reference-note">{copy.bmiAgeSpecificNote}</p>
        </>
      ) : (
        <>
          <div className="student-reference-main">
            <small>{copy.estimatedRange}</small>
            <strong>{numberText(reference.minWeight, 1, locale)} – {numberText(reference.maxWeight, 1, locale)} kg</strong>
          </div>

          <div className="student-reference-metrics">
            <div className={`is-${bmiStatus.tone}`}>
              <small>{copy.currentBmi}</small>
              <strong>{numberText(reference.bmi, 1, locale)}</strong>
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
