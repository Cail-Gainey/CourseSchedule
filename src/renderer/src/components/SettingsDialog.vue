<template>
  <el-dialog
    v-model="showDialog"
    title="系统设置"
    width="600px"
    :before-close="handleCancel"
    center
    destroy-on-close
    class="settings-dialog"
  >
    <el-form
      :model="formData"
      label-width="120px"
      label-position="right"
      class="settings-form"
    >
      <!-- 基础设置 -->
      <div class="setting-section">
        <div class="section-title">
          <el-icon><Setting /></el-icon>
          <span>基础设置</span>
        </div>
        
        <el-form-item label="界面主题">
          <el-radio-group v-model="formData.theme" @change="handleThemeChange" size="default">
            <el-radio-button label="light">
              <el-icon><Sunny /></el-icon>
              <span>浅色主题</span>
            </el-radio-button>
            <el-radio-button label="dark">
              <el-icon><Moon /></el-icon>
              <span>深色主题</span>
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="自动保存">
          <div class="setting-item">
            <el-switch v-model="formData.autoSave" size="default" />
            <div class="setting-help">
              开启后，数据修改将自动保存到本地存储
            </div>
          </div>
        </el-form-item>
      </div>

      <!-- 学期设置 -->
      <div class="setting-section">
        <div class="section-title">
          <el-icon><Calendar /></el-icon>
          <span>学期设置</span>
        </div>
        
        <el-form-item label="第一周开始">
          <div class="setting-item">
            <el-date-picker
              v-model="formData.firstWeekStart"
              type="date"
              placeholder="选择第一周开始日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 200px"
              size="default"
            />
            <div class="setting-help">
              设置学期第一周的开始日期，用于自动计算当前周数和课程日期
            </div>
          </div>
        </el-form-item>
      </div>



      <!-- 数据管理 -->
      <div class="setting-section">
        <div class="section-title">
          <el-icon><FolderOpened /></el-icon>
          <span>数据管理</span>
        </div>
        
        <el-form-item label="数据操作">
          <div class="setting-item">
            <el-space wrap size="default">
              <el-button @click="handleImportData" :loading="importing" :icon="Upload" size="default">
                导入数据
              </el-button>
              <el-popconfirm
                title="确定要清空所有数据吗？此操作无法恢复。"
                @confirm="handleClearData"
                width="280px"
              >
                <template #reference>
                  <el-button type="danger" :loading="clearing" :icon="Delete" size="default">
                    清空数据
                  </el-button>
                </template>
              </el-popconfirm>
            </el-space>
            <div class="setting-help">
              导入JSON格式的课程数据，或清空当前所有课程数据
            </div>
          </div>
        </el-form-item>
      </div>



    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useScheduleStore } from '../stores/schedule'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, Sunny, Moon, Calendar, FolderOpened, Upload, Delete } from '@element-plus/icons-vue'
import { storageService } from '../services/storage.js'

const scheduleStore = useScheduleStore()

const showDialog = ref(false)
const importing = ref(false)
const clearing = ref(false)

const formData = reactive({
  theme: 'light',
  autoSave: true,
  firstWeekStart: ''
})

const lastModifiedText = computed(() => {
  if (!scheduleStore.metadata.lastModified) return '未知'
  return new Date(scheduleStore.metadata.lastModified).toLocaleString('zh-CN')
})

watch(
  () => scheduleStore.currentTheme,
  (newTheme) => {
    formData.theme = newTheme
  },
  { immediate: true }
)

const openDialog = async () => {
  // 先记录当前主题状态
  const currentThemeBeforeLoad = scheduleStore.currentTheme
  
  // 加载设置
  try {
    await scheduleStore.loadSettings()
    const settings = scheduleStore.settings
    
    // 保持当前主题状态不变，避免被loadSettings重置
    scheduleStore.currentTheme = currentThemeBeforeLoad
    formData.theme = currentThemeBeforeLoad
    formData.autoSave = settings.autoSave
    formData.firstWeekStart = settings.firstWeekStart || ''
  } catch (error) {
    console.warn('加载设置失败:', error)
    // 即使加载失败也要保持当前主题
    formData.theme = currentThemeBeforeLoad
  }
  
  showDialog.value = true
}

const handleThemeChange = (theme) => {
  scheduleStore.currentTheme = theme
}

