<template>
  <el-dialog
    v-model="showDialog"
    title="课程时间设置"
    width="500px"
    :before-close="handleCancel"
    center
    destroy-on-close
    class="time-settings-dialog"
  >
    <el-form
      :model="formData"
      label-width="80px"
      label-position="right"
      class="time-form"
    >
      <div class="setting-section">
        <div class="section-title">
          <el-icon><Clock /></el-icon>
          <span>课程时间安排</span>
        </div>
        
        <el-form-item>
          <div class="time-settings">
            <div class="time-settings-header">
              <span class="period-header">节次</span>
              <span class="time-header">开始时间</span>
              <span class="time-header">结束时间</span>
            </div>
            <div 
              v-for="(period, index) in formData.periodTimes" 
              :key="index" 
              class="time-setting-row"
            >
              <span class="period-label">第{{ index + 1 }}节</span>
              <el-time-picker
                v-model="period.startTime"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="开始时间"
                style="width: 120px"
                size="default"
              />
              <el-time-picker
                v-model="period.endTime"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="结束时间"
                style="width: 120px"
                size="default"
              />
            </div>
            <div class="setting-help">
              设置每节课的开始和结束时间，用于在课程表中显示具体时间
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
import { ref, reactive, watch } from 'vue'
import { useScheduleStore } from '../stores/schedule'
import { ElMessage } from 'element-plus'
import { Clock } from '@element-plus/icons-vue'

const scheduleStore = useScheduleStore()

const showDialog = ref(false)

const formData = reactive({
  periodTimes: [
    { startTime: '08:00', endTime: '08:45' },
    { startTime: '08:55', endTime: '09:40' },
    { startTime: '10:00', endTime: '10:45' },
    { startTime: '10:55', endTime: '11:40' },
    { startTime: '14:00', endTime: '14:45' },
    { startTime: '14:55', endTime: '15:40' },
    { startTime: '16:00', endTime: '16:45' },
    { startTime: '16:55', endTime: '17:40' },
    { startTime: '19:00', endTime: '19:45' },
    { startTime: '19:55', endTime: '20:40' },
    { startTime: '20:50', endTime: '21:35' },
    { startTime: '21:45', endTime: '22:30' }
  ]
})

// 监听设置变化，同步到表单
watch(() => scheduleStore.settings, (newSettings) => {
  if (newSettings && newSettings.periodTimes) {
    formData.periodTimes = [...newSettings.periodTimes]
  }
}, { immediate: true, deep: true })

const openDialog = () => {
  // 加载当前设置
  if (scheduleStore.settings && scheduleStore.settings.periodTimes) {
    formData.periodTimes = [...scheduleStore.settings.periodTimes]
  }
  showDialog.value = true
}

const handleCancel = () => {
  showDialog.value = false
}

const handleSave = async () => {
  try {
    // 验证时间设置
    for (let i = 0; i < formData.periodTimes.length; i++) {
      const period = formData.periodTimes[i]
      if (!period.startTime || !period.endTime) {
        ElMessage.warning(`请设置第${i + 1}节课的时间`)
        return
      }
      
      // 验证开始时间小于结束时间
      if (period.startTime >= period.endTime) {
        ElMessage.warning(`第${i + 1}节课的开始时间必须小于结束时间`)
        return
      }
    }
    
    // 保存到store
    const newSettings = {
      ...scheduleStore.settings,
      periodTimes: [...formData.periodTimes]
    }
    
    await scheduleStore.saveSettings(newSettings)
    
    ElMessage.success('课程时间设置已保存')
    showDialog.value = false
  } catch (error) {
    ElMessage.error(`保存失败: ${error.message}`)
    console.error('保存课程时间设置失败:', error)
  }
}

// 暴露方法给父组件
defineExpose({
  openDialog
})
</script>

<style scoped>
.time-settings-dialog {
  --el-dialog-border-radius: 12px;
}

.setting-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.time-settings {
  width: 100%;
}

.time-settings-header {
  display: grid;
  grid-template-columns: 80px 1fr 1fr;
  gap: 12px;
  align-items: center;
  padding: 8px 0;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.period-header {
  text-align: center;
}

.time-header {
  text-align: center;
}

.time-setting-row {
  display: grid;
  grid-template-columns: 80px 1fr 1fr;
  gap: 12px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.time-setting-row:last-child {
  border-bottom: none;
}

.period-label {
  text-align: center;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.setting-help {
  margin-top: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.time-form {
  max-height: 60vh;
  overflow-y: auto;
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

  .time-form {
    max-height: none;
  }
  
  .time-settings-header,
  .time-setting-row {
    grid-template-columns: 70px 1fr 1fr;
    gap: 12px;
  }
  
  .period-label {
    font-size: 13px;
    font-weight: 500;
  }

  :deep(.el-time-picker) {
    width: 100% !important;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    padding: 12px 16px;
    min-height: 44px;
  }

  :deep(.el-button) {
    font-size: 14px;
    padding: 12px 20px;
    border-radius: 8px;
    min-height: 44px;
  }

  .setting-help {
    font-size: 12px;
    margin-top: 16px;
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

  .section-title {
    font-size: 14px;
    margin-bottom: 16px;
  }

  .time-settings-header {
    font-size: 12px;
    margin-bottom: 12px;
  }
  
  .time-settings-header,
  .time-setting-row {
    grid-template-columns: 60px 1fr 1fr;
    gap: 8px;
  }
  
  .period-label {
    font-size: 12px;
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    padding: 12px 16px;
    min-height: 48px;
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

  .setting-help {
    font-size: 11px;
    margin-top: 12px;
    line-height: 1.3;
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

  .time-settings-header,
  .time-setting-row {
    grid-template-columns: 50px 1fr 1fr;
    gap: 6px;
  }

  .period-label {
    font-size: 11px;
  }

  :deep(.el-input__inner) {
    font-size: 13px;
    padding: 10px 12px;
  }

  .setting-help {
    font-size: 10px;
  }
}
</style>