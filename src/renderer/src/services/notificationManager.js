/**
 * 通知管理器
 * 负责管理课程提醒的调度和更新
 */

import { notificationService } from './notification.js'
import { DAYS_OF_WEEK } from '../types/index.js'

class NotificationManager {
  constructor() {
    this.isInitialized = false
    this.scheduleStore = null
    this.currentNotifications = new Set() // 当前活跃的通知ID
    this.dailyUpdateTimer = null // 每日更新定时器
  }

  /**
   * 初始化通知管理器
   * @param {Object} scheduleStore - Pinia store实例
   */
  async initialize(scheduleStore) {
    if (this.isInitialized) {
      return
    }

    this.scheduleStore = scheduleStore
    
    // 检查通知支持和权限
    if (!notificationService.isNotificationSupported()) {
      return
    }
    
    // 设置每日更新定时器（每天凌晨更新通知）
    this.setupDailyUpdateTimer()
    
    // 初始化今日通知
    await this.updateTodayNotifications()
    
    this.isInitialized = true
  }

  /**
   * 设置每日更新定时器
   */
  setupDailyUpdateTimer() {
    // 计算到明天凌晨的时间
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 1, 0, 0) // 凌晨00:01更新

    const timeUntilTomorrow = tomorrow.getTime() - now.getTime()