const handleSave = async () => {
  try {
    await scheduleStore.saveSettings({
      theme: formData.theme,
      autoSave: formData.autoSave,
      firstWeekStart: formData.firstWeekStart
    })
    
    ElMessage.success('设置保存成功')
    showDialog.value = false
  } catch (error) {
    ElMessage.error(`保存设置失败: ${error.message}`)
  }
}

const handleCancel = () => {
  showDialog.value = false
}



const handleImportData = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = async (event) => {
    importing.value = true
    try {
      const file = event.target.files[0]
      if (!file) {
        importing.value = false
        return
      }
      
      await ElMessageBox.confirm(
        '导入数据将覆盖现有所有内容，是否继续？',
        '确认导入',
        { type: 'warning' }
      )

      const text = await file.text()
      await storageService.importFromJSON(text)
      await scheduleStore.loadFromStorage()
      
      ElMessage.success('数据导入成功')
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error(`导入失败: ${error.message}`)
      }
    } finally {
      importing.value = false
    }
  }
  
  input.click()
}

const handleClearData = async () => {
  try {
    clearing.value = true
    await scheduleStore.clearAllData()
    ElMessage.success('数据清空成功')
  } catch (error) {
    ElMessage.error(`清空失败: ${error.message}`)
  } finally {
    clearing.value = false
  }
}

defineExpose({
  openDialog
})
</script>

<style scoped>
/* 对话框响应式样式 */
:deep(.settings-dialog) {
  max-width: 90vw;
}

:deep(.settings-dialog .el-dialog__body) {
  padding: var(--el-dialog-padding-primary);
}

.dialog-footer {
  text-align: right;
}

/* 设置区块样式 */
.setting-section {
  margin-bottom: var(--el-margin-large, 24px);
  padding: var(--el-padding-large, 20px);
  background-color: var(--el-fill-color-lighter);
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-lighter);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--el-margin-small, 8px);
  margin-bottom: var(--el-margin-base, 16px);
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-primary);
  color: var(--el-text-color-primary);
}

.section-title .el-icon {
  color: var(--el-color-primary);
}

.setting-item {
  width: 100%;
}

.setting-help {
  margin-top: var(--el-margin-small, 8px);
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-regular);
  line-height: 1.4;
  margin-left: var(--el-margin-small, 10px);
}

.theme-options {
  display: flex;
  gap: var(--el-margin-large, 16px);
}

.theme-option {
  display: flex;
  align-items: center;
  gap: var(--el-margin-small, 8px);
  padding: var(--el-padding-base, 12px);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  cursor: pointer;
  transition: all 0.3s;
}

.theme-option:hover {
  border-color: var(--el-color-primary);
}

.theme-option.active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.el-form-item {
  margin-bottom: var(--el-form-item-margin-bottom, 18px);
}

.el-divider {
  margin: var(--el-margin-large, 24px) 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  :deep(.settings-dialog) {
    width: 95vw !important;
    margin: 5vh auto;
  }
  
  :deep(.settings-dialog .el-dialog__header) {
    padding: var(--el-dialog-padding-primary) var(--el-dialog-padding-primary) 0;
  }
  
  :deep(.settings-dialog .el-dialog__body) {
    padding: var(--el-dialog-padding-primary);
    max-height: 70vh;
    overflow-y: auto;
  }

  :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
  }

  :deep(.el-dialog__header) {
    padding: var(--el-dialog-padding-primary, 15px 20px 10px);
  }

  :deep(.el-dialog__body) {
    padding: var(--el-dialog-content-padding, 10px 20px);
  }

  :deep(.el-dialog__footer) {
    padding: var(--el-dialog-padding-primary, 10px 20px 15px);
  }

  :deep(.el-form-item__label) {
    font-size: var(--el-font-size-small);
  }

  .setting-section {
    padding: var(--el-padding-base, 16px);
    margin-bottom: var(--el-margin-base, 16px);
  }
  
  .section-title {
    font-size: var(--el-font-size-base);
    margin-bottom: var(--el-margin-small, 12px);
  }
  
  .theme-options {
    flex-direction: column;
    gap: var(--el-margin-base, 12px);
  }
  
  .theme-option {
    padding: var(--el-padding-base, 10px);
    justify-content: center;
  }

  .setting-help {
    margin-left: 0;
    margin-top: var(--el-margin-extra-small, 5px);
    font-size: var(--el-font-size-extra-small);
  }

  :deep(.el-date-editor) {
    width: 100% !important;
  }

  :deep(.el-space) {
    width: 100%;
  }

  :deep(.el-space .el-space__item) {
    flex: 1;
  }

  :deep(.el-button) {
    font-size: var(--el-font-size-small);
    padding: var(--el-button-padding-vertical) var(--el-button-padding-horizontal);
  }

  .time-settings-header,
  .time-setting-row {
    grid-template-columns: 60px 100px 100px;
    gap: var(--el-margin-small, 8px);
  }

  .period-label {
    font-size: var(--el-font-size-small);
  }

  .time-setting-row :deep(.el-time-picker) {
    width: 90px !important;
  }
}

