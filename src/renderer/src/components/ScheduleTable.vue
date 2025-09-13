<template>
  <div class="schedule-table" @click="closeContextMenu" :style="adaptiveStyles">
    <el-card shadow="never">
      <el-scrollbar class="table-scrollbar">
        <div class="table-container">
          <table class="schedule-grid">
          <!-- 表头 -->
          <thead>
            <tr>
              <th class="time-header">节次/星期</th>
              <th v-for="day in DAYS_OF_WEEK" :key="day" class="day-header">
                {{ day }}
              </th>
            </tr>
          </thead>
          
          <!-- 表体 -->
          <tbody>
            <tr v-for="period in PERIODS" :key="period">
              <td class="period-cell">
                <div class="period-info">
                  <div class="period-number">{{ period }}</div>
                  <div class="period-time">{{ getPeriodDisplayText(period) }}</div>
                </div>
              </td>
              <td
                v-for="day in DAYS_OF_WEEK"
                :key="`${day}-${period}`"
                class="course-cell"
                @click.left.stop="handleCellClick(day, period)"
                @contextmenu.prevent.stop="handleCellRightClick($event, day, period)"
              >
                <CourseCard
                  v-if="getCourseInSlot(day, period)"
                  :course="getCourseInSlot(day, period)"
                  @detail="handleCourseDetail"
                />
                <div v-else class="empty-cell">
                  <el-button
                    link
                    class="add-button"
                    @click.stop="handleAddCourse(day, period)"
                  >
                    <el-icon><Plus /></el-icon>
                    <span>添加课程</span>
                  </el-button>
                </div>
              </td>
            </tr>
          </tbody>
          </table>
        </div>
      </el-scrollbar>
    </el-card>

    <!-- 右键菜单 -->
    <div
      v-if="showContextMenu"
      class="context-menu"
      :style="{ left: `${contextMenuX}px`, top: `${contextMenuY}px` }"
    >
      <el-menu @select="handleContextMenuSelect">
        <template v-if="contextMenuHasCourse">
          <el-menu-item index="edit">
            <el-icon><Edit /></el-icon>
            <span>编辑课程</span>
          </el-menu-item>
          <el-menu-item index="delete">
            <el-icon><Delete /></el-icon>
            <span>删除课程</span>
          </el-menu-item>
        </template>
        <template v-else>
          <el-menu-item index="add">
            <el-icon><Plus /></el-icon>
            <span>添加课程</span>
          </el-menu-item>
        </template>
      </el-menu>
    </div>

    <!-- 课程详情弹窗 -->
    <CourseDetailDialog
      ref="courseDetailDialog"
      @edit="handleDetailEdit"
    />
  </div>
</template>

<script setup>
import { ref, computed, inject, nextTick, onMounted, onUnmounted } from 'vue'
import { useScheduleStore } from '../stores/schedule'
import { DAYS_OF_WEEK, PERIODS } from '../types/index.js'
import { getTimeSlotKey, getPeriodTimeText } from '../utils/index.js'
import CourseCard from './CourseCard.vue'
import CourseDetailDialog from './CourseDetailDialog.vue'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const scheduleStore = useScheduleStore()
const courseEditDialog = inject('courseEditDialog')

// 响应式窗口尺寸
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

// 计算自适应样式
const adaptiveStyles = computed(() => {
  const width = windowWidth.value
  const height = windowHeight.value
  
  // 基础配置
  let cellHeight = 90
  let fontSize = 'var(--el-font-size-small)'
  let cardPadding = 'var(--el-card-padding, 8px)'
  let headerPadding = 'var(--el-table-header-padding, 12px 8px)'
  
  // 根据窗口宽度调整
  if (width < 600) {
    // 超小屏幕：增加高度以适应信息显示
    cellHeight = 120
    fontSize = 'var(--el-font-size-extra-small)'
    cardPadding = 'var(--el-padding-small, 6px)'
    headerPadding = '6px 2px'
  } else if (width < 768) {
    // 小屏幕
    cellHeight = 100
    fontSize = 'var(--el-font-size-small)'
    cardPadding = 'var(--el-padding-small, 6px)'
    headerPadding = '8px 4px'
  } else if (width < 1024) {
    // 中等屏幕
    cellHeight = 85
    fontSize = 'var(--el-font-size-small)'
    cardPadding = 'var(--el-card-padding, 7px)'
    headerPadding = '10px 6px'
  } else if (width < 1200) {
    // 大屏幕
    cellHeight = 90
    fontSize = 'var(--el-font-size-small)'
    cardPadding = 'var(--el-card-padding, 8px)'
    headerPadding = 'var(--el-table-header-padding, 12px 8px)'
  } else {
    // 超大屏幕：可以适当增加高度以更好展示信息
    cellHeight = 100
    fontSize = 'var(--el-font-size-base)'
    cardPadding = 'var(--el-card-padding, 10px)'
    headerPadding = 'var(--el-table-header-padding, 15px 10px)'
  }
  
  // 根据窗口高度进一步调整
  if (height < 600) {
    cellHeight = Math.max(cellHeight - 10, 70)
  } else if (height > 900) {
    cellHeight += 10
  }
  
  return {
    '--adaptive-cell-height': `${cellHeight}px`,
    '--adaptive-font-size': fontSize,
    '--adaptive-card-padding': cardPadding,
    '--adaptive-header-padding': headerPadding,
    '--adaptive-card-min-height': `${cellHeight - 10}px`
  }
})

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
const courseDetailDialog = ref(null)

const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuDay = ref('')
const contextMenuPeriod = ref('')
const contextMenuHasCourse = ref(false)

// 计算显示的时间文本
const getPeriodDisplayText = (period) => {
  return getPeriodTimeText(period, scheduleStore.settings.periodTimes)
}

const getCourseInSlot = (day, period) => {
  const key = getTimeSlotKey(day, period)
  const courses = scheduleStore.coursesByTimeSlot.get(key)
  return courses && courses.length > 0 ? courses[0] : null
}

const handleCellClick = (day, period) => {
  closeContextMenu()
  const course = getCourseInSlot(day, period)
  if (!course) {
    handleAddCourse(day, period)
  }
}

const handleCourseDetail = (course) => {
  if (courseDetailDialog.value) {
    courseDetailDialog.value.openDialog(course)
  }
}

const handleDetailEdit = (course) => {
  if (courseEditDialog.value) {
    courseEditDialog.value.openEditDialog(course)
  }
}

const handleCellRightClick = (event, day, period) => {
  event.preventDefault()
  showContextMenu.value = true
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  contextMenuDay.value = day
  contextMenuPeriod.value = period
  contextMenuHasCourse.value = !!getCourseInSlot(day, period)
}

const closeContextMenu = () => {
  showContextMenu.value = false
}

const handleContextMenuSelect = (key) => {
  const day = contextMenuDay.value
  const period = contextMenuPeriod.value
  const course = getCourseInSlot(day, period)
  
  switch (key) {
    case 'add':
      handleAddCourse(day, period)
      break
    case 'edit':
      if (course) handleEditCourse(course)
      break
    case 'delete':
      if (course) handleDeleteCourse(course)
      break
  }
  
  closeContextMenu()
}

const handleAddCourse = (day, period) => {
  if (courseEditDialog.value) {
    courseEditDialog.value.openAddDialog(day, period)
  }
}

const handleEditCourse = (course) => {
  if (courseEditDialog.value) {
    courseEditDialog.value.openEditDialog(course)
  }
}

const handleDeleteCourse = (course) => {
  ElMessageBox.confirm(
    `确定要删除课程 "${course.course}" 吗？`,
    '确认删除',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    try {
      scheduleStore.deleteCourse(course.id)
      ElMessage.success('课程删除成功')
    } catch (error) {
      ElMessage.error(`删除失败: ${error.message}`)
    }
  }).catch(() => {
    // 用户取消删除
  })
}
</script>

<style scoped>
.schedule-table {
  width: 100%;
  height: 100%;
}

.table-scrollbar {
  max-width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  background-color: var(--el-bg-color);
}

/* Element Plus 滚动条美化样式 */
.table-scrollbar :deep(.el-scrollbar__bar) {
  opacity: 0.7;
  transition: all var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier);
  border-radius: var(--el-border-radius-round);
}

.table-scrollbar:hover :deep(.el-scrollbar__bar) {
  opacity: 1;
}

.table-scrollbar :deep(.el-scrollbar__bar.is-vertical) {
  right: 2px;
  width: 8px;
}

.table-scrollbar :deep(.el-scrollbar__bar.is-horizontal) {
  bottom: 2px;
  height: 8px;
}

.table-scrollbar :deep(.el-scrollbar__thumb) {
  background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--el-color-primary-light-3));
  border-radius: var(--el-border-radius-round);
  transition: all var(--el-transition-duration) var(--el-transition-function-ease-in-out-bezier);
  border: 1px solid var(--el-color-primary-light-8);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-scrollbar :deep(.el-scrollbar__thumb:hover) {
  background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
  border-color: var(--el-color-primary-light-6);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transform: scale(1.1);
}

.table-scrollbar :deep(.el-scrollbar__thumb:active) {
  background: var(--el-color-primary);
  transform: scale(1.05);
}

.table-scrollbar :deep(.el-scrollbar__track) {
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-border-radius-round);
  border: 1px solid var(--el-border-color-extra-light);
  margin: 1px;
}

