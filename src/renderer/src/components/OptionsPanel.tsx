import { useState } from 'react'
import type { ConversionOptions } from '@common/types'

interface OptionsPanelProps {
  value: ConversionOptions
  onChange: (value: ConversionOptions) => void
  disabled?: boolean
}

const PAGE_SIZES = [
  { value: 'A4', label: 'A4 (210 × 297 mm)' },
  { value: 'A3', label: 'A3 (297 × 420 mm)' },
  { value: 'Letter', label: 'Letter (8.5 × 11 in)' },
  { value: 'Legal', label: 'Legal (8.5 × 14 in)' },
  { value: 'Original', label: 'Original size' },
  { value: 'Custom', label: 'Custom size' }
] as const

const PAGE_LAYOUTS = [
  { value: 'one', label: 'One per page' },
  { value: 'two', label: 'Two per page' },
  { value: 'four', label: 'Four per page' }
] as const

const SCALING_MODES = [
  { value: 'fit-page', label: 'Fit entire page' },
  { value: 'fit-width', label: 'Fit width' },
  { value: 'original', label: 'Original size' }
] as const

function OptionsPanel({ value, onChange, disabled }: OptionsPanelProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)

  const handleToggle = (): void => {
    setExpanded((prev) => !prev)
  }

  const handleHeaderKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleToggle()
    }
  }

  const updateOption = <K extends keyof ConversionOptions>(
    key: K,
    val: ConversionOptions[K]
  ): void => {
    onChange({ ...value, [key]: val })
  }

  const onNumberChange =
    (key: keyof ConversionOptions) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value
      if (raw === '') {
        updateOption(key, undefined)
        return
      }
      const next = Number(raw)
      updateOption(key, Number.isNaN(next) ? undefined : (next as ConversionOptions[typeof key]))
    }

  return (
    <section className="options">
      <header
        className="options__header"
        onClick={handleToggle}
        onKeyDown={handleHeaderKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
      >
        <span>Settings</span>
        <span className="options__toggle">{expanded ? '−' : '+'}</span>
      </header>
      {expanded ? (
        <div className="options__content">
          <div className="options__field">
            <label htmlFor="pageSize">Page size</label>
            <select
              id="pageSize"
              value={value.pageSize ?? 'A4'}
              disabled={disabled}
              onChange={(event) =>
                updateOption('pageSize', event.target.value as ConversionOptions['pageSize'])
              }
            >
              {PAGE_SIZES.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {value.pageSize === 'Custom' ? (
            <div className="options__grid">
              <div className="options__field">
                <label htmlFor="customWidth">Custom width (mm)</label>
                <input
                  id="customWidth"
                  type="number"
                  min={10}
                  max={2000}
                  step={1}
                  value={value.customWidth ?? ''}
                  onChange={onNumberChange('customWidth')}
                  disabled={disabled}
                />
              </div>
              <div className="options__field">
                <label htmlFor="customHeight">Custom height (mm)</label>
                <input
                  id="customHeight"
                  type="number"
                  min={10}
                  max={2000}
                  step={1}
                  value={value.customHeight ?? ''}
                  onChange={onNumberChange('customHeight')}
                  disabled={disabled}
                />
              </div>
            </div>
          ) : null}

          <div className="options__grid">
            <div className="options__field">
              <label htmlFor="margin">Margins (inches)</label>
              <input
                id="margin"
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={value.margin ?? 0.25}
                onChange={onNumberChange('margin')}
                disabled={disabled}
              />
            </div>
            <div className="options__field">
              <label htmlFor="layout">Page layout</label>
              <select
                id="layout"
                value={value.pageLayout ?? 'one'}
                onChange={(event) =>
                  updateOption('pageLayout', event.target.value as ConversionOptions['pageLayout'])
                }
                disabled={disabled || value.pageSize === 'Original'}
              >
                {PAGE_LAYOUTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="options__field">
              <label htmlFor="quality">JPEG quality (1-100)</label>
              <input
                id="quality"
                type="number"
                min={1}
                max={100}
                step={1}
                value={value.quality ?? 85}
                onChange={onNumberChange('quality')}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="options__field">
            <label htmlFor="scaling">Image scaling</label>
            <select
              id="scaling"
              value={value.scaling ?? 'fit-page'}
              onChange={(event) =>
                updateOption('scaling', event.target.value as ConversionOptions['scaling'])
              }
              disabled={disabled}
            >
              {SCALING_MODES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="options__grid">
            <div className="options__field">
              <label htmlFor="targetDpi">Target DPI</label>
              <input
                id="targetDpi"
                type="number"
                min={72}
                max={600}
                step={1}
                value={value.targetDpi ?? ''}
                onChange={onNumberChange('targetDpi')}
                disabled={disabled}
                placeholder="Auto"
              />
            </div>
            <div className="options__field">
              <label htmlFor="sourceDpi">Source DPI</label>
              <input
                id="sourceDpi"
                type="number"
                min={72}
                max={1200}
                step={1}
                value={value.sourceDpi ?? ''}
                onChange={onNumberChange('sourceDpi')}
                disabled={disabled}
                placeholder="Auto"
              />
            </div>
          </div>

          <div className="options__field options__field--checkbox">
            <label htmlFor="preserveMetadata">
              <input
                id="preserveMetadata"
                type="checkbox"
                checked={value.preserveMetadata ?? true}
                onChange={(event) => updateOption('preserveMetadata', event.target.checked)}
                disabled={disabled}
              />
              Preserve metadata when possible
            </label>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default OptionsPanel
