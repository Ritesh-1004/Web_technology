import { STATUS_STEPS } from '../utils/helpers';

// Renders the Pending -> In Progress -> Resolved pipeline and highlights
// which stage the given report is currently at.
export default function StatusTracker({ status }) {
  const currentIndex = STATUS_STEPS.indexOf(status);

  return (
    <div className="tracker">
      {STATUS_STEPS.map((step, index) => {
        let stateClass = '';
        if (index < currentIndex) stateClass = 'done';
        else if (index === currentIndex) stateClass = 'current done';

        return (
          <div key={step} className={`tracker-step ${stateClass}`}>
            <div className="tracker-line" />
            <div className="tracker-dot">
              {index < currentIndex ? '✓' : index + 1}
            </div>
            <div className="tracker-label">{step}</div>
          </div>
        );
      })}
    </div>
  );
}
