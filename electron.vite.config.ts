import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const alias = {
  '@common': resolve('src/common'),
  '@main': resolve('src/main'),
  '@renderer': resolve('src/renderer/src')
}

export default defineConfig({
  main: {
    resolve: {
      alias
    },
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    resolve: {
      alias
    },
    plugins: [externalizeDepsPlugin(), tailwindcss()]
  },
  renderer: {
    resolve: {
      alias
    },
    plugins: [react()]
  }
})
