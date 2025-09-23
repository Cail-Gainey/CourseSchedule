import { DAYS_OF_WEEK, PERIODS } from '../types/index.js'

/**
 * 验证课程数据是否有效
 * @param {Object} course - 课程对象
 * @param {boolean} strict - 是否使用严格模式（默认false）
 * @returns {Object} 验证结果 { isValid: boolean, errors: string[] }
 */
export function validateCourse(course, strict = false) {
  const errors = []

  // 检查必填字段
  if (!course.course || course.course.trim() === '') {
    errors.push('课程名称不能为空')
  }

  if (!course.day || !DAYS_OF_WEEK.includes(course.day)) {
    errors.push('请选择有效的星期')
  }

  if (!course.period || !PERIODS.includes(course.period)) {
    errors.push('请选择有效的节次')
  }

  // 在非严格模式下，教师和地点可以为空或使用默认值
  if (strict) {
    if (!course.teacher || course.teacher.trim() === '') {
      errors.push('教师姓名不能为空')
    }

    if (!course.location || course.location.trim() === '') {
      errors.push('教室地点不能为空')
    }
  } else {
    // 非严格模式：为空值设置默认值
    if (!course.teacher || course.teacher.trim() === '') {
      course.teacher = '未知教师'
    }

    if (!course.location || course.location.trim() === '') {
      course.location = '未知地点'
    }
  }

  // 验证周次格式
  if (!course.weeks || !validateWeeksFormat(course.weeks)) {
    if (strict) {
      errors.push('周次格式无效，请使用如 "1-16" 或 "1-8,10-16" 的格式')
    } else {
      // 非严格模式：使用默认周次
      course.weeks = '1-16'
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证周次格式
 * @param {string} weeks - 周次字符串
 * @returns {boolean} 是否有效
 */
export function validateWeeksFormat(weeks) {
  if (!weeks || typeof weeks !== 'string') {
    return false
  }

  // 支持格式: "1-16", "1,3,5", "1-8,10-16"
  const weekPattern = /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/
  return weekPattern.test(weeks.trim())
}

/**
 * 验证课程时间冲突
 * @param {Object} newCourse - 新课程
 * @param {Array} existingCourses - 现有课程列表
 * @param {string} excludeId - 排除的课程ID（用于编辑时）
 * @returns {Object} 冲突检查结果
 */
export function validateTimeConflict(newCourse, existingCourses, excludeId = null) {
  const conflicts = existingCourses.filter((course) => {
    if (excludeId && course.id === excludeId) {
      return false
    }

    // 检查是否在同一时间段
    if (course.day === newCourse.day && course.period === newCourse.period) {
      // 检查周次是否重叠
      return hasWeekOverlap(course.weeks, newCourse.weeks)
    }

    return false
  })

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  }
}

/**
 * 检查两个周次范围是否重叠
 * @param {string} weeks1 - 第一个周次范围
 * @param {string} weeks2 - 第二个周次范围
 * @returns {boolean} 是否重叠
 */
export function hasWeekOverlap(weeks1, weeks2) {
  const range1 = parseWeeksRange(weeks1)
  const range2 = parseWeeksRange(weeks2)

  return range1.some((week) => range2.includes(week))
}

/**
 * 解析周次范围字符串为数字数组
 * @param {string} weeks - 周次字符串
 * @returns {number[]} 周次数组
 */
export function parseWeeksRange(weeks) {
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
