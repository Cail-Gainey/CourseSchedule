<template>
  <div class="week-navigation-container">
    <!-- 左侧上一周按钮 -->
    <div class="nav-button-left">
      <el-button
        :icon="ArrowLeft"
        @click="goToPreviousWeek"
        :disabled="currentWeek <= 1"
        circle
        size="large"
        title="上一周"
        class="side-nav-button prev-button"
      />
    </div>

    <!-- 右侧下一周按钮 -->
    <div class="nav-button-right">
      <el-button
        :icon="ArrowRight"
        @click="goToNextWeek"
        :disabled="currentWeek >= maxWeeks"
        circle
        size="large"
        title="下一周"
        class="side-nav-button next-button"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { useScheduleStore } from '../stores/schedule'
import { ElMessage } from 'element-plus'

const scheduleStore = useScheduleStore()

const props = defineProps({
  maxWeeks: {
    type: Number,
    default: 20
  }
})

// 当前周次
const currentWeek = computed(() => scheduleStore.currentWeek)

/**
 * 切换到上一周
 */
const goToPreviousWeek = () => {
  if (currentWeek.value > 1) {
    const newWeek = currentWeek.value - 1
    scheduleStore.setCurrentWeek(newWeek)
    ElMessage.success(`已切换到第${newWeek}周`)
  }
}

/**
 * 切换到下一周
 */
const goToNextWeek = () => {
  if (currentWeek.value < props.maxWeeks) {
    const newWeek = currentWeek.value + 1
    scheduleStore.setCurrentWeek(newWeek)
    ElMessage.success(`已切换到第${newWeek}周`)
  }
}
</script>

<style scoped>
.week-navigation-container {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 允许点击穿透到下层元素 */
}

.nav-button-left,
.nav-button-right {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
  pointer-events: auto; /* 恢复按钮的点击事件 */
}

.nav-button-left {
  left: 20px;
}

.nav-button-right {
  right: 20px;
}

.side-nav-button {
  width: 50px;
  height: 50px;
  transition: all 0.3s ease;
  border: 2px solid var(--el-border-color);
  background-color: var(--el-bg-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
}

.side-nav-button:hover:not(:disabled) {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.side-nav-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background-color: var(--el-bg-color-disabled);
  border-color: var(--el-border-color-lighter);
}

.side-nav-button:disabled:hover {
  transform: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-button-left {
    left: 10px;
  }

  .nav-button-right {
    right: 10px;
  }

  .side-nav-button {
    width: 45px;
    height: 45px;
  }
}

@media (max-width: 480px) {
  .nav-button-left {
    left: 5px;
  }

  .nav-button-right {
    right: 5px;
  }

  .side-nav-button {
    width: 40px;
    height: 40px;
  }
}

/* 暗黑模式适配 */
.dark .side-nav-button {
  border-color: var(--el-border-color-darker);
  background-color: rgba(0, 0, 0, 0.6);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dark .side-nav-button:hover:not(:disabled) {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.dark .side-nav-button:disabled {
  background-color: rgba(0, 0, 0, 0.3);
  border-color: var(--el-border-color-darker);
}

/* 动画效果 */
@keyframes slideInLeft {
  from {
    left: -60px;
    opacity: 0;
  }
  to {
    left: 20px;
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    right: -60px;
    opacity: 0;
  }
  to {
    right: 20px;
    opacity: 1;
  }
}

.nav-button-left {
  animation: slideInLeft 0.5s ease-out;
}

.nav-button-right {
  animation: slideInRight 0.5s ease-out;
}
</style>
