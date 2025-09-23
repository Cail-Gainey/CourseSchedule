// 导出所有工具函数
export * from './validation.js'
export * from './course.js'
import { parseWeeksRange } from './validation.js'

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item))
  }

  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @param {string} format - 格式字符串
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date || !(date instanceof Date)) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 生成随机颜色
 * @returns {string} 十六进制颜色值
 */
export function generateRandomColor() {
  return (
    '#' +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')
  )
}

/**
 * 检查值是否为空
 * @param {any} value - 要检查的值
 * @returns {boolean} 是否为空
 */
export function isEmpty(value) {
  if (value === null || value === undefined) {
    return true
  }

  if (typeof value === 'string') {
    return value.trim() === ''
  }

  if (Array.isArray(value)) {
    return value.length === 0
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0
  }

  return false
}

/**
 * 根据第一周开始时间和当前日期计算当前周数
 * @param {string} firstWeekStart - 第一周开始时间 (YYYY-MM-DD)
 * @param {Date} currentDate - 当前日期，默认为今天
 * @returns {number} 当前周数，如果无法计算则返回1
 */
export function calculateCurrentWeek(firstWeekStart, currentDate = new Date()) {
  if (!firstWeekStart) {
    return 1
  }

  try {
    const startDate = new Date(firstWeekStart)
    const current = new Date(currentDate)

    // 计算天数差
    const timeDiff = current.getTime() - startDate.getTime()
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

    // 计算周数（向上取整，确保至少是第1周）
    const weekNumber = Math.floor(daysDiff / 7) + 1

    // 确保周数在合理范围内（1-30周）
    return Math.max(1, Math.min(30, weekNumber))
  } catch (error) {
    console.error('计算当前周数失败:', error)
    return 1
  }
}

/**
 * 根据第一周开始时间和周数计算实际日期
 * @param {string} firstWeekStart - 第一周开始时间 (YYYY-MM-DD)
 * @param {number} weekNumber - 周数
 * @param {number} dayOfWeek - 星期几 (1-7, 1为周一)
 * @returns {string} 实际日期 (YYYY-MM-DD)
 */
export function calculateActualDate(firstWeekStart, weekNumber, dayOfWeek) {
  if (!firstWeekStart || !weekNumber || !dayOfWeek) {
    return ''
  }

  try {
    const startDate = new Date(firstWeekStart)
    // 计算目标周的周一
    const targetWeekMonday = new Date(startDate)
    targetWeekMonday.setDate(startDate.getDate() + (weekNumber - 1) * 7)

    // 计算目标日期
    const targetDate = new Date(targetWeekMonday)
    targetDate.setDate(targetWeekMonday.getDate() + (dayOfWeek - 1))

    return formatDate(targetDate, 'YYYY-MM-DD')
  } catch (error) {
    console.error('计算实际日期失败:', error)
    return ''
  }
}

/**
 * 获取课程的实际上课时间描述
 * @param {Object} course - 课程对象
 * @param {string} firstWeekStart - 第一周开始时间
 * @param {Array} periodTimes - 课程时间配置
 * @returns {string} 时间描述
 */
export function getCourseTimeDescription(course, firstWeekStart, periodTimes) {
  if (!course || !periodTimes || periodTimes.length === 0) {
    return '时间未设置'
  }

  // 从节次字符串中提取数字 (如 "第1节" -> 1)
  const periodMatch = course.period.match(/第(\d+)节/)
  if (!periodMatch) {
    return '时间未设置'
  }

  const periodIndex = parseInt(periodMatch[1]) - 1 // 转换为数组索引
  const periodTime = periodTimes[periodIndex]
  if (!periodTime) {
    return '时间未设置'
  }

  let timeDesc = `${periodTime.startTime}-${periodTime.endTime}`

  // 如果设置了第一周开始时间，显示具体日期
  if (firstWeekStart && course.weeks) {
    const weeks = parseWeeksRange(course.weeks)
    if (weeks.length > 0) {
      const firstWeek = weeks[0]
      const actualDate = calculateActualDate(firstWeekStart, firstWeek, course.day)
      if (actualDate) {
        timeDesc += ` (${actualDate}起)`
      }
    }
  }

  return timeDesc
}
