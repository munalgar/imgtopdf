import { useState } from 'react'

interface DropZoneProps {
  onPathsAdded: (paths: string[]) => void
  onBrowse: () => Promise<void> | void
  disabled?: boolean
}

function extractPaths(dataTransfer: DataTransfer): string[] {
  return Array.from(dataTransfer.files ?? [])
    .map((file) => (file as unknown as { path?: string }).path ?? '')
    .filter(Boolean)
}

function DropZone({ onPathsAdded, onBrowse, disabled }: DropZoneProps): React.JSX.Element {
  const [isActive, setIsActive] = useState(false)

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    if (disabled) return
    const paths = extractPaths(event.dataTransfer)
    if (paths.length) {
      onPathsAdded(paths)
    }
    setIsActive(false)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    if (disabled) return
    setIsActive(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    setIsActive(false)
  }

  const className = `drop-zone${isActive ? ' drop-zone--active' : ''}${disabled ? ' drop-zone--disabled' : ''}`

  return (
    <div
      className={className}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnter={handleDragOver}
      role="presentation"
      aria-disabled={disabled}
    >
      <div className="drop-zone__content">
        <h2>Drop images here</h2>
        <div className="drop-zone__actions">
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => onBrowse()}
            disabled={disabled}
          >
            Browse
          </button>
        </div>
        <p className="drop-zone__hint">JPEG, PNG, WebP, HEIC, TIFF, BMP</p>
      </div>
    </div>
  )
}

export default DropZone
