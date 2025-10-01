import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { ImageToPDFAPI, ProgressUpdate } from '@common/types'

const api: ImageToPDFAPI = {
  openFileDialog: () => ipcRenderer.invoke('dialog:open-files'),
  openSaveDialog: (defaultPath) => ipcRenderer.invoke('dialog:save-file', defaultPath),
  convertToPDF: (files, options) => ipcRenderer.invoke('conversion:start', { files, options }),
  inspectFiles: (paths) => ipcRenderer.invoke('files:inspect', paths),
  cancelConversion: () => ipcRenderer.send('conversion:cancel'),
  onProgress: (callback: (progress: ProgressUpdate) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: ProgressUpdate): void => {
      callback(progress)
    }
    ipcRenderer.on('conversion:progress', handler)
    return (): void => {
      ipcRenderer.removeListener('conversion:progress', handler)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
