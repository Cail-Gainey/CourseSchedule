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
    <el-form :model="formData" label-width="120px" label-position="right" class="settings-form">
      <!-- 基础设置 -->
      <div class="setting-section">
        <div class="section-title">
          <el-icon><Setting /></el-icon>
          <span>基础设置</span>
        </div>

        <el-form-item label="界面主题">
          <el-radio-group v-model="formData.theme" @change="handleThemeChange" size="default">
            <el-radio-button label="auto">
              <el-icon><Setting /></el-icon>
              <span>自动</span>
            </el-radio-button>
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
      </div>

      <!-- 通知设置 -->
      <div class="setting-section">
        <div class="section-title">
          <el-icon><Bell /></el-icon>
          <span>通知设置</span>
        </div>

        <el-form-item label="启用通知">
          <div class="setting-item">
            <el-switch
              v-model="formData.notificationEnabled"
              size="default"
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="setting-help">开启后将在课程开始前发送桌面通知提醒</div>
          </div>
        </el-form-item>

        <el-form-item label="提前通知时间" v-if="formData.notificationEnabled">
          <div class="setting-item">
            <el-select
              v-model="formData.notificationMinutes"
              placeholder="选择提前通知时间"
              style="width: 200px"
              size="default"
            >
              <el-option label="5分钟" :value="5" />
              <el-option label="10分钟" :value="10" />
              <el-option label="15分钟" :value="15" />
              <el-option label="20分钟" :value="20" />
              <el-option label="30分钟" :value="30" />
            </el-select>
            <div class="setting-help">设置在课程开始前多长时间发送通知</div>
          </div>
        </el-form-item>

        <el-form-item label="通知权限状态" v-if="formData.notificationEnabled">
          <div class="setting-item">
            <div class="notification-permission-status">
              <el-tag 
                :type="getPermissionTagType()" 
                :icon="getPermissionIcon()"
                size="large"
              >
                {{ getPermissionStatusText() }}
              </el-tag>
              <el-button 
                v-if="needsPermissionRequest()"
                @click="requestNotificationPermission"
                type="primary"
                size="small"
                :loading="isRequestingPermission"
                style="margin-left: 10px;"
              >
                {{ isRequestingPermission ? '请求中...' : '请求权限' }}
              </el-button>
            </div>
            <div class="setting-help">浏览器通知权限状态，需要授权后才能发送桌面通知</div>
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
            <div class="setting-help">设置学期第一周的开始日期，用于自动计算当前周数和课程日期</div>
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
            <div class="setting-help">清空当前所有课程数据</div>
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
import { ref, reactive, watch } from 'vue'
import { useScheduleStore } from '../stores/schedule'
import { ElMessage } from 'element-plus'
import { Setting, Sunny, Moon, Calendar, FolderOpened, Delete, Bell, Check, Close, Warning } from '@element-plus/icons-vue'
import { notificationService } from '../services/notification.js'

const scheduleStore = useScheduleStore()

const showDialog = ref(false)
const formData = ref({
  theme: 'auto',
  firstWeekStart: '',
  notificationEnabled: false,
  notificationMinutes: 10
})

// 通知权限相关状态
const isRequestingPermission = ref(false)
const notificationPermission = ref('default')

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
    formData.firstWeekStart = settings.firstWeekStart || ''
    formData.notificationEnabled = settings.notificationEnabled || false
    formData.notificationMinutes = settings.notificationMinutes || 10
  } catch (error) {
    console.warn('加载设置失败:', error)
    // 即使加载失败也要保持当前主题
    formData.theme = currentThemeBeforeLoad
  }

  // 更新通知权限状态
  updateNotificationPermissionStatus()

  showDialog.value = true
}

const handleThemeChange = (theme) => {
  scheduleStore.currentTheme = theme
}

const handleSave = async () => {
  try {
    await scheduleStore.saveSettings({
      theme: formData.theme,
      autoSave: true, // 始终启用自动保存
      firstWeekStart: formData.firstWeekStart,
      notificationEnabled: formData.notificationEnabled,
      notificationMinutes: formData.notificationMinutes
    })

    ElMessage.success('设置保存成功')
    showDialog.value = false
  } catch (error) {
    ElMessage.error(`保存设置失败: ${error.message}`)
  }
}

// 更新通知权限状态
const updateNotificationPermissionStatus = () => {
  notificationPermission.value = notificationService.getPermissionStatus()
}

// 请求通知权限
const requestNotificationPermission = async () => {
  if (isRequestingPermission.value) return
  
  isRequestingPermission.value = true
  try {
    const permission = await notificationService.requestPermission()
    notificationPermission.value = permission
    
    if (permission === 'granted') {
      ElMessage.success('通知权限已授予')
    } else if (permission === 'denied') {
      ElMessage.warning('通知权限被拒绝，请在浏览器设置中手动开启')
    } else {
      ElMessage.info('通知权限请求已取消')
    }
  } catch (error) {
    console.error('请求通知权限失败:', error)
    ElMessage.error('请求通知权限失败')
  } finally {
    isRequestingPermission.value = false
  }
}

