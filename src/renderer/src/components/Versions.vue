<script setup>
import { reactive } from 'vue'

// 安全的环境检测，避免在移动端崩溃
const getVersions = () => {
  try {
    if (
      typeof window !== 'undefined' &&
      window.electron &&
      window.electron.process &&
      window.electron.process.versions
    ) {
      return window.electron.process.versions
    }
  } catch (error) {
    console.warn('无法获取Electron版本信息，可能运行在非Electron环境中:', error)
  }

  // 返回默认值，适用于移动端或其他环境
  return {
    electron: 'N/A',
    chrome: 'N/A',
    node: 'N/A'
  }
}

const versions = reactive({ ...getVersions() })
</script>

<template>
  <ul class="versions">
    <li class="electron-version">Electron v{{ versions.electron }}</li>
    <li class="chrome-version">Chromium v{{ versions.chrome }}</li>
    <li class="node-version">Node v{{ versions.node }}</li>
  </ul>
</template>
