import type { ConversionOptions, NormalizedConversionOptions } from '@common/types'

const DEFAULT_OPTIONS: Required<
  Pick<NormalizedConversionOptions, 'quality' | 'margin' | 'scaling' | 'pageSize' | 'pageLayout'>
> = {
  quality: 85,
  margin: 0.25,
  scaling: 'fit-page',
  pageSize: 'A4',
  pageLayout: 'one'
}

export function normalizeOptions(options: ConversionOptions): NormalizedConversionOptions {
  return {
    sourceDpi: options.sourceDpi,
    targetDpi: options.targetDpi,
    quality: options.quality ?? DEFAULT_OPTIONS.quality,
    pageSize: options.pageSize ?? DEFAULT_OPTIONS.pageSize,
    pageLayout: options.pageLayout ?? DEFAULT_OPTIONS.pageLayout,
    customWidth: options.customWidth,
    customHeight: options.customHeight,
    margin: options.margin ?? DEFAULT_OPTIONS.margin,
    scaling: options.scaling ?? DEFAULT_OPTIONS.scaling,
    preserveMetadata: options.preserveMetadata ?? true,
    outputPath: options.outputPath
  }
}
