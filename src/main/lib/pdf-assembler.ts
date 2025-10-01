import { writeFile } from 'fs/promises'
import { PDFDocument } from 'pdf-lib'
import type { NormalizedConversionOptions } from '@common/types'
import type { ProcessedImage } from './image-processor'

interface AssembleInput {
  outputPath: string
  options: NormalizedConversionOptions
}

interface PDFAssembler {
  assemble(images: ProcessedImage[], input: AssembleInput): Promise<void>
}

export function createPDFAssembler(): PDFAssembler {
  const assemble = async (
    images: ProcessedImage[],
    { outputPath, options }: AssembleInput
  ): Promise<void> => {
    const pdf = await PDFDocument.create()
    pdf.setTitle('Image Conversion')

    const layout = resolveLayout(options.pageLayout, options.margin)
    const perPage = options.pageSize === 'Original' ? 1 : layout.slots
    const groups = groupImages(images, perPage)

    for (const group of groups) {
      const appliedLayout =
        options.pageSize === 'Original'
          ? resolveLayout('one', options.margin)
          : group.length < layout.slots
            ? tightenLayout(layout, group.length)
            : layout
      await appendPage(pdf, group, appliedLayout, options)
    }

    const pdfBytes = await pdf.save()
    await writeFile(outputPath, pdfBytes)
  }

  return {
    assemble
  }
}

async function appendPage(
  pdf: PDFDocument,
  images: ProcessedImage[],
  layout: PageLayout,
  options: NormalizedConversionOptions
): Promise<void> {
  const target = images[0]
  const { width: pageWidth, height: pageHeight } = pageSizeToPoints(target, options)

  const page = pdf.addPage([pageWidth, pageHeight])

  const slotWidth =
    (pageWidth - layout.marginX * 2 - layout.gutterX * (layout.columns - 1)) / layout.columns
  const slotHeight =
    (pageHeight - layout.marginY * 2 - layout.gutterY * (layout.rows - 1)) / layout.rows

  for (let index = 0; index < images.length; index += 1) {
    const image = images[index]
    const embeddedImage =
      image.format === 'jpeg' ? await pdf.embedJpg(image.data) : await pdf.embedPng(image.data)

    const column = index % layout.columns
    const row = Math.floor(index / layout.columns)

    const slotX = layout.marginX + column * (slotWidth + layout.gutterX)
    const slotY = pageHeight - layout.marginY - (row + 1) * slotHeight - row * layout.gutterY

    const scale = computeScale(
      embeddedImage.width,
      embeddedImage.height,
      slotWidth,
      slotHeight,
      options
    )

    const drawWidth = embeddedImage.width * scale
    const drawHeight = embeddedImage.height * scale

    const x = slotX + (slotWidth - drawWidth) / 2
    const y = slotY + (slotHeight - drawHeight) / 2

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight
    })
  }
}

function computeScale(
  imgWidth: number,
  imgHeight: number,
  maxWidth: number,
  maxHeight: number,
  options: NormalizedConversionOptions
): number {
  switch (options.scaling) {
    case 'original':
      return Math.min(1, maxWidth / imgWidth, maxHeight / imgHeight)
    case 'fit-width':
      return Math.min(maxWidth / imgWidth, 1)
    case 'fit-page':
    default:
      return Math.min(maxWidth / imgWidth, maxHeight / imgHeight)
  }
}

function pageSizeToPoints(
  image: ProcessedImage,
  options: NormalizedConversionOptions
): { width: number; height: number } {
  const inches = pageSizeToInches(image, options)
  return {
    width: inches.width * 72,
    height: inches.height * 72
  }
}

function pageSizeToInches(
  image: ProcessedImage,
  options: NormalizedConversionOptions
): { width: number; height: number } {
  switch (options.pageSize) {
    case 'Original':
      return imageToInches(image, options)
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

function groupImages(images: ProcessedImage[], perPage: number): ProcessedImage[][] {
  const result: ProcessedImage[][] = []
  for (let index = 0; index < images.length; index += perPage) {
    result.push(images.slice(index, index + perPage))
  }
  return result
}

interface PageLayout {
  columns: number
  rows: number
  slots: number
  marginX: number
  marginY: number
  gutterX: number
  gutterY: number
}

function resolveLayout(
  preset: NormalizedConversionOptions['pageLayout'],
  marginInches: number
): PageLayout {
  const marginPoints = Math.max(marginInches * 72, 0)
  const gutterPoints = marginPoints > 0 ? marginPoints / 2 : 12

  switch (preset) {
    case 'two':
      return {
        columns: 1,
        rows: 2,
        slots: 2,
        marginX: marginPoints,
        marginY: marginPoints,
        gutterX: 0,
        gutterY: gutterPoints
      }
    case 'four':
      return {
        columns: 2,
        rows: 2,
        slots: 4,
        marginX: marginPoints,
        marginY: marginPoints,
        gutterX: gutterPoints,
        gutterY: gutterPoints
      }
    case 'one':
    default:
      return {
        columns: 1,
        rows: 1,
        slots: 1,
        marginX: marginPoints,
        marginY: marginPoints,
        gutterX: 0,
        gutterY: 0
      }
  }
}

function tightenLayout(layout: PageLayout, itemCount: number): PageLayout {
  if (itemCount >= layout.slots) {
    return layout
  }

  if (layout.columns === 1) {
    return {
      ...layout,
      rows: itemCount,
      slots: itemCount
    }
  }

  if (itemCount <= layout.columns) {
    return {
      ...layout,
      columns: itemCount,
      rows: 1,
      slots: itemCount
    }
  }

  const rows = Math.ceil(itemCount / layout.columns)

  return {
    ...layout,
    rows,
    slots: itemCount
  }
}

function imageToInches(
  image: ProcessedImage,
  options: NormalizedConversionOptions
): { width: number; height: number } {
  const sourceDpi = image.density ?? options.sourceDpi ?? 300
  const targetDpi = options.targetDpi ?? sourceDpi

  return {
    width: image.width / targetDpi,
    height: image.height / targetDpi
  }
}
