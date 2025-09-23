/**
 * 生成唯一的课程ID
 * @returns {string} 唯一ID
 */
export function generateCourseId() {
  return `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 创建新的课程对象
 * @param {Object} courseData - 课程数据
 * @returns {Object} 完整的课程对象
 */
export function createCourse(courseData) {
  return {
    id: generateCourseId(),
    day: courseData.day || '',
    period: courseData.period || '',
    course: courseData.course || '',
    teacher: courseData.teacher || '',
    location: courseData.location || '',
    weeks: courseData.weeks || '',
    ...courseData
  }
}

/**
 * 复制课程对象
 * @param {Object} course - 原课程对象
 * @param {Object} updates - 更新的字段
 * @returns {Object} 新的课程对象
 */
export function cloneCourse(course, updates = {}) {
  return {
    ...course,
    ...updates
  }
}

/**
 * 获取时间段的显示文本
 * @param {string} day - 星期
 * @param {string} period - 节次
 * @returns {string} 显示文本
 */
export function getTimeSlotText(day, period) {
  return `${day} ${period}`
}

/**
 * 获取课程时间显示文本
 * @param {string} period - 节次 (如 "第1节")
 * @param {Array} periodTimes - 课程时间配置数组
 * @returns {string} 时间显示文本 (如 "08:00-08:45")
 */
export function getPeriodTimeText(period, periodTimes) {
  if (!periodTimes || !Array.isArray(periodTimes)) {
    return period // 如果没有时间配置，返回原节次
  }

  // 从节次字符串中提取数字 (如 "第1节" -> 1)
  const periodMatch = period.match(/第(\d+)节/)
  if (!periodMatch) {
    return period
  }

  const periodIndex = parseInt(periodMatch[1]) - 1 // 转换为数组索引

  if (periodIndex < 0 || periodIndex >= periodTimes.length) {
    return period // 如果索引超出范围，返回原节次
  }

  const timeConfig = periodTimes[periodIndex]
  if (!timeConfig || !timeConfig.startTime || !timeConfig.endTime) {
    return period
  }

  return `${timeConfig.startTime}-${timeConfig.endTime}`
}

/**
 * 获取时间段的唯一键
 * @param {string} day - 星期
 * @param {string} period - 节次
 * @returns {string} 唯一键
 */
export function getTimeSlotKey(day, period) {
  return `${day}-${period}`
}

/**
 * 格式化课程显示信息
 * @param {Object} course - 课程对象
 * @returns {Object} 格式化后的显示信息
 */
export function formatCourseDisplay(course) {
  return {
    title: course.course,
    subtitle: `${course.teacher} | ${course.location}`,
    timeInfo: getTimeSlotText(course.day, course.period),
    weeksInfo: `第${course.weeks}周`
  }
}

/**
 * 检查课程是否在指定周次范围内
 * @param {Object} course - 课程对象
 * @param {string[]} selectedWeeks - 选中的周次
 * @returns {boolean} 是否在范围内
 */
export function isCourseInWeekRange(course, selectedWeeks) {
  if (!selectedWeeks || selectedWeeks.length === 0) {
    return true
  }

  // 解析课程的周次范围
  const courseWeeks = parseWeeksRange(course.weeks)

  // 解析选中的周次
  const selectedWeekNumbers = selectedWeeks
    .map((week) => {
      const match = week.match(/第(\d+)周/)
      return match ? parseInt(match[1]) : 0
    })
    .filter((num) => num > 0)

  // 检查是否有交集
  return courseWeeks.some((week) => selectedWeekNumbers.includes(week))
}

/**
 * 解析周次范围字符串为数字数组
 * @param {string} weeks - 周次字符串
 * @returns {number[]} 周次数组
 */
function parseWeeksRange(weeks) {
  if (!weeks) return []

  const result = []
  const parts = weeks.split(',')

  parts.forEach((part) => {
    part = part.trim()
    if (part.includes('-')) {
      const [start, end] = part.split('-').map((num) => parseInt(num.trim()))
      for (let i = start; i <= end; i++) {
        result.push(i)
      }
    } else {
      result.push(parseInt(part))
    }
  })

  return result.sort((a, b) => a - b)
}

/**
 * 根据课程名称生成一个稳定的颜色
 * @param {string} courseName - 课程名称
 * @returns {string} HSL 颜色字符串
 */
export function generateColor(courseName) {
  if (!courseName) return 'hsl(200, 70%, 80%)'

  let hash = 0
  for (let i = 0; i < courseName.length; i++) {
    hash = courseName.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash // Convert to 32bit integer
  }

  const hue = hash % 360
  const saturation = 70 // 固定饱和度
  const lightness = 75 // 固定亮度

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}
