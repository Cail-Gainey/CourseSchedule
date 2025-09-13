<template>
  <div 
    class="course-card"
    :style="cardStyle"
    @click="$emit('detail', course)"
  >
    <div class="course-content">
      <div class="course-name" :title="course.course">
        {{ course.course }}
      </div>
      <div class="course-teacher" :title="course.teacher">
        <el-icon><User /></el-icon> {{ course.teacher }}
      </div>
      <div class="course-location" :title="course.location">
       <el-icon><Location /></el-icon> {{ course.location }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { User, Location, Clock } from '@element-plus/icons-vue'
import { generateColor, getCourseTimeDescription } from '../utils/index.js'
import { useScheduleStore } from '../stores/schedule.js'

const props = defineProps({
  course: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['detail'])

const scheduleStore = useScheduleStore()

// 获取课程时间显示文本
const getCourseTimeText = computed(() => {
  return getCourseTimeDescription(
    props.course,
    scheduleStore.settings.firstWeekStart,
    scheduleStore.settings.periodTimes
  )
})

const cardStyle = computed(() => {
  const color = generateColor(props.course.course)
  return {
    backgroundColor: color,
    '--card-hover-bg': color + 'cc' // 80% opacity
  }
})



</script>

<style scoped>
.course-card {
  width: 100%;
  height: 100%;
  min-height: var(--adaptive-card-min-height, 80px);
  padding: var(--adaptive-card-padding, var(--el-card-padding, 8px));
  border-radius: var(--el-border-radius-base, 4px);
  font-size: var(--adaptive-font-size, var(--el-font-size-small, 12px));
  line-height: 1.4;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all var(--el-transition-duration, 0.2s) var(--el-transition-function-ease-in-out-bezier);
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color);
}

.course-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--el-box-shadow);
  border-color: var(--el-color-primary-light-7);
  background-color: var(--el-bg-color-page);
}



.course-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.course-name {
  font-weight: var(--el-font-weight-primary, 600);
  font-size: var(--adaptive-font-size, var(--el-font-size-base, 13px));
  margin-bottom: var(--el-margin-small, 4px);
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 黑暗模式下的字体优化 */
:global(.dark) .course-name {
  color: #ffffff;
  font-weight: 800;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6), 0 1px 2px rgba(0, 0, 0, 0.8);
  letter-spacing: 0.3px;
}

.course-teacher,
.course-location,
.course-time,
.course-weeks {
  font-size: calc(var(--adaptive-font-size, var(--el-font-size-small, 11px)) * 0.9);
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

/* 黑暗模式下的字体优化 */
:global(.dark) .course-teacher,
:global(.dark) .course-location,
:global(.dark) .course-time,
:global(.dark) .course-weeks {
  color: #f3f4f6;
  font-weight: 600;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5), 0 1px 1px rgba(0, 0, 0, 0.7);
  letter-spacing: 0.2px;
}

.course-teacher .el-icon,
.course-location .el-icon,
.course-time .el-icon {
  margin-right: var(--el-margin-small, 4px);
  font-size: var(--el-font-size-extra-small, 10px);
  color: var(--el-text-color-secondary);
}

/* 黑暗模式下的图标优化 */
:global(.dark) .course-teacher .el-icon,
:global(.dark) .course-location .el-icon,
:global(.dark) .course-time .el-icon {
  color: #ffffff;
  opacity: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}

.course-time {
  font-weight: var(--el-font-weight-primary, 600);
  color: var(--el-color-primary);
}

.course-weeks {
  font-size: var(--el-font-size-extra-small, 10px);
  color: var(--el-text-color-secondary);
  margin-top: 1px;
  margin-bottom: 0;
}
</style>
