export type PageSizePreset = 'A4' | 'A3' | 'Letter' | 'Legal' | 'Custom' | 'Original'

export type PageLayoutPreset = 'one' | 'two' | 'four'

export type ScalingMode = 'fit-page' | 'fit-width' | 'original'

export interface ConversionOptions {
  sourceDpi?: number
  targetDpi?: number
  quality?: number
  pageSize?: PageSizePreset
  pageLayout?: PageLayoutPreset
  customWidth?: number
  customHeight?: number
  margin?: number
  scaling?: ScalingMode
  preserveMetadata?: boolean
  outputPath?: string
}

export interface NormalizedConversionOptions {
  sourceDpi?: number
  targetDpi?: number
  quality: number
  pageSize: PageSizePreset
  pageLayout: PageLayoutPreset
  customWidth?: number
  customHeight?: number
  margin: number
  scaling: ScalingMode
  preserveMetadata: boolean
  outputPath?: string
}

export type SupportedImageFormat =
  | 'jpeg'
  | 'jpg'
  | 'png'
  | 'webp'
  | 'heic'
  | 'heif'
  | 'tiff'
  | 'tif'
  | 'bmp'

export interface ProgressUpdate {
  stage: 'idle' | 'preparing' | 'processing' | 'writing' | 'completed' | 'error'
  current?: number
  total?: number
  message?: string
  error?: string
  outputPath?: string
}

export interface ConversionSummary {
  outputPath: string
  warnings: string[]
  durationMs: number
}

export interface ImageFileInfo {
  path: string
  name: string
  size: number
  format: string
  width?: number
  height?: number
  supported: boolean
  warning?: string
  error?: string
  preview?: string // base64 encoded image preview
}

export interface ImageToPDFAPI {
  openFileDialog(): Promise<string[]>
  openSaveDialog(defaultPath?: string): Promise<string | undefined>
  convertToPDF(files: string[], options: ConversionOptions): Promise<ConversionSummary>
  inspectFiles(paths: string[]): Promise<ImageFileInfo[]>
  cancelConversion(): void
  onProgress(callback: (progress: ProgressUpdate) => void): () => void
}
