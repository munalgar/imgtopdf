interface ToolbarProps {
  onBrowse: () => Promise<void> | void
  onConvert: () => Promise<void> | void
  onCancel: () => Promise<void> | void
  disabled?: boolean
  busy?: boolean
  outputPath?: string
}

function Toolbar({
  onBrowse,
  onConvert,
  onCancel,
  disabled,
  busy,
  outputPath
}: ToolbarProps): React.JSX.Element {
  return (
    <div className="toolbar">
      <button className="btn btn--ghost" type="button" onClick={() => onBrowse()} disabled={busy}>
        Add images
      </button>
      <button
        className="btn btn--primary"
        type="button"
        onClick={() => onConvert()}
        disabled={disabled || busy}
      >
        Convert to PDF
      </button>
      {busy ? (
        <button className="btn btn--danger" type="button" onClick={() => onCancel()}>
          Cancel
        </button>
      ) : null}
      {outputPath ? <span className="toolbar__info">Saved to: {outputPath}</span> : null}
    </div>
  )
}

export default Toolbar