@media (max-width: 480px) {
  :deep(.el-dialog) {
    width: 98% !important;
    margin: 2vh auto !important;
  }

  :deep(.settings-dialog) {
    width: 98vw !important;
    margin: 2vh auto;
  }
  
  :deep(.settings-dialog .el-dialog__body) {
    padding: var(--el-padding-base, 12px);
    max-height: 80vh;
  }
  
  :deep(.settings-dialog .el-dialog__header) {
    padding: var(--el-padding-base, 12px) var(--el-padding-base, 12px) 0;
  }

  :deep(.el-form) {
    --el-form-label-font-size: 12px;
  }

  :deep(.el-form-item__label) {
    width: 80px !important;
    font-size: var(--el-font-size-small);
  }

  .setting-section {
    padding: var(--el-padding-small, 12px);
    margin-bottom: var(--el-margin-small, 12px);
  }
  
  .section-title {
    font-size: var(--el-font-size-small);
    margin-bottom: var(--el-margin-small, 8px);
  }

  .setting-help {
    font-size: var(--el-font-size-extra-small);
  }

  :deep(.el-radio-button__inner) {
    font-size: var(--el-font-size-small);
    padding: var(--el-button-padding-vertical) var(--el-button-padding-horizontal);
  }

  :deep(.el-button) {
    font-size: var(--el-font-size-small);
    padding: var(--el-padding-extra-small, 6px) var(--el-padding-small, 12px);
  }

  .el-form-item {
    margin-bottom: var(--el-margin-medium, 15px);
  }

  .el-divider {
    margin: var(--el-margin-large, 18px) 0;
  }

}

/* 对话框滚动条美化 */
:deep(.el-dialog__body) {
  scrollbar-width: thin;
  scrollbar-color: var(--el-color-primary-light-5) var(--el-fill-color-lighter);
}

:deep(.el-dialog__body)::-webkit-scrollbar {
  width: 8px;
}

:deep(.el-dialog__body)::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-border-radius-round);
  margin: 2px;
}

:deep(.el-dialog__body)::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--el-color-primary-light-3));
  border-radius: var(--el-border-radius-round);
  border: 1px solid var(--el-color-primary-light-8);
  transition: all var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier);
}

:deep(.el-dialog__body)::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
  border-color: var(--el-color-primary-light-6);
  transform: scale(1.1);
}

.time-settings-header,
.time-setting-row {
    grid-template-columns: 50px 80px 80px;
    gap: var(--el-margin-extra-small, 6px);
  }
  
  .time-setting-row :deep(.el-time-picker) {
    width: 75px !important;
  }
  
  .theme-option {
    padding: var(--el-padding-small, 8px);
    font-size: var(--el-font-size-small);
  }

  .time-settings-header,
  .time-setting-row {
    grid-template-columns: 50px 80px 80px;
    gap: var(--el-margin-extra-small, 6px);
  }
  
  .time-setting-row :deep(.el-time-picker) {
    width: 75px !important;
  }

.time-settings {
  width: 100%;
}

.time-settings-header {
  display: grid;
  grid-template-columns: 80px 120px 120px;
  gap: var(--el-margin-small, 10px);
  padding: var(--el-padding-small, 8px) 0;
  font-weight: var(--el-font-weight-primary);
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: var(--el-margin-small, 8px);
}

.time-setting-row {
  display: grid;
  grid-template-columns: 80px 120px 120px;
  gap: var(--el-margin-small, 10px);
  align-items: center;
  padding: var(--el-padding-extra-small, 4px) 0;
}

.period-label {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-regular);
}


</style>
