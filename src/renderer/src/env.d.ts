/// <reference types="vite/client" />

import type { ImageToPDFAPI } from '@common/types'

declare global {
  interface Window {
    api: ImageToPDFAPI
  }
}

export {}
