<template>
  <div class="course-search">
    <el-input
      v-model="searchQuery"
      placeholder="搜索课程名称、教师或地点..."
      :prefix-icon="Search"
      clearable
      @input="handleSearch"
      @clear="handleClear"
      class="search-input"
    >
      <template #append>
        <el-button :icon="Search" @click="handleSearch" />
      </template>
    </el-input>
    
    <!-- 搜索结果统计 -->
    <div v-if="searchQuery && searchResults.length > 0" class="search-stats">
      找到 {{ searchResults.length }} 门课程
    </div>
    
    <!-- 无搜索结果提示 -->
    <div v-if="searchQuery && searchResults.length === 0" class="no-results">
      <el-empty description="未找到匹配的课程" :image-size="60" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useScheduleStore } from '../stores/schedule'

const emit = defineEmits(['search-results'])

const scheduleStore = useScheduleStore()
const searchQuery = ref('')

/**
 * 搜索结果计算属性
 * 根据搜索关键词过滤课程
 */
const searchResults = computed(() => {
  if (!searchQuery.value.trim()) {
    return scheduleStore.courses
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  
  return scheduleStore.courses.filter(course => {
    // 搜索课程名称、教师、地点
    const courseName = course.course?.toLowerCase() || ''
    const teacher = course.teacher?.toLowerCase() || ''
    const location = course.location?.toLowerCase() || ''
    
    return courseName.includes(query) || 
           teacher.includes(query) || 
           location.includes(query)
  })
})

/**
 * 处理搜索输入
 */
const handleSearch = () => {
  emit('search-results', searchResults.value)
}

/**
 * 处理清空搜索
 */
const handleClear = () => {
  searchQuery.value = ''
  emit('search-results', scheduleStore.courses)
}

/**
 * 监听搜索结果变化，实时更新
 */
watch(searchResults, (newResults) => {
  emit('search-results', newResults)
}, { immediate: true })

/**
 * 监听搜索查询变化
 */
watch(searchQuery, (newQuery) => {
  if (!newQuery.trim()) {
    emit('search-results', scheduleStore.courses)
  }
})
</script>

<style scoped>
.course-search {
  width: 100%;
  max-width: 400px;
}

.search-input {
  width: 100%;
}

.search-stats {
  margin-top: 8px;
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-regular);
  text-align: center;
}

.no-results {
  margin-top: 16px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .course-search {
    max-width: 100%;
  }
}
</style>