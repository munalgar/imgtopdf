import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { ConversionOptions } from '@common/types'
import SettingsPreview from './SettingsPreview'
import './SettingsPanel.css'

interface SettingsTriggerRenderProps {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onToggle: () => void
  disabled?: boolean
}

interface SettingsPanelProps {
  value: ConversionOptions
  onChange: (value: ConversionOptions) => void
  disabled?: boolean
  renderTrigger?: (props: SettingsTriggerRenderProps) => ReactNode
}

const PAGE_SIZES = [
  { value: 'A4', label: 'A4' },
  { value: 'A3', label: 'A3' },
  { value: 'Letter', label: 'Letter' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Original', label: 'Original size' },
  { value: 'Custom', label: 'Custom' }
] as const

const PAGE_LAYOUTS = [
  { value: 'one', label: 'One per page' },
  { value: 'two', label: 'Two per page' },
  { value: 'four', label: 'Four per page' }
] as const

const SCALING_MODES = [
  { value: 'fit-page', label: 'Fit page' },
  { value: 'fit-width', label: 'Fit width' },
  { value: 'original', label: 'Original size' }
] as const

function SettingsPanel({
  value,
  onChange,
  disabled,
  renderTrigger
}: SettingsPanelProps): React.JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleOpen = (): void => {
    if (disabled) return
    setIsOpen(true)
  }

  const handleClose = (): void => {
    setIsOpen(false)
  }

  const handleToggle = (): void => {
    if (disabled) return
    setIsOpen((prev) => !prev)
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

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false)
    }
  }, [disabled, isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const timeout = window.setTimeout(() => {
      dialogRef.current?.focus()
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [isOpen])

  const modalRoot = typeof document !== 'undefined' ? document.body : null

  const modal =
    isMounted && isOpen && modalRoot
      ? createPortal(
          <div className="settings-modal">
            <div className="settings-modal__backdrop" onClick={handleClose} aria-hidden />
            <div
              className="settings-modal__dialog"
              role="dialog"
              aria-modal="true"
              aria-label="PDF Settings"
              tabIndex={-1}
              ref={dialogRef}
            >
              <div className="settings-content">
                <div className="settings-modal__header">
                  <h2 className="settings-modal__title">PDF Settings</h2>
                  <button
                    type="button"
                    className="settings-modal__close"
                    onClick={handleClose}
                    aria-label="Close settings"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M6 6l12 12M18 6 6 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <div className="settings__preview">
                  <SettingsPreview options={value} />
                </div>

                <div className="settings__field">
                  <label htmlFor="pageSize">Page</label>
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
                  <div className="settings__grid">
                    <div className="settings__field">
                      <label htmlFor="customWidth">Width</label>
                      <input
                        id="customWidth"
                        type="number"
                        min={10}
                        max={2000}
                        step={1}
                        value={value.customWidth ?? ''}
                        onChange={onNumberChange('customWidth')}
                        disabled={disabled}
                        placeholder="mm"
                      />
                    </div>
                    <div className="settings__field">
                      <label htmlFor="customHeight">Height</label>
                      <input
                        id="customHeight"
                        type="number"
                        min={10}
                        max={2000}
                        step={1}
                        value={value.customHeight ?? ''}
                        onChange={onNumberChange('customHeight')}
                        disabled={disabled}
                        placeholder="mm"
                      />
                    </div>
                  </div>
                ) : null}

                <div className="settings__grid">
                  <div className="settings__field">
                    <label htmlFor="margin">Margin</label>
                    <input
                      id="margin"
                      type="number"
                      min={0}
                      max={2}
                      step={0.1}
                      value={value.margin ?? 0.25}
                      onChange={onNumberChange('margin')}
                      disabled={disabled}
                      placeholder="in"
                    />
                  </div>
                  <div className="settings__field">
                    <label htmlFor="layout">Layout</label>
                    <select
                      id="layout"
                      value={value.pageLayout ?? 'one'}
                      onChange={(event) =>
                        updateOption(
                          'pageLayout',
                          event.target.value as ConversionOptions['pageLayout']
                        )
                      }
                      disabled={disabled || value.pageSize === 'Original'}
                    >
                      {PAGE_LAYOUTS.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="settings__field">
                    <label htmlFor="quality">Quality</label>
                    <input
                      id="quality"
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      value={value.quality ?? 85}
                      onChange={onNumberChange('quality')}
                      disabled={disabled}
                      placeholder="%"
                    />
                  </div>
                </div>

                <div className="settings__field">
                  <label htmlFor="scaling">Scale</label>
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

                <div className="settings__grid">
                  <div className="settings__field">
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
                  <div className="settings__field">
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

                <div className="settings__field settings__field--checkbox">
                  <label htmlFor="preserveMetadata">
                    <input
                      id="preserveMetadata"
                      type="checkbox"
                      checked={value.preserveMetadata ?? true}
                      onChange={(event) => updateOption('preserveMetadata', event.target.checked)}
                      disabled={disabled}
                    />
                    Keep metadata
                  </label>
                </div>
              </div>
            </div>
          </div>,
          modalRoot
        )
      : null

  const triggerProps: SettingsTriggerRenderProps = {
    isOpen,
    onOpen: handleOpen,
    onClose: handleClose,
    onToggle: handleToggle,
    disabled
  }

  if (renderTrigger) {
    const trigger = renderTrigger(triggerProps)
    return (
      <>
        {trigger}
        {modal}
      </>
    )
  }

  return null
}

export default SettingsPanel
