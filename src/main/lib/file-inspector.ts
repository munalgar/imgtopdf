import { stat } from 'fs/promises'
import sharp from 'sharp'
import type { ImageFileInfo } from '@common/types'
import { filename, getExtension, isSupportedExtension } from './file-utils'

const PREVIEW_MAX_DIMENSION = 512

export async function inspectFiles(paths: string[]): Promise<ImageFileInfo[]> {
  return Promise.all(paths.map((path) => inspectFile(path)))
}

async function inspectFile(path: string): Promise<ImageFileInfo> {
  const baseInfo: ImageFileInfo = {
    path,
    name: filename(path),
    size: 0,
    format: getExtension(path) || 'unknown',
    supported: false
  }

  try {
    const fileStat = await stat(path)
    baseInfo.size = fileStat.size
  } catch (error) {
    baseInfo.error = toErrorMessage(error)
    return baseInfo
  }

  const extension = getExtension(path)
  baseInfo.format = extension || 'unknown'
  baseInfo.supported = isSupportedExtension(extension)

  if (!baseInfo.supported) {
    baseInfo.warning = 'Unsupported image format'
    return baseInfo
  }

  try {
    const metadata = await sharp(path, { failOn: 'none' }).metadata()
    baseInfo.width = metadata.width ?? undefined
    baseInfo.height = metadata.height ?? undefined
    if (metadata.format) {
      baseInfo.format = metadata.format
    }

    // Generate preview thumbnail up to PREVIEW_MAX_DIMENSION
    try {
      const previewPipeline = sharp(path, { failOn: 'none' })
        .rotate()
        .resize(PREVIEW_MAX_DIMENSION, PREVIEW_MAX_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true
        })

      const usingPng = metadata.hasAlpha === true

      const previewBuffer = await (
        usingPng
          ? previewPipeline.png({ compressionLevel: 6, adaptiveFiltering: true, effort: 4 })
          : previewPipeline.jpeg({ quality: 92, chromaSubsampling: '4:4:4', mozjpeg: true })
      ).toBuffer()

      const mimeType = usingPng ? 'image/png' : 'image/jpeg'

      baseInfo.preview = `data:${mimeType};base64,${previewBuffer.toString('base64')}`
    } catch (previewError) {
      // Preview generation failed, but this shouldn't fail the entire inspection
      console.warn(`Failed to generate preview for ${path}:`, previewError)
    }
  } catch (error) {
    baseInfo.warning = toErrorMessage(error)
  }

  return baseInfo
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}