// 获取权限状态标签类型
const getPermissionTagType = () => {
  switch (notificationPermission.value) {
    case 'granted':
      return 'success'
    case 'denied':
      return 'danger'
    default:
      return 'warning'
  }
}

// 获取权限状态图标
const getPermissionIcon = () => {
  switch (notificationPermission.value) {
    case 'granted':
      return Check
    case 'denied':
      return Close
    default:
      return Warning
  }
}

// 获取权限状态文本
const getPermissionStatusText = () => {
  if (!notificationService.isNotificationSupported()) {
    return '浏览器不支持通知'
  }
  
  switch (notificationPermission.value) {
    case 'granted':
      return '已授权'
    case 'denied':
      return '已拒绝'
    default:
      return '未授权'
  }
}

// 是否需要显示权限请求按钮
const needsPermissionRequest = () => {
  return notificationService.isNotificationSupported() && 
         notificationPermission.value !== 'granted'
}

const handleCancel = () => {
  showDialog.value = false
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
  :deep(.el-dialog) {
    width: 80% !important;
    margin: 6vh auto !important;
    border-radius: 12px;
  }

  :deep(.el-dialog__header) {
    padding: 20px 24px 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__title) {
    font-size: 18px;
    font-weight: 600;
  }

  :deep(.el-dialog__body) {
    padding: 20px 24px;
    max-height: 65vh;
    overflow-y: auto;
  }

  :deep(.el-dialog__footer) {
    padding: 12px 24px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-form-item__label) {
    font-size: 14px;
    font-weight: 500;
  }

  .setting-section {
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 12px;
  }

  .section-title {
    font-size: 16px;
    margin-bottom: 16px;
  }

  .theme-options {
    flex-direction: column;
    gap: 12px;
  }

  .theme-option {
    padding: 12px;
    justify-content: center;
    border-radius: 8px;
  }

  .setting-help {
    margin-left: 0;
    margin-top: 8px;
    font-size: 12px;
    line-height: 1.4;
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
    font-size: 14px;
    padding: 12px 20px;
    border-radius: 8px;
    min-height: 44px;
  }

  :deep(.el-radio-button__inner) {
    font-size: 14px;
    padding: 12px 16px;
    border-radius: 8px;
  }

  :deep(.el-switch) {
    --el-switch-on-color: var(--el-color-primary);
  }
}

@media (max-width: 480px) {
  :deep(.el-dialog) {
    width: 85% !important;
    margin: 4vh auto !important;
    max-height: 90vh;
    border-radius: 16px;
  }

  :deep(.el-dialog__header) {
    padding: 16px 20px 10px;
  }

  :deep(.el-dialog__title) {
    font-size: 16px;
  }

  :deep(.el-dialog__body) {
    padding: 16px 20px;
    max-height: 70vh;
  }

  :deep(.el-dialog__footer) {
    padding: 10px 20px 16px;
  }

  :deep(.el-form) {
    --el-form-label-font-size: 13px;
  }

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__label) {
    width: 85px !important;
    font-size: 13px;
    line-height: 1.4;
  }

  .setting-section {
    padding: 16px;
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 14px;
    margin-bottom: 12px;
  }

  .setting-help {
    font-size: 11px;
    margin-top: 6px;
    line-height: 1.3;
  }

  :deep(.el-radio-button__inner) {
    font-size: 13px;
    padding: 10px 14px;
  }

  :deep(.el-button) {
    font-size: 14px;
    padding: 12px 16px;
    min-height: 48px;
    border-radius: 12px;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 8px;
  }

  .dialog-footer .el-button {
    width: 100%;
  }

  .el-form-item {
    margin-bottom: 16px;
  }

  .el-divider {
    margin: 16px 0;
  }
}

/* 超小屏幕适配 */
@media (max-width: 360px) {
  :deep(.el-dialog) {
    width: 88% !important;
    margin: 2vh auto !important;
  }

  :deep(.el-dialog__header) {
    padding: 12px 16px 8px;
  }

  :deep(.el-dialog__body) {
    padding: 12px 16px;
  }

  :deep(.el-dialog__footer) {
    padding: 8px 16px 12px;
  }

  :deep(.el-form-item__label) {
    width: 75px !important;
    font-size: 12px;
  }

  .setting-section {
    padding: 12px;
    margin-bottom: 12px;
  }

  .section-title {
    font-size: 13px;
    margin-bottom: 10px;
  }

  .setting-help {
    font-size: 10px;
  }

  :deep(.el-radio-button__inner) {
    font-size: 12px;
    padding: 8px 12px;
  }

  :deep(.el-button) {
    font-size: 13px;
    padding: 10px 14px;
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
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-5),
    var(--el-color-primary-light-3)
  );
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
