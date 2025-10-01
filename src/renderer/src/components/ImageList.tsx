import type { ImageFileInfo } from '@common/types'

interface ImageListProps {
  files: ImageFileInfo[]
  onRemove: (path: string) => void
  onBrowse?: () => void
  onClear?: () => void
  disabled?: boolean
}

function renderStatus(file: ImageFileInfo): React.JSX.Element | null {
  if (file.error) {
    return <span className="image-list__error">{file.error}</span>
  }
  if (!file.supported) {
    return <span className="image-list__warning">Unsupported</span>
  }
  if (file.warning) {
    return <span className="image-list__warning">{file.warning}</span>
  }
  return null
}

function ImageList({
  files,
  onRemove,
  onBrowse,
  onClear,
  disabled
}: ImageListProps): React.JSX.Element | null {
  if (!files.length) {
    return null
  }

  return (
    <div className="image-list">
      <div className="image-list__header">
        <div className="image-list__header-left">
          <h3>Images</h3>
          <span>{files.length}</span>
        </div>
        <div className="image-list__header-actions">
          {onBrowse && (
            <button
              className="btn btn--ghost btn--small"
              type="button"
              onClick={onBrowse}
              disabled={disabled}
            >
              Add
            </button>
          )}
          {onClear && files.length > 0 && (
            <button
              className="btn btn--ghost btn--small"
              type="button"
              onClick={onClear}
              disabled={disabled}
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <ul className="image-list__items">
        {files.map((file) => (
          <li key={file.path} className="image-list__item">
            {file.preview && (
              <div className="image-list__preview">
                <img src={file.preview} alt={file.name} className="image-list__preview-img" />
              </div>
            )}
            <div className="image-list__details">
              <div className="image-list__name">{file.name}</div>
              <div className="image-list__meta">
                <span className="image-list__format">{file.format.toUpperCase()}</span>
                {file.width && file.height ? (
                  <span className="image-list__size">
                    {file.width} × {file.height}
                  </span>
                ) : null}
                {renderStatus(file)}
              </div>
            </div>
            <button
              className="image-list__remove"
              type="button"
              onClick={() => onRemove(file.path)}
              disabled={disabled}
              aria-label={`Remove ${file.name}`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ImageList
