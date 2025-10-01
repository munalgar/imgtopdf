import './ConvertButton.css'

interface ConvertButtonProps {
  onConvert: () => void
  onCancel: () => void
  disabled?: boolean
  busy?: boolean
  outputPath?: string
}

function ConvertButton({
  onConvert,
  onCancel,
  disabled,
  busy,
  outputPath
}: ConvertButtonProps): React.JSX.Element {
  return (
    <div className="convert-section">
      <div className="convert-actions">
        <button
          className="btn btn--primary btn--large"
          type="button"
          onClick={onConvert}
          disabled={disabled || busy}
        >
          {busy ? 'Converting' : 'Convert'}
        </button>
        {busy && (
          <button className="btn btn--danger" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
      {outputPath && (
        <div className="convert-success">
          <span>✓ Saved: {outputPath}</span>
        </div>
      )}
    </div>
  )
}

export default ConvertButton
