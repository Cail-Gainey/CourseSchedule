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

/* 响应式设计 */
@media (max-width: 768px) {
  .time-settings-dialog {
    width: 90vw !important;
    margin: 0 auto;
  }
  
  .time-settings-header,
  .time-setting-row {
    grid-template-columns: 60px 1fr 1fr;
    gap: 8px;
  }
  
  .period-label {
    font-size: 12px;
  }
}
</style>