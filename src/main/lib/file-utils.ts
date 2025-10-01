import { basename, extname } from 'path'
import type { SupportedImageFormat } from '@common/types'

export const SUPPORTED_EXTENSIONS: SupportedImageFormat[] = [
  'jpeg',
  'jpg',
  'png',
  'webp',
  'heic',
  'heif',
  'tiff',
  'tif',
  'bmp'
]

export function filename(path: string): string {
  return basename(path)
}

export function getExtension(path: string): string {
  return extname(path).replace('.', '').toLowerCase()
}

export function isSupportedExtension(ext: string): ext is SupportedImageFormat {
  return SUPPORTED_EXTENSIONS.includes(ext as SupportedImageFormat)
}

export function normalizeExtension(ext: string): SupportedImageFormat | undefined {
  return isSupportedExtension(ext) ? (ext as SupportedImageFormat) : undefined
}
