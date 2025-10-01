import type { ConversionOptions } from '@common/types'
import './SettingsPreview.css'

const PAGE_ASPECT_RATIO: Record<string, number> = {
  A4: 210 / 297,
  A3: 297 / 420,
  Letter: 216 / 279,
  Legal: 216 / 356,
  Original: 210 / 297,
  Custom: 210 / 297
}

const LAYOUT_PRESETS: Record<string, { columns: number; rows: number }> = {
  one: { columns: 1, rows: 1 },
  two: { columns: 2, rows: 1 },
  four: { columns: 2, rows: 2 }
}

interface SettingsPreviewProps {
  options: ConversionOptions
}

function SettingsPreview({ options }: SettingsPreviewProps): React.JSX.Element {
  const pageSize = options.pageSize ?? 'A4'
  const aspectRatio = PAGE_ASPECT_RATIO[pageSize] ?? PAGE_ASPECT_RATIO.A4
  const layout = LAYOUT_PRESETS[options.pageLayout ?? 'one'] ?? LAYOUT_PRESETS.one
  const totalCells = layout.columns * layout.rows

  // Convert inch margin to a visual padding percentage (0-20%)
  const rawMargin = options.margin ?? 0.25
  const clampedMargin = Math.max(0, Math.min(rawMargin, 2))
  const marginPercent = (clampedMargin / 2) * 20

  const quality = Math.max(1, Math.min(options.quality ?? 85, 100))

  const scaling = options.scaling ?? 'fit-page'

  return (
    <div className="settings-preview" data-preview-columns={layout.columns * layout.rows}>
      <div className="settings-preview__page" style={{ aspectRatio: `${aspectRatio}` }} aria-hidden>
        <div className="settings-preview__page-number">Live preview</div>
        <div className="settings-preview__page-surface" style={{ padding: `${marginPercent}%` }}>
          <div
            className="settings-preview__grid"
            style={{
              gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
              gridTemplateRows: `repeat(${layout.rows}, 1fr)`
            }}
          >
            {Array.from({ length: totalCells }).map((_, index) => (
              <div key={index} className="settings-preview__cell">
                <div className={`settings-preview__image settings-preview__image--${scaling}`} />
              </div>
            ))}
          </div>
        </div>
        <div className="settings-preview__margin-indicator" aria-hidden>
          {clampedMargin}&quot; margin
        </div>
      </div>
      <dl className="settings-preview__details">
        <div className="settings-preview__detail">
          <dt>Page size</dt>
          <dd>{pageSize}</dd>
        </div>
        <div className="settings-preview__detail">
          <dt>Layout</dt>
          <dd>
            {layout.columns * layout.rows === 1
              ? 'Single image'
              : `${layout.columns * layout.rows} per page`}
          </dd>
        </div>
        <div className="settings-preview__detail">
          <dt>Quality</dt>
          <dd>
            <span className="settings-preview__quality-value">{quality}%</span>
            <span className="settings-preview__quality-bar">
              <span
                className="settings-preview__quality-bar-fill"
                style={{ width: `${quality}%` }}
              />
            </span>
          </dd>
        </div>
        <div className="settings-preview__detail">
          <dt>Scaling</dt>
          <dd>
            {scaling === 'fit-page'
              ? 'Fit page'
              : scaling === 'fit-width'
                ? 'Fit width'
                : 'Original size'}
          </dd>
        </div>
      </dl>
    </div>
  )
}

export default SettingsPreview
