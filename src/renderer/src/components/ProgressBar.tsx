import type { ProgressUpdate } from '@common/types'

interface ProgressBarProps {
  progress: ProgressUpdate | null
}

function ProgressBar({ progress }: ProgressBarProps): React.JSX.Element | null {
  if (!progress) {
    return null
  }

  const { stage, current = 0, total = 0, message, error } = progress
  const percent = total > 0 ? Math.round((current / total) * 100) : stage === 'completed' ? 100 : 0

  const stageLabel = {
    idle: 'Ready',
    preparing: 'Preparing…',
    processing: 'Processing…',
    writing: 'Writing…',
    completed: 'Done',
    error: 'Error'
  }[stage]

  return (
    <div className={`progress progress--${stage}`} role="status" aria-live="polite">
      <div className="progress__header">
        <span>{stageLabel}</span>
        {total ? (
          <span>
            {current} / {total}
          </span>
        ) : null}
      </div>
      <div className="progress__bar">
        <div className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
      {message ? <div className="progress__message">{message}</div> : null}
      {error ? <div className="progress__error">{error}</div> : null}
    </div>
  )
}

export default ProgressBar
