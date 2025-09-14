<template>
  <el-dialog
    v-model="showDialog"
    title="课程详情"
    width="500px"
    :before-close="handleClose"
    destroy-on-close
  >
    <div class="course-detail">
      <div class="detail-item">
        <label>课程名称：</label>
        <span>{{ courseData.course }}</span>
      </div>
      <div class="detail-item">
        <label>教师姓名：</label>
        <span>{{ courseData.teacher }}</span>
      </div>
      <div class="detail-item">
        <label>上课地点：</label>
        <span>{{ courseData.location }}</span>
      </div>
      <div class="detail-item">
        <label>上课时间：</label>
        <span>{{ courseData.day }} {{ courseData.period }}</span>
      </div>
      <div class="detail-item">
        <label>周次范围：</label>
        <span>第{{ courseData.weeks }}周</span>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleEdit" :icon="Edit">
          编辑
        </el-button>
        <el-button type="danger" @click="handleDelete" :icon="Delete">
          删除
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useScheduleStore } from '../stores/schedule'

const scheduleStore = useScheduleStore()

const showDialog = ref(false)
const courseData = reactive({
  id: '',
  course: '',
  teacher: '',
  location: '',
  day: '',
  period: '',
  weeks: ''
})

const emit = defineEmits(['edit'])

const openDialog = (course) => {
  Object.assign(courseData, course)
  showDialog.value = true
}

const handleClose = () => {
  showDialog.value = false
}

const handleEdit = () => {
  emit('edit', courseData)
  showDialog.value = false
}

const handleDelete = () => {
  ElMessageBox.confirm(
    `确定要删除课程 "${courseData.course}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    try {
      scheduleStore.deleteCourse(courseData.id)
      ElMessage.success('课程删除成功')
      showDialog.value = false
    } catch (error) {
      ElMessage.error(`删除失败: ${error.message}`)
    }
  }).catch(() => {
    // 用户取消删除
  })
}

defineExpose({
  openDialog
})
</script>

<style scoped>
.course-detail {
  padding: 20px 0;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}

.detail-item label {
  width: 100px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex-shrink: 0;
}

.detail-item span {
  color: var(--el-text-color-regular);
  flex: 1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 80% !important;
    margin: 8vh auto !important;
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
  }

  :deep(.el-dialog__footer) {
    padding: 12px 24px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .course-detail {
    padding: 0;
  }

  .detail-item {
    margin-bottom: 16px;
    font-size: 14px;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-extra-light);
  }

  .detail-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .detail-item label {
    width: 90px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  .detail-item span {
    font-size: 14px;
    font-weight: 500;
  }

  .dialog-footer {
    gap: 12px;
  }

  .dialog-footer .el-button {
    font-size: 14px;
    padding: 12px 20px;
    border-radius: 8px;
    min-height: 44px;
  }
}

@media (max-width: 480px) {
  :deep(.el-dialog) {
    width: 85% !important;
    margin: 5vh auto !important;
    max-height: 85vh;
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
    max-height: 60vh;
    overflow-y: auto;
  }

  :deep(.el-dialog__footer) {
    padding: 10px 20px 16px;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 12px;
    font-size: 13px;
    padding: 10px 0;
  }

  .detail-item label {
    width: auto;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 600;
  }

  .detail-item span {
    font-size: 13px;
    line-height: 1.4;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 8px;
  }

  .dialog-footer .el-button {
    width: 100%;
    font-size: 14px;
    padding: 12px 16px;
    min-height: 48px;
    border-radius: 12px;
  }
}

/* 超小屏幕适配 */
@media (max-width: 360px) {
  :deep(.el-dialog) {
    width: 88% !important;
    margin: 3vh auto !important;
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

  .detail-item {
    font-size: 12px;
    padding: 8px 0;
  }

  .detail-item label {
    font-size: 11px;
  }

  .detail-item span {
    font-size: 12px;
  }
}
</style>