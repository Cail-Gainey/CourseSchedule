import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { 
  createCourse, 
  getTimeSlotKey, 
  isCourseInWeekRange,
  validateCourse,
  validateTimeConflict,
  parseWeeksRange,
  calculateCurrentWeek
} from '../utils/index.js'
import { storageService } from '../services/storage.js'
import ExcelService from '../services/excel.js'

export const useScheduleStore = defineStore('schedule', () => {
  // State
  const courses = ref([])
  const selectedWeeks = ref([])
  const currentWeek = ref(1)
  const currentTheme = ref('light')
  const isLoading = ref(false)
  const metadata = ref({
    semester: '',
    year: new Date().getFullYear().toString(),
    lastModified: new Date()
  })
  
  // Settings state
  const settings = ref({
    theme: 'light',
    autoSave: true,
    firstWeekStart: '',
    periodTimes: [],
    lastUpdated: new Date()
  })

  // 监听数据变化，自动保存
  watch(
    [courses, currentTheme, metadata, settings],
    () => {
      if (courses.value.length > 0 || currentTheme.value !== 'light') {
        autoSave()
      }
      if (settings.value.autoSave) {
        autoSaveSettings()
      }
    },
    { deep: true }
  )

  // Getters
  const filteredCourses = computed(() => {
    // 如果设置了当前周数，则按当前周数过滤
    if (currentWeek.value > 0) {
      return courses.value.filter(course => 
        isCourseInWeekRange(course, [`第${currentWeek.value}周`])
      )
    }
    // 否则使用selectedWeeks过滤
    if (selectedWeeks.value.length === 0) {
      return courses.value
    }
    return courses.value.filter(course => 
      isCourseInWeekRange(course, selectedWeeks.value)
    )
  })

  const coursesByTimeSlot = computed(() => {
    const map = new Map()
    filteredCourses.value.forEach(course => {
      const key = getTimeSlotKey(course.day, course.period)
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key).push(course)
    })
    return map
  })

  const availableWeeks = computed(() => {
    const weekSet = new Set()
    courses.value.forEach(course => {
      const weeks = parseWeeksRange(course.weeks)
      weeks.forEach(week => weekSet.add(week))
    })
    
    const sortedWeeks = Array.from(weekSet).sort((a, b) => a - b)
    return sortedWeeks.map(week => `第${week}周`)
  })

  // Actions
  const addCourse = (courseData) => {
    const course = createCourse(courseData)
    
    // 验证课程数据
    const validation = validateCourse(course)
    if (!validation.isValid) {
      throw new Error(`课程数据无效: ${validation.errors.join(', ')}`)
    }

    // 检查时间冲突
    const conflict = validateTimeConflict(course, courses.value)
    if (conflict.hasConflict) {
      throw new Error(`时间冲突: 该时间段已有课程`)
    }

    courses.value.push(course)
    metadata.value.lastModified = new Date()
    return course
  }

  const updateCourse = (id, updates) => {
    const index = courses.value.findIndex(course => course.id === id)
    if (index === -1) {
      throw new Error('课程不存在')
    }

    const updatedCourse = { ...courses.value[index], ...updates }
    
    // 验证更新后的课程数据
    const validation = validateCourse(updatedCourse)
    if (!validation.isValid) {
      throw new Error(`课程数据无效: ${validation.errors.join(', ')}`)
    }

    // 检查时间冲突（排除当前课程）
    const conflict = validateTimeConflict(updatedCourse, courses.value, id)
    if (conflict.hasConflict) {
      throw new Error(`时间冲突: 该时间段已有课程`)
    }

    courses.value[index] = updatedCourse
    metadata.value.lastModified = new Date()
    return updatedCourse
  }

  const deleteCourse = (id) => {
    const index = courses.value.findIndex(course => course.id === id)
    if (index !== -1) {
      courses.value.splice(index, 1)
      metadata.value.lastModified = new Date()
      return true
    }
    return false
  }

  const importFromExcel = async () => {
    try {
      isLoading.value = true
      const importedCourses = await ExcelService.importExcel()
      
      if (importedCourses && importedCourses.length > 0) {
        // 清空现有课程或合并
        courses.value = importedCourses
        metadata.value.lastModified = new Date()
        console.log(`成功导入 ${importedCourses.length} 门课程`)
        return importedCourses.length
      }
      
      return 0
    } catch (error) {
      console.error('Excel 导入失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }



  const loadFromStorage = async () => {
    try {
      isLoading.value = true
      const data = await storageService.loadScheduleData()
      
      if (data && data.courses) {
        courses.value = data.courses
        metadata.value = data.metadata || metadata.value
      }

      // 加载设置
      const settings = await storageService.loadSettings()
      if (settings) {
        currentTheme.value = settings.theme || 'light'
      }

      console.log('数据加载成功')
    } catch (error) {
      console.error('加载数据失败:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const saveToStorage = async () => {
    try {
      const scheduleData = {
        courses: courses.value,
        metadata: {
          ...metadata.value,
          lastModified: new Date()
        }
      }

      await storageService.saveScheduleData(scheduleData)
      
      // 保存设置
      await storageService.saveSettings({
        theme: currentTheme.value
      })

      console.log('数据保存成功')
    } catch (error) {
      console.error('保存数据失败:', error)
      throw error
    }
  }

  const autoSave = () => {
    const scheduleData = {
      courses: courses.value,
      metadata: {
        ...metadata.value,
        lastModified: new Date()
      }
    }
    storageService.autoSaveScheduleData(scheduleData)
  }

  const loadSettings = async () => {
    try {
      const loadedSettings = await storageService.loadSettings()
      settings.value = loadedSettings
      currentTheme.value = loadedSettings.theme
      
      // 自动计算并设置当前周数
      initializeCurrentWeek()
      
      console.log('设置加载成功')
    } catch (error) {
      console.error('加载设置失败:', error)
      throw error
    }
  }

  const initializeCurrentWeek = () => {
    if (settings.value.firstWeekStart) {
      const calculatedWeek = calculateCurrentWeek(settings.value.firstWeekStart)
      currentWeek.value = calculatedWeek
      console.log(`根据第一周开始时间 ${settings.value.firstWeekStart} 自动计算当前周数: 第${calculatedWeek}周`)
    }
  }

  const saveSettings = async (newSettings) => {
    try {
      await storageService.saveSettings(newSettings)
      settings.value = { ...newSettings, lastUpdated: new Date() }
      currentTheme.value = newSettings.theme
      
      // 如果第一周开始时间发生变化，重新计算当前周数
      if (newSettings.firstWeekStart) {
        initializeCurrentWeek()
      }
      
      console.log('设置保存成功')
    } catch (error) {
      console.error('保存设置失败:', error)
      throw error
    }
  }

  const autoSaveSettings = () => {
    storageService.saveSettings(settings.value)
  }

  const clearAllData = async () => {
    try {
      await storageService.clearAllData()
      courses.value = []
      selectedWeeks.value = []
      currentWeek.value = 1
      currentTheme.value = 'light'
      metadata.value = {
        semester: '',
        year: new Date().getFullYear().toString(),
        lastModified: new Date()
      }
      settings.value = {
        theme: 'light',
        autoSave: true,
        firstWeekStart: '',
        periodTimes: [],
        lastUpdated: new Date()
      }
      console.log('所有数据已清除')
    } catch (error) {
      console.error('清除数据失败:', error)
      throw error
    }
  }

  const setCurrentWeek = (week) => {
    currentWeek.value = week
  }

  return {
    // State
    courses,
    selectedWeeks,
    currentWeek,
    currentTheme,
    isLoading,
    metadata,
    settings,
    // Getters
    filteredCourses,
    coursesByTimeSlot,
    availableWeeks,
    // Actions
    addCourse,
    updateCourse,
    deleteCourse,
    importFromExcel,
    loadFromStorage,
    saveToStorage,
    autoSave,
    loadSettings,
    saveSettings,
    autoSaveSettings,
    clearAllData,
    setCurrentWeek,
    initializeCurrentWeek
  }
})