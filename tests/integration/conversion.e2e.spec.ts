import { describe, test, beforeEach, afterEach, expect, vi } from 'vitest'
import { join } from 'path'
import { tmpdir } from 'os'
import { mkdtempSync, mkdirSync, existsSync } from 'fs'
import { promises as fs } from 'fs'
import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'
import type { ConversionOptions, PageSizePreset } from '@common/types'
import { createConversionController } from '../../src/main/lib/conversion-controller'

const electronState = vi.hoisted(() => {
  const state = { documentsDir: '' }
  const appGetPath = vi.fn((name: string) => {
    if (name === 'documents') {
      return state.documentsDir
    }
    throw new Error(`Unhandled app.getPath request: ${name}`)
  })
  return {
    state,
    appGetPath
  }
})

const { state: electronMockState, appGetPath } = electronState

vi.mock('electron', () => ({
  app: {
    getPath: electronState.appGetPath
  }
}))

type IntegrationFormat = 'jpg' | 'png' | 'webp'

const FORMAT_SPECS: IntegrationFormat[] = ['jpg', 'png', 'webp']

describe('conversion integration', () => {
  let tempRoot: string
  let fixturesDir: string

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'imgtopdf-int-'))
    fixturesDir = join(tempRoot, 'fixtures')
    mkdirSync(fixturesDir, { recursive: true })

    electronMockState.documentsDir = join(tempRoot, 'documents')
    mkdirSync(electronMockState.documentsDir, { recursive: true })

    appGetPath.mockClear()
  })

  afterEach(async () => {
    if (existsSync(tempRoot)) {
      try {
        await removeWithRetry(tempRoot)
      } catch {
        // Ignore cleanup errors on Windows where file handles may still be releasing
      }
    }
  })

  test('converts multiple formats into a multi-page PDF with default options', async () => {
    const samplePaths = await Promise.all(
      FORMAT_SPECS.map((ext, index) => createSampleImage(fixturesDir, ext, index))
    )

    const controller = createConversionController()

    const summary = await controller.convert(samplePaths, {
      pageSize: 'Letter',
      scaling: 'fit-page'
    })

    const pdfBytes = await fs.readFile(summary.outputPath)
    const pdf = await PDFDocument.load(pdfBytes)

    expect(pdf.getPages().length).toBe(samplePaths.length)
    const firstPage = pdf.getPage(0)
    const expectedLetter = expectedPageSize('Letter')
    expect(firstPage.getWidth()).toBeCloseTo(expectedLetter.width, 1)
    expect(firstPage.getHeight()).toBeCloseTo(expectedLetter.height, 1)

    expect(summary.warnings).toEqual([])
  })

  const optionCases: Array<{
    name: string
    options: ConversionOptions
    expectedPage: { width: number; height: number }
  }> = [
    {
      name: 'Legal fit-width with margins',
      options: {
        pageSize: 'Legal',
        scaling: 'fit-width',
        margin: 0.5,
        targetDpi: 300
      },
      expectedPage: expectedPageSize('Legal')
    },
    {
      name: 'Custom original scaling',
      options: {
        pageSize: 'Custom',
        scaling: 'original',
        customWidth: 210,
        customHeight: 297,
        margin: 0.2
      },
      expectedPage: expectedCustomSize(210, 297)
    },
    {
      name: 'Original size retains image dimensions',
      options: {
        pageSize: 'Original',
        scaling: 'fit-page',
        sourceDpi: 300,
        targetDpi: 300,
        margin: 0
      },
      expectedPage: expectedOriginalSize(640, 480, 300)
    }
  ]

  for (const { name, options, expectedPage } of optionCases) {
    test(`respects ${name} PDF settings`, async () => {
      const samplePath = await createSampleImage(fixturesDir, 'png', 1)
      const controller = createConversionController()

      const summary = await controller.convert([samplePath], options)
      const pdfBytes = await fs.readFile(summary.outputPath)
      const pdf = await PDFDocument.load(pdfBytes)
      const page = pdf.getPage(0)

      expect(page.getWidth()).toBeCloseTo(expectedPage.width, 1)
      expect(page.getHeight()).toBeCloseTo(expectedPage.height, 1)
    })
  }
})

async function createSampleImage(
  dir: string,
  extension: IntegrationFormat,
  index: number
): Promise<string> {
  const filePath = join(dir, `fixture-${index}.${extension}`)
  const base = sharp({
    create: {
      width: 640,
      height: 480,
      channels: 3,
      background: sampleColor(index)
    }
  })

  let pipeline = base
  switch (extension) {
    case 'jpg':
      pipeline = base.clone().jpeg({ quality: 90 })
      break
    case 'png':
      pipeline = base.clone().png()
      break
    case 'webp':
      pipeline = base.clone().webp({ quality: 90 })
      break
  }

  const buffer = await pipeline.toBuffer()
  await fs.writeFile(filePath, buffer)

  return filePath
}

function sampleColor(index: number): sharp.Color {
  const palette: sharp.Color[] = [
    { r: 220, g: 30, b: 70, alpha: 1 },
    { r: 40, g: 180, b: 90, alpha: 1 },
    { r: 60, g: 90, b: 220, alpha: 1 }
  ]
  return palette[index % palette.length]
}

function expectedPageSize(preset: PageSizePreset): { width: number; height: number } {
  switch (preset) {
    case 'A3':
      return inchesToPoints(11.69, 16.54)
    case 'A4':
      return inchesToPoints(8.27, 11.69)
    case 'Letter':
      return inchesToPoints(8.5, 11)
    case 'Legal':
      return inchesToPoints(8.5, 14)
    case 'Custom':
    case 'Original':
    default:
      return expectedCustomSize(210, 297)
  }
}

function expectedOriginalSize(
  widthPx: number,
  heightPx: number,
  dpi: number
): {
  width: number
  height: number
} {
  const widthInches = widthPx / dpi
  const heightInches = heightPx / dpi
  return inchesToPoints(widthInches, heightInches)
}

function expectedCustomSize(widthMm: number, heightMm: number): { width: number; height: number } {
  const widthInches = widthMm / 25.4
  const heightInches = heightMm / 25.4
  return inchesToPoints(widthInches, heightInches)
}

function inchesToPoints(width: number, height: number): { width: number; height: number } {
  return {
    width: width * 72,
    height: height * 72
  }
}

async function removeWithRetry(path: string, attempts = 5): Promise<void> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await fs.rm(path, { recursive: true, force: true })
      return
    } catch (error) {
      if (attempt === attempts - 1) throw error
      await delay(100)
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