    // 设置定时器
    this.dailyUpdateTimer = setTimeout(() => {
      this.updateTodayNotifications()
      
      // 设置每24小时重复执行
      this.dailyUpdateTimer = setInterval(() => {
        this.updateTodayNotifications()
      }, 24 * 60 * 60 * 1000)
    }, timeUntilTomorrow)


  }

  /**
   * 更新今日课程通知
   */
  async updateTodayNotifications() {
    if (!this.scheduleStore || !this.isNotificationEnabled()) {
      return
    }

    // 清除现有通知
    this.clearAllNotifications()

    // 获取今日课程
    const todayCourses = this.getTodayCourses()
    
    if (todayCourses.length === 0) {
      return
    }

    // 请求通知权限（如果需要）
    const permission = await notificationService.requestPermission()
    if (permission !== 'granted') {
      return
    }

    // 获取提前通知时间
    const notificationMinutes = this.scheduleStore.settings.notificationMinutes || 10
    const currentDate = this.getCurrentDateString()

    // 为每门课程设置通知
    let scheduledCount = 0
    for (const course of todayCourses) {
      const notificationId = notificationService.scheduleCourseNotification(
        course,
        notificationMinutes,
        currentDate
      )
      
      if (notificationId) {
        this.currentNotifications.add(notificationId)
        scheduledCount++
      }
    }
  }

  /**
   * 获取今日课程
   * @returns {Array} 今日课程列表
   */
  getTodayCourses() {
    if (!this.scheduleStore) {
      return []
    }

    const today = new Date()
    const dayOfWeek = DAYS_OF_WEEK[today.getDay() === 0 ? 6 : today.getDay() - 1] // 转换为中文星期
    const currentWeek = this.scheduleStore.currentWeek

    // 获取今日的课程
    const todayCourses = this.scheduleStore.courses.filter(course => {
      // 检查是否是今天
      if (course.day !== dayOfWeek) {
        return false
      }

      // 检查是否在当前周
      if (!this.isInCurrentWeek(course.weeks, currentWeek)) {
        return false
      }

      // 检查课程是否有有效的时间信息
      if (!this.getCourseStartTime(course)) {
        return false
      }

      return true
    })

    // 为课程添加实际的开始时间信息
    return todayCourses.map(course => ({
      ...course,
      startTime: this.getCourseStartTime(course),
      endTime: this.getCourseEndTime(course)
    })).filter(course => course.startTime) // 过滤掉没有时间信息的课程
  }

  /**
   * 检查课程是否在当前周
   * @param {string} weeksRange - 周次范围字符串 (如 "1-16" 或 "1-8,10-16")
   * @param {number} currentWeek - 当前周次
   * @returns {boolean}
   */
  isInCurrentWeek(weeksRange, currentWeek) {
    if (!weeksRange || !currentWeek) {
      return false
    }

    try {
      // 解析周次范围
      const ranges = weeksRange.split(',')
      
      for (const range of ranges) {
        const trimmedRange = range.trim()
        
        if (trimmedRange.includes('-')) {
          // 范围格式 "1-16"
          const [start, end] = trimmedRange.split('-').map(num => parseInt(num.trim()))
          if (currentWeek >= start && currentWeek <= end) {
            return true
          }
        } else {
          // 单个周次
          const week = parseInt(trimmedRange)
          if (currentWeek === week) {
            return true
          }
        }
      }
      
      return false
    } catch (error) {
      console.warn('解析周次范围失败:', weeksRange, error)
      return false
    }
  }

  /**
   * 获取课程的开始时间
   * @param {Object} course - 课程对象
   * @returns {string|null} 开始时间 (HH:MM格式)
   */
  getCourseStartTime(course) {
    if (!course.period || !this.scheduleStore.settings.periodTimes) {
      return null
    }

    // 从节次字符串中提取数字 (如 "第1节" -> 1)
    const periodMatch = course.period.match(/第(\d+)节/)
    if (!periodMatch) {
      return null
    }

    const periodIndex = parseInt(periodMatch[1]) - 1 // 转换为数组索引
    const periodTime = this.scheduleStore.settings.periodTimes[periodIndex]
    
    return periodTime ? periodTime.startTime : null
  }

  /**
   * 获取课程的结束时间
   * @param {Object} course - 课程对象
   * @returns {string|null} 结束时间 (HH:MM格式)
   */
  getCourseEndTime(course) {
    if (!course.period || !this.scheduleStore.settings.periodTimes) {
      return null
    }

    // 从节次字符串中提取数字 (如 "第1节" -> 1)
    const periodMatch = course.period.match(/第(\d+)节/)
    if (!periodMatch) {
      return null
    }

    const periodIndex = parseInt(periodMatch[1]) - 1 // 转换为数组索引
    const periodTime = this.scheduleStore.settings.periodTimes[periodIndex]
    
    return periodTime ? periodTime.endTime : null
  }

  /**
   * 获取当前日期字符串
   * @returns {string} YYYY-MM-DD格式的日期字符串
   */
  getCurrentDateString() {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  /**
   * 检查是否启用了通知
   * @returns {boolean}
   */
  isNotificationEnabled() {
    return this.scheduleStore && this.scheduleStore.settings.notificationEnabled
  }

  /**
   * 清除所有当前的通知
   */
  clearAllNotifications() {
    for (const notificationId of this.currentNotifications) {
      notificationService.cancelScheduledNotification(notificationId)
    }
    this.currentNotifications.clear()
  }

  /**
   * 当课程数据变化时调用
   */
  onCoursesChanged() {
    if (this.isInitialized && this.isNotificationEnabled()) {
      this.updateTodayNotifications()
    }
  }

  /**
   * 当设置变化时调用
   */
  onSettingsChanged() {
    if (this.isInitialized) {
      this.updateTodayNotifications()
    }
  }

  /**
   * 当周次变化时调用
   */
  onWeekChanged() {
    if (this.isInitialized && this.isNotificationEnabled()) {
      this.updateTodayNotifications()
    }
  }

  /**
   * 获取通知状态信息
   * @returns {Object} 通知状态
   */
  getNotificationStatus() {
    return {
      isSupported: notificationService.isNotificationSupported(),
      permission: notificationService.getPermissionStatus(),
      isEnabled: this.isNotificationEnabled(),
      activeNotifications: this.currentNotifications.size,
      scheduledNotifications: notificationService.getScheduledNotifications()
    }
  }

  /**
   * 销毁通知管理器
   */
  destroy() {
    if (this.dailyUpdateTimer) {
      clearTimeout(this.dailyUpdateTimer)
      clearInterval(this.dailyUpdateTimer)
      this.dailyUpdateTimer = null
    }
    
    this.clearAllNotifications()
    this.isInitialized = false
  }
}

// 创建单例实例
export const notificationManager = new NotificationManager()

// 导出类以供测试使用
export { NotificationManager }