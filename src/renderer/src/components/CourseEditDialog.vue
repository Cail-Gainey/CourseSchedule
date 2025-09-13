<template>
  <el-dialog
    v-model="showDialog"
    :title="isEditMode ? '编辑课程' : '添加课程'"
    width="500px"
    :before-close="handleCancel"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      label-position="right"
    >
      <el-form-item label="课程名称" prop="course">
        <el-input
          v-model="formData.course"
          placeholder="请输入课程名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="教师姓名" prop="teacher">
        <el-input
          v-model="formData.teacher"
          placeholder="请输入教师姓名"
          maxlength="30"
        />
      </el-form-item>

      <el-form-item label="上课地点" prop="location">
        <el-input
          v-model="formData.location"
          placeholder="请输入上课地点"
          maxlength="30"
        />
      </el-form-item>

      <el-form-item label="星期" prop="day">
        <el-select
          v-model="formData.day"
          placeholder="请选择星期"
          style="width: 100%"
        >
          <el-option
            v-for="item in dayOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="节次" prop="period">
        <el-select
          v-model="formData.period"
          placeholder="请选择节次"
          style="width: 100%"
        >
          <el-option
            v-for="item in periodOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="周次范围" prop="weeks">
        <el-input
          v-model="formData.weeks"
          placeholder="例如: 1-16 或 1-8,10-16"
          maxlength="50"
        />
        <div class="weeks-help">
          支持格式：1-16 (连续), 1,3,5 (不连续), 1-8,10-16 (混合)
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave">
          {{ isEditMode ? '保存' : '添加' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useScheduleStore } from '../stores/schedule'
import { DAYS_OF_WEEK, PERIODS } from '../types/index.js'
import { ElMessage } from 'element-plus'

const scheduleStore = useScheduleStore()

const showDialog = ref(false)
const isEditMode = ref(false)
const editingCourseId = ref('')

const formRef = ref(null)

const defaultFormData = {
  course: '',
  teacher: '',
  location: '',
  day: '',
  period: '',
  weeks: '1-16'
}

const formData = reactive({ ...defaultFormData })

const dayOptions = DAYS_OF_WEEK.map(day => ({ label: day, value: day }))
const periodOptions = PERIODS.map(period => ({ label: period, value: period }))

const formRules = {
  course: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  teacher: [{ required: true, message: '请输入教师姓名', trigger: 'blur' }],
  location: [{ required: true, message: '请输入上课地点', trigger: 'blur' }],
  day: [{ required: true, message: '请选择星期', trigger: 'change' }],
  period: [{ required: true, message: '请选择节次', trigger: 'change' }],
  weeks: [
    { required: true, message: '请输入周次范围', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!value) return callback()
        const weekPattern = /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/
        if (weekPattern.test(value.trim())) {
          callback()
        } else {
          callback(new Error('周次格式不正确'))
        }
      },
      trigger: 'blur'
    }
  ]
}

const resetForm = () => {
  Object.assign(formData, defaultFormData)
}

const openAddDialog = (day = '', period = '') => {
  isEditMode.value = false
  editingCourseId.value = ''
  resetForm()
  
  if (day) formData.day = day
  if (period) formData.period = period
  
  showDialog.value = true
}

const openEditDialog = (course) => {
  isEditMode.value = true
  editingCourseId.value = course.id
  
  Object.assign(formData, {
    course: course.course,
    teacher: course.teacher,
    location: course.location,
    day: course.day,
    period: course.period,
    weeks: course.weeks
  })
  
  showDialog.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const courseData = { ...formData }
        if (isEditMode.value) {
          await scheduleStore.updateCourse(editingCourseId.value, courseData)
          ElMessage.success('课程更新成功')
        } else {
          await scheduleStore.addCourse(courseData)
          ElMessage.success('课程添加成功')
        }
        showDialog.value = false
      } catch (error) {
        ElMessage.error(error.message || '操作失败')
      }
    } else {
      console.log('表单验证失败')
    }
  })
}

const handleCancel = () => {
  showDialog.value = false
}

defineExpose({
  openAddDialog,
  openEditDialog
})
</script>

<style scoped>
.weeks-help {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  margin-top: 2px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 5vh auto !important;
  }

  :deep(.el-dialog__header) {
    padding: 15px 20px 10px;
  }

  :deep(.el-dialog__body) {
    padding: 10px 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 10px 20px 15px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
  }

  :deep(.el-input__inner) {
    font-size: 14px;
  }

  :deep(.el-select .el-input__inner) {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  :deep(.el-dialog) {
    width: 98% !important;
    margin: 2vh auto !important;
  }

  :deep(.el-form) {
    --el-form-label-font-size: 12px;
  }

  :deep(.el-form-item__label) {
    width: 80px !important;
    font-size: 12px;
  }

  :deep(.el-input__inner) {
    font-size: 13px;
    padding: 8px 12px;
  }

  .weeks-help {
    font-size: 11px;
  }
}
</style>
