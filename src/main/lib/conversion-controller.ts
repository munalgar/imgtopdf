import { dirname, join, parse } from 'path'
import { app } from 'electron'
import { ensureDir, pathExists } from 'fs-extra'
import { createHash } from 'crypto'
import { performance } from 'node:perf_hooks'
import type {
  ConversionOptions,
  ConversionSummary,
  NormalizedConversionOptions,
  ProgressUpdate
} from '@common/types'
import { createPDFAssembler } from './pdf-assembler'
import { createImageProcessor, type ProcessedImage } from './image-processor'
import { normalizeOptions } from './option-normalizer'

interface ConversionController {
  convert(
    files: string[],
    options: ConversionOptions,
    sender?: Electron.WebContents
  ): Promise<ConversionSummary>
  cancel(): void
}

class CancellationToken {
  #aborted = false

  abort(): void {
    this.#aborted = true
  }

  throwIfAborted(): void {
    if (this.#aborted) {
      throw new Error('Conversion cancelled')
    }
  }
}

export function createConversionController(): ConversionController {
  let activeToken: CancellationToken | undefined
  let activeSender: Electron.WebContents | undefined

  const emitProgress = (progress: ProgressUpdate): void => {
    activeSender?.send('conversion:progress', progress)
  }

  const convert = async (
    files: string[],
    options: ConversionOptions,
    sender?: Electron.WebContents
  ): Promise<ConversionSummary> => {
    activeToken?.abort()
    const token = new CancellationToken()
    activeToken = token
    activeSender = sender

    const start = performance.now()

    emitProgress({ stage: 'preparing', total: files.length, current: 0 })

    const processor = createImageProcessor()
    const assembler = createPDFAssembler()
    const normalizedOptions = normalizeOptions(options)
    const warnings: string[] = []

    const validFiles = files.filter((file) => processor.isSupported(file))
    const skipped = files.length - validFiles.length

    if (!validFiles.length) {
      const error = skipped ? 'No supported images found in selection.' : 'No input files provided.'
      emitProgress({ stage: 'error', message: error, error })
      throw new Error(error)
    }

    if (skipped) {
      warnings.push(`${skipped} file(s) skipped due to unsupported format.`)
    }

    const outputPath = await resolveOutputPath(validFiles, normalizedOptions)

    try {
      const tempImages: ProcessedImage[] = []
      let current = 0

      emitProgress({ stage: 'processing', total: validFiles.length, current })

      for (const file of validFiles) {
        token.throwIfAborted()
        const result = await processor.process(file, normalizedOptions)
        tempImages.push(result)
        current += 1
        emitProgress({
          stage: 'processing',
          total: validFiles.length,
          current,
          message: `Processed ${parse(file).base}`
        })
        if (result.warning) warnings.push(result.warning)
      }

      emitProgress({ stage: 'writing', total: validFiles.length, current })

      token.throwIfAborted()
      await assembler.assemble(tempImages, {
        outputPath,
        options: normalizedOptions
      })

      emitProgress({ stage: 'completed', total: validFiles.length, current, outputPath })
      return {
        outputPath,
        warnings,
        durationMs: performance.now() - start
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      emitProgress({ stage: 'error', message: err.message, error: err.message })
      throw err
    } finally {
      if (activeToken === token) {
        activeToken = undefined
      }
      if (activeSender === sender) {
        activeSender = undefined
      }
    }
  }

  const cancel = (): void => {
    activeToken?.abort()
  }

  return {
    convert,
    cancel
  }
}

async function resolveOutputPath(
  files: string[],
  options: NormalizedConversionOptions
): Promise<string> {
  if (options.outputPath) {
    await ensureDir(dirname(options.outputPath))
    return options.outputPath
  }

  const hash = createHash('sha1')
  files.forEach((file) => hash.update(file))
  const digest = hash.digest('hex').slice(0, 8)
  const firstFile = parse(files[0])

  const appData = app.getPath('documents')
  const outputDir = join(appData, 'imgtopdf')
  await ensureDir(outputDir)

  let outputPath = join(outputDir, `${firstFile.name}-${digest}.pdf`)
  let counter = 1

  // Ensure unique filename
  while (await pathExists(outputPath)) {
    outputPath = join(outputDir, `${firstFile.name}-${digest}-${counter}.pdf`)
    counter += 1
  }

  return outputPath
}
