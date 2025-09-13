<template>
  <MainLayout />
</template>

<script setup>
import MainLayout from './components/MainLayout.vue'
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: var(--el-font-family);
  background-color: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
  transition: all var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier);
}

* {
  box-sizing: border-box;
}

#app {
  overflow: hidden;
}

/* Element Plus 暗黑模式会自动使用其内置的CSS变量 */

/* 全局美化滚动条样式 - 使用Element Plus设计系统 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-border-radius-round);
  margin: 2px;
}

::-webkit-scrollbar-thumb {
  background: var(--el-color-primary-light-5);
  border-radius: var(--el-border-radius-round);
  transition: all var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier);
  border: 1px solid var(--el-fill-color-light);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--el-color-primary-light-3);
  border-color: var(--el-color-primary-light-7);
}

::-webkit-scrollbar-thumb:active {
  background: var(--el-color-primary);
}

::-webkit-scrollbar-corner {
  background: var(--el-fill-color-lighter);
}

/* 暗黑模式下的滚动条优化 */
.dark ::-webkit-scrollbar-track {
  background: var(--el-fill-color-dark);
}

.dark ::-webkit-scrollbar-thumb {
  background: var(--el-color-primary-light-7);
  border-color: var(--el-fill-color);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: var(--el-color-primary-light-5);
  border-color: var(--el-color-primary-light-9);
}

.dark ::-webkit-scrollbar-thumb:active {
  background: var(--el-color-primary-light-3);
}

.dark ::-webkit-scrollbar-corner {
  background: var(--el-fill-color-dark);
}

/* 全局移动端适配 */
@media (max-width: 768px) {
  html {
    font-size: 14px;
  }

  body {
    font-size: 14px;
  }

  #app {
    min-width: 320px;
  }

  /* Element Plus 组件全局移动端优化 */
  .el-button {
    min-height: var(--el-component-size-default, 36px);
    border-radius: var(--el-border-radius-base);
  }

  .el-input {
    font-size: var(--el-font-size-base);
  }

  .el-select {
    font-size: var(--el-font-size-base);
  }

  .el-dialog {
    border-radius: var(--el-border-radius-large);
    box-shadow: var(--el-box-shadow-dark);
  }

  .el-card {
    border-radius: var(--el-border-radius-base);
    box-shadow: var(--el-box-shadow-light);
  }

  .el-table {
    font-size: var(--el-font-size-small);
  }
}

@media (max-width: 480px) {
  html {
    font-size: 13px;
  }

  body {
    font-size: 13px;
  }

  /* 超小屏幕优化 */
  .el-button {
    min-height: var(--el-component-size-small, 32px);
    font-size: var(--el-font-size-small);
    padding: var(--el-button-padding-vertical) var(--el-button-padding-horizontal);
  }

  .el-input {
    font-size: var(--el-font-size-small);
  }

  .el-select {
    font-size: var(--el-font-size-small);
  }

  .el-table {
    font-size: var(--el-font-size-extra-small);
  }

  .el-message {
    min-width: 280px;
    max-width: 90vw;
    border-radius: var(--el-border-radius-base);
  }

  .el-notification {
    width: 90vw;
    max-width: 320px;
    border-radius: var(--el-border-radius-base);
  }
}

/* Element Plus 组件滚动条美化 */
/* 下拉菜单滚动条 */
.el-select-dropdown .el-scrollbar__wrap {
  scrollbar-width: thin;
  scrollbar-color: var(--el-color-primary-light-5) var(--el-fill-color-lighter);
}

.el-select-dropdown .el-scrollbar__wrap::-webkit-scrollbar {
  width: 6px;
}

.el-select-dropdown .el-scrollbar__wrap::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-border-radius-round);
}

.el-select-dropdown .el-scrollbar__wrap::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--el-color-primary-light-3));
  border-radius: var(--el-border-radius-round);
  transition: all var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier);
}

.el-select-dropdown .el-scrollbar__wrap::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
}

/* 下拉菜单滚动条 */
.el-dropdown-menu .el-scrollbar__wrap {
  scrollbar-width: thin;
  scrollbar-color: var(--el-color-primary-light-5) var(--el-fill-color-lighter);
}

.el-dropdown-menu .el-scrollbar__wrap::-webkit-scrollbar {
  width: 6px;
}

.el-dropdown-menu .el-scrollbar__wrap::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-border-radius-round);
}

.el-dropdown-menu .el-scrollbar__wrap::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--el-color-primary-light-3));
  border-radius: var(--el-border-radius-round);
  transition: all var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier);
}

.el-dropdown-menu .el-scrollbar__wrap::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
}

/* 表格滚动条 */
.el-table .el-scrollbar__wrap {
  scrollbar-width: thin;
  scrollbar-color: var(--el-color-primary-light-5) var(--el-fill-color-lighter);
}

.el-table .el-scrollbar__wrap::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.el-table .el-scrollbar__wrap::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-border-radius-round);
}

.el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--el-color-primary-light-3));
  border-radius: var(--el-border-radius-round);
  transition: all var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier);
}

.el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .el-button {
    min-height: 44px;
  }

  .el-input__inner {
    min-height: 40px;
  }

  .el-select .el-input__inner {
    min-height: 40px;
  }

  /* 增加点击区域 */
  .course-cell {
    min-height: 80px;
  }

  .add-button {
    min-height: 40px;
    min-width: 40px;
  }
}
</style>