/* 暗黑模式下的滚动条优化 */
.dark .table-scrollbar :deep(.el-scrollbar__thumb) {
  background: linear-gradient(135deg, var(--el-color-primary-light-7), var(--el-color-primary-light-5));
  border-color: var(--el-fill-color);
  box-shadow: 0 1px 3px rgba(255, 255, 255, 0.1);
}

.dark .table-scrollbar :deep(.el-scrollbar__thumb:hover) {
  background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--el-color-primary-light-3));
  border-color: var(--el-color-primary-light-8);
  box-shadow: 0 2px 6px rgba(255, 255, 255, 0.15);
}

.dark .table-scrollbar :deep(.el-scrollbar__track) {
  background: var(--el-fill-color-dark);
  border-color: var(--el-border-color-darker);
}

/* 滚动条动画效果 */
.table-scrollbar :deep(.el-scrollbar__bar) {
  animation: scrollbar-fade-in 0.3s ease-out;
}

@keyframes scrollbar-fade-in {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 0.7;
    transform: scale(1);
  }
}

.table-container {
  max-width: 100%;
}

.schedule-grid {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-family: var(--el-font-family);
}

.schedule-grid th,
.schedule-grid td {
  border: 1px solid var(--el-border-color-lighter);
  text-align: center;
  vertical-align: middle;
  transition: all var(--el-transition-duration-fast);
}

.time-header,
.day-header {
  background-color: var(--el-fill-color-light);
  font-weight: var(--el-font-weight-primary);
  font-size: var(--adaptive-font-size, var(--el-font-size-base));
  color: var(--el-text-color-primary);
  padding: var(--adaptive-header-padding, var(--el-table-header-padding, 12px 8px));
  position: sticky;
  top: 0;
  z-index: 2;
  border-bottom: 2px solid var(--el-border-color);
}

.time-header {
  width: 12%;
  min-width: 60px;
  left: 0;
  z-index: 3;
}

.period-cell {
  background-color: var(--el-fill-color-light);
  font-weight: var(--el-font-weight-primary);
  font-size: var(--adaptive-font-size, var(--el-font-size-small));
  color: var(--el-text-color-primary);
  padding: var(--adaptive-header-padding, var(--el-table-cell-padding, 8px));
  width: 12%;
  min-width: 60px;
  position: sticky;
  left: 0;
  z-index: 1;
  border-right: 2px solid var(--el-border-color);
}

.course-cell {
  padding: 2px;
  min-height: var(--adaptive-cell-height, 90px);
  height: auto;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
  vertical-align: top;
}

.empty-cell {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all var(--el-transition-duration);
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-small);
}

.course-cell:hover .empty-cell {
  opacity: 1;
  background-color: var(--el-fill-color-lighter);
}

.course-cell:hover {
  background-color: var(--el-fill-color-extra-light);
}



.add-button {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  padding: var(--el-button-padding-vertical) var(--el-button-padding-horizontal);
  border-radius: var(--el-border-radius-small);
  transition: all var(--el-transition-duration);
}

.add-button .el-icon {
  margin-right: var(--el-margin-small, 4px);
  font-size: var(--el-font-size-base);
}

.period-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.period-number {
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-primary);
  color: var(--el-text-color-primary);
}

.period-time {
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-secondary);
  line-height: 1.2;
}

.context-menu {
  position: fixed;
  z-index: var(--el-z-index-popper);
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-dark);
  backdrop-filter: blur(8px);
}

.context-menu .el-menu {
  border-right: none;
  background-color: transparent;
  border-radius: var(--el-border-radius-base);
}

/* 移动端适配 - 保留基础响应式功能 */
@media (max-width: 768px) {
  .add-button span {
    display: none;
  }
}

@media (max-width: 480px) {
  .time-header {
    min-width: 50px;
  }

  .period-cell {
    min-width: 50px;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .course-cell {
    min-height: var(--adaptive-cell-height, var(--el-component-size-large, 80px));
    padding: var(--el-padding-small, 4px);
  }

  .add-button {
    min-height: var(--el-component-size-default, 40px);
    min-width: var(--el-component-size-default, 40px);
    padding: var(--el-button-padding-vertical) var(--el-button-padding-horizontal);
    font-size: var(--adaptive-font-size, var(--el-font-size-small));
  }

  .course-card {
    min-height: var(--adaptive-card-min-height, 75px);
    padding: var(--adaptive-card-padding, var(--el-card-padding, 10px));
  }

  .period-cell {
    min-height: calc(var(--adaptive-cell-height, 80px) * 0.75);
  }

  .time-header,
  .day-header {
    min-height: var(--el-component-size-default, 50px);
    padding: var(--adaptive-header-padding, var(--el-table-header-padding, 15px 10px));
  }
}
</style>
