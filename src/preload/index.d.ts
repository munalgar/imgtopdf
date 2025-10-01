import { ElectronAPI } from '@electron-toolkit/preload'
import type { ImageToPDFAPI } from '@common/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: ImageToPDFAPI
  }
}
