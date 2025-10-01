import sharp, { type Sharp } from 'sharp'
import { extname } from 'path'
import type { NormalizedConversionOptions } from '@common/types'
import { SUPPORTED_EXTENSIONS } from './file-utils'

export interface ProcessedImage {
  data: Buffer
  format: 'jpeg' | 'png'
  width: number
  height: number
  density?: number
  originalPath: string
  warning?: string
}

export interface ImageProcessor {
  isSupported(filePath: string): boolean
  process(filePath: string, options: NormalizedConversionOptions): Promise<ProcessedImage>
}

export function createImageProcessor(): ImageProcessor {
  const isSupported = (filePath: string): boolean => {
    const ext = extractExtension(filePath)
    return SUPPORTED_EXTENSIONS.includes(ext)
  }

  const process = async (
    filePath: string,
    options: NormalizedConversionOptions
  ): Promise<ProcessedImage> => {
    const ext = extractExtension(filePath)
    const image = sharp(filePath, { failOn: 'none' }).rotate()

    const metadata = await image.metadata()
    const targetFormat = computeTargetFormat(ext)

    let pipeline: Sharp = image

    if (metadata.width && metadata.height && shouldResize(metadata, options)) {
      const targetDpi = options.targetDpi ?? metadata.density ?? options.sourceDpi ?? 72
      const { width: targetWidthInches, height: targetHeightInches } = computePageSlot(options)
      const resizeWidth = Math.max(Math.floor(targetWidthInches * targetDpi), 1)
      const resizeHeight = Math.max(Math.floor(targetHeightInches * targetDpi), 1)

      pipeline = pipeline.resize({
        width: resizeWidth,
        height: resizeHeight,
        fit: 'inside',
        withoutEnlargement: true
      })
    }

    if (targetFormat === 'jpeg') {
      pipeline = pipeline.jpeg({
        quality: options.quality,
        chromaSubsampling: '4:4:4'
      })
    } else if (targetFormat === 'png') {
      pipeline = pipeline.png({
        compressionLevel: 9,
        adaptiveFiltering: true
      })
    }

    const buffer = await pipeline.toBuffer()
    const finalMeta = await sharp(buffer).metadata()

    return {
      data: buffer,
      format: targetFormat,
      width: finalMeta.width ?? metadata.width ?? 0,
      height: finalMeta.height ?? metadata.height ?? 0,
      density: finalMeta.density ?? metadata.density,
      originalPath: filePath
    }
  }

  return {
    isSupported,
    process
  }
}

function extractExtension(filePath: string): (typeof SUPPORTED_EXTENSIONS)[number] {
  return extname(filePath).replace('.', '').toLowerCase() as (typeof SUPPORTED_EXTENSIONS)[number]
}

function computeTargetFormat(ext: (typeof SUPPORTED_EXTENSIONS)[number]): ProcessedImage['format'] {
  if (ext === 'png') return 'png'
  return 'jpeg'
}

function shouldResize(metadata: sharp.Metadata, options: NormalizedConversionOptions): boolean {
  if (!metadata.width || !metadata.height) {
    return false
  }
  if (options.pageSize === 'Original') {
    return false
  }
  if (!options.targetDpi) {
    return false
  }
  const dpi = metadata.density ?? options.sourceDpi ?? 72
  const widthInches = metadata.width / dpi
  const heightInches = metadata.height / dpi

  const { width: targetWidth, height: targetHeight } = computePageSlot(options)

  return widthInches > targetWidth || heightInches > targetHeight
}

function pageSizeToInches(options: NormalizedConversionOptions): { width: number; height: number } {
  switch (options.pageSize) {
    case 'A3':
      return { width: 11.69, height: 16.54 }
    case 'A4':
      return { width: 8.27, height: 11.69 }
    case 'Letter':
      return { width: 8.5, height: 11 }
    case 'Legal':
      return { width: 8.5, height: 14 }
    case 'Custom':
    default:
      return {
        width: (options.customWidth ?? 8.27) / 25.4,
        height: (options.customHeight ?? 11.69) / 25.4
      }
  }
}

function computePageSlot(options: NormalizedConversionOptions): { width: number; height: number } {
  const page = pageSizeToInches(options)
  const layout = resolveLayoutInches(options.pageLayout, options.margin)

  const usableWidth = Math.max(
    page.width - layout.marginX * 2 - layout.gutterX * (layout.columns - 1),
    0
  )
  const usableHeight = Math.max(
    page.height - layout.marginY * 2 - layout.gutterY * (layout.rows - 1),
    0
  )

  return {
    width: usableWidth / layout.columns,
    height: usableHeight / layout.rows
  }
}

function resolveLayoutInches(
  preset: NormalizedConversionOptions['pageLayout'],
  marginInches: number | undefined
): {
  columns: number
  rows: number
  marginX: number
  marginY: number
  gutterX: number
  gutterY: number
} {
  const margin = Math.max(marginInches ?? 0, 0)
  const gutter = margin > 0 ? margin / 2 : 12 / 72 // mirror pdf-assembler default

  switch (preset) {
    case 'two':
      return {
        columns: 1,
        rows: 2,
        marginX: margin,
        marginY: margin,
        gutterX: 0,
        gutterY: gutter
      }
    case 'four':
      return {
        columns: 2,
        rows: 2,
        marginX: margin,
        marginY: margin,
        gutterX: gutter,
        gutterY: gutter
      }
    case 'one':
    default:
      return {
        columns: 1,
        rows: 1,
        marginX: margin,
        marginY: margin,
        gutterX: 0,
        gutterY: 0
      }
  }
}
