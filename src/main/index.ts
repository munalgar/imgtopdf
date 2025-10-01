import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import iconPng from '../../assets/app-icon/imgtopdf-icon.png?asset'
import iconIco from '../../assets/app-icon/imgtopdf.ico?asset'
import { createConversionController } from '@main/lib/conversion-controller'
import { SUPPORTED_EXTENSIONS } from '@main/lib/file-utils'
import { inspectFiles } from '@main/lib/file-inspector'
import type { ConversionOptions } from '@common/types'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: process.platform === 'win32' ? iconIco : iconPng,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const conversionController = createConversionController()

  ipcMain.handle('dialog:open-files', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Images',
          extensions: SUPPORTED_EXTENSIONS
        }
      ]
    })
    if (result.canceled) return []
    return result.filePaths
  })

  ipcMain.handle('dialog:save-file', async (_event, defaultPath?: string) => {
    const result = await dialog.showSaveDialog({
      title: 'Save PDF',
      defaultPath,
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
    })
    if (result.canceled) return undefined
    return result.filePath ?? undefined
  })

  ipcMain.handle('files:inspect', (_event, paths: string[]) => inspectFiles(paths))

  ipcMain.handle(
    'conversion:start',
    async (event, payload: { files: string[]; options: ConversionOptions }) => {
      return conversionController.convert(payload.files, payload.options, event.sender)
    }
  )

  ipcMain.on('conversion:cancel', () => {
    conversionController.cancel()
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
