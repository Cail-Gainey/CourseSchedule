import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Store from 'electron-store'
import icon from '../../resources/icon.png?asset'

// 初始化 electron-store
const store = new Store({
  name: 'course-schedule-data',
  defaults: {
    courses: [],
    settings: {
      theme: 'light',
      language: 'zh-CN',
      autoSave: true
    }
  }
})

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
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

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Storage IPC handlers
  ipcMain.handle('storage-get', async (event, key) => {
    try {
      return store.get(key)
    } catch (error) {
      console.error('Storage get error:', error)
      throw error
    }
  })

  ipcMain.handle('storage-set', async (event, key, value) => {
    try {
      store.set(key, value)
      return true
    } catch (error) {
      console.error('Storage set error:', error)
      throw error
    }
  })

  ipcMain.handle('storage-delete', async (event, key) => {
    try {
      store.delete(key)
      return true
    } catch (error) {
      console.error('Storage delete error:', error)
      throw error
    }
  })

  ipcMain.handle('storage-clear', async () => {
    try {
      store.clear()
      return true
    } catch (error) {
      console.error('Storage clear error:', error)
      throw error
    }
  })

  ipcMain.handle('storage-has', async (event, key) => {
    try {
      return store.has(key)
    } catch (error) {
      console.error('Storage has error:', error)
      throw error
    }
  })

  // File dialog handlers
  ipcMain.handle('show-open-dialog', async (event, options) => {
    const { dialog } = require('electron')
    try {
      const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), options)
      return result
    } catch (error) {
      console.error('Open dialog error:', error)
      throw error
    }
  })

  ipcMain.handle('show-save-dialog', async (event, options) => {
    const { dialog } = require('electron')
    try {
      const result = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), options)
      return result
    } catch (error) {
      console.error('Save dialog error:', error)
      throw error
    }
  })

  // File system handlers
  ipcMain.handle('read-file', async (event, filePath) => {
    const fs = require('fs').promises
    try {
      const data = await fs.readFile(filePath)
      return data
    } catch (error) {
      console.error('Read file error:', error)
      throw error
    }
  })

  ipcMain.handle('write-file', async (event, filePath, data) => {
    const fs = require('fs').promises
    try {
      await fs.writeFile(filePath, data)
      return true
    } catch (error) {
      console.error('Write file error:', error)
      throw error
    }
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
