import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  ConversionOptions,
  ConversionSummary,
  ImageFileInfo,
  ProgressUpdate
} from '@common/types'
import {
  AppLayout,
  DropZone,
  ImageList,
  PDFPreview,
  ProgressBar,
  ConvertButton,
  SettingsPanel
} from './components'

const INITIAL_OPTIONS: ConversionOptions = {
  pageSize: 'A4',
  margin: 0.25,
  scaling: 'fit-page',
  quality: 85,
  preserveMetadata: true
}

function App(): React.JSX.Element {
  const [files, setFiles] = useState<ImageFileInfo[]>([])
  const [options, setOptions] = useState<ConversionOptions>(INITIAL_OPTIONS)
  const [progress, setProgress] = useState<ProgressUpdate | null>(null)
  const [summary, setSummary] = useState<ConversionSummary | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const detach = window.api.onProgress((update) => {
      setProgress(update)
      if (update.stage === 'completed') {
        setBusy(false)
      }
      if (update.stage === 'error') {
        setBusy(false)
      }
    })
    return () => {
      detach()
    }
  }, [])

  const handleInspect = useCallback(async (paths: string[]) => {
    if (!paths.length) return
    const info = await window.api.inspectFiles(paths)
    setFiles((prev) => {
      const existing = new Map(prev.map((file) => [file.path, file]))
      info.forEach((file) => {
        existing.set(file.path, file)
      })
      return Array.from(existing.values())
    })
  }, [])

  const handleBrowse = useCallback(async () => {
    const selected = await window.api.openFileDialog()
    await handleInspect(selected)
  }, [handleInspect])

  const handleDrop = useCallback(
    async (paths: string[]) => {
      await handleInspect(paths)
    },
    [handleInspect]
  )

  const handleRemove = useCallback((path: string) => {
    setFiles((prev) => prev.filter((file) => file.path !== path))
  }, [])

  const handleClear = useCallback(() => {
    setFiles([])
    setSummary(null)
    setProgress(null)
  }, [])

  const supportedFiles = useMemo(
    () => files.filter((file) => file.supported && !file.error),
    [files]
  )

  const handleConvert = useCallback(async () => {
    if (!supportedFiles.length) return
    setBusy(true)
    setSummary(null)
    setProgress({ stage: 'preparing', total: supportedFiles.length, current: 0 })
    try {
      const result = await window.api.convertToPDF(
        supportedFiles.map((file) => file.path),
        options
      )
      setSummary(result)
    } catch (error) {
      console.error(error)
    } finally {
      setBusy(false)
    }
  }, [options, supportedFiles])

  const handleCancel = useCallback(() => {
    window.api.cancelConversion()
    setBusy(false)
  }, [])

  return (
    <AppLayout>
      <SettingsPanel
        value={options}
        onChange={setOptions}
        disabled={busy}
        renderTrigger={({ onOpen, isOpen, disabled: triggerDisabled }) => (
          <div className="layout__settings-trigger">
            <button
              type="button"
              className={`layout__settings-trigger-button ${isOpen ? 'layout__settings-trigger-button--open' : ''}`}
              onClick={onOpen}
              disabled={triggerDisabled}
              aria-haspopup="dialog"
              aria-expanded={isOpen}
              title="PDF Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      />
      {/* Primary Action: Large, Central Drop Zone */}
      <DropZone onPathsAdded={handleDrop} onBrowse={handleBrowse} disabled={busy} />

      {/* Immediate Feedback: Image Thumbnails with Action Buttons */}
      {files.length > 0 && (
        <ImageList
          files={files}
          onRemove={handleRemove}
          onBrowse={handleBrowse}
          onClear={handleClear}
          disabled={busy}
        />
      )}

      {/* PDF Preview */}
      {supportedFiles.length > 0 && <PDFPreview files={files} options={options} />}

      {/* Main Convert Action */}
      {supportedFiles.length > 0 && (
        <ConvertButton
          onConvert={handleConvert}
          onCancel={handleCancel}
          disabled={!supportedFiles.length}
          busy={busy}
          outputPath={summary?.outputPath}
        />
      )}

      {/* Progress Feedback */}
      <ProgressBar progress={progress} />

      {/* Warnings */}
      {summary && summary.warnings.length ? (
        <div className="alert">
          <strong>Warnings</strong>
          <ul>
            {summary.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </AppLayout>
  )
}

export default App
