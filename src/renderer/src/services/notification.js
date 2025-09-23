/**
 * 通知服务 - 统一管理浏览器通知、移动端Toast和本地通知
 * 支持Web端的浏览器通知、移动端的Toast消息和系统通知栏推送
 */

import { toastService } from './toastService.js'
import { localNotificationService } from './localNotificationService.js'

class NotificationService {
  constructor() {
    this.scheduledNotifications = new Map()
    this.isWebNotificationSupported = 'Notification' in window
    this.isMobile = toastService.isToastSupported()
    this.isLocalNotificationSupported = localNotificationService.isLocalNotificationSupported()
  }

  /**
   * 检查是否支持通知功能
   * @returns {boolean} 是否支持通知
   */
  isNotificationSupported() {
    return this.isWebNotificationSupported || this.isMobile
  }

  /**
   * 获取通知权限状态
   * @returns {string} 权限状态: 'granted', 'denied', 'default'
   */
  getPermissionStatus() {
    if (this.isMobile) {
      // 移动端Toast不需要权限
      return 'granted'
    }
    
    if (!this.isWebNotificationSupported) {
      return 'denied'
    }
    
    return Notification.permission
  }

  /**
   * 请求通知权限
   * @returns {Promise<string>} 权限状态
   */
  async requestPermission() {
    if (this.isMobile) {
      // 移动端Toast不需要权限
      return 'granted'
    }
    
    if (!this.isWebNotificationSupported) {
      throw new Error('浏览器不支持通知功能')
    }

    try {
      const permission = await Notification.requestPermission()
      return permission
    } catch (error) {
      console.error('请求通知权限失败:', error)
      throw error
    }
  }

  /**
   * 显示通知
   * @param {string} title - 通知标题
   * @param {string} body - 通知内容
   * @param {Object} options - 通知选项
   * @returns {Promise<void>}
   */
  async showNotification(title, body = '', options = {}) {
    try {
      // 移动端优先使用本地通知
      if (this.isLocalNotificationSupported) {
        await localNotificationService.showNotification(title, body, options)
        return
      }

      if (this.isMobile) {
        // 移动端降级使用Toast
        const toastText = body ? `${title}: ${body}` : title
        await toastService.showLong(toastText)
        return
      }

      // Web端使用浏览器通知
      if (!this.isWebNotificationSupported) {
        console.warn('浏览器不支持通知功能')
        return
      }

      const permission = this.getPermissionStatus()
      if (permission !== 'granted') {
        console.warn('通知权限未授权')
        return
      }

      const notification = new Notification(title, {
        body: body,
        icon: options.icon || '/icon.png',
        tag: options.tag || 'default',
        ...options
      })

      // 设置点击事件
      notification.onclick = () => {
        window.focus()
        notification.close()
        if (options.onClick) {
          options.onClick()
        }
      }

      return notification
    } catch (error) {
      console.error('显示通知失败:', error)
      throw error
    }
  }

  /**
   * 安排延时通知
   * @param {string} title - 通知标题
   * @param {string} body - 通知内容
   * @param {Object} options - 通知选项
   * @param {number} delay - 延时毫秒数
   * @param {string} id - 通知ID
   * @returns {string} 通知ID
   */
  scheduleNotification(title, body = '', options = {}, delay, id = null) {
    const notificationId = id || `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 如果支持本地通知，使用本地通知的调度功能
    if (this.isLocalNotificationSupported) {
      const scheduleAt = new Date(Date.now() + delay)
      localNotificationService.scheduleNotification(notificationId, title, body, scheduleAt, options)
      
      this.scheduledNotifications.set(notificationId, {
        type: 'local',
        title,
        body,
        options,
        delay,
        scheduledAt: new Date(),
        executeAt: scheduleAt
      })
      
      console.log(`已安排本地通知: ${notificationId}, 将在 ${delay}ms 后执行`)
      return notificationId
    }
    
    // 降级使用setTimeout
    const timeoutId = setTimeout(async () => {
      try {
        await this.showNotification(title, body, options)
        this.scheduledNotifications.delete(notificationId)
      } catch (error) {
        console.error('显示延时通知失败:', error)
      }
    }, delay)

    this.scheduledNotifications.set(notificationId, {
      type: 'timeout',
      timeoutId,
      title,
      body,
      options,
      delay,
      scheduledAt: new Date(),
      executeAt: new Date(Date.now() + delay)
    })

    console.log(`已安排通知: ${notificationId}, 将在 ${delay}ms 后执行`)
    return notificationId
  }

  /**
   * 取消已安排的通知
   * @param {string} notificationId - 通知ID
   * @returns {boolean} 是否成功取消
   */
  cancelScheduledNotification(notificationId) {
    const notification = this.scheduledNotifications.get(notificationId)
    if (notification) {
      if (notification.type === 'local') {
        // 取消本地通知
        localNotificationService.cancelNotification(notificationId)
      } else if (notification.type === 'timeout') {
        // 取消setTimeout
        clearTimeout(notification.timeoutId)
      }
      
      this.scheduledNotifications.delete(notificationId)
      console.log(`已取消通知: ${notificationId}`)
      return true
    }
    return false
  }

  /**
   * 取消所有已安排的通知
   */
  cancelAllScheduledNotifications() {
    for (const [id, notification] of this.scheduledNotifications) {
      if (notification.type === 'local') {
        localNotificationService.cancelNotification(id)
      } else if (notification.type === 'timeout') {
        clearTimeout(notification.timeoutId)
      }
    }
    this.scheduledNotifications.clear()
    console.log('已取消所有已安排的通知')
  }

  /**
   * 获取已安排的通知列表
   * @returns {Array} 通知列表
   */
  getScheduledNotifications() {
    const notifications = []
    for (const [id, notification] of this.scheduledNotifications) {
      notifications.push({
        id,
        title: notification.title,
        body: notification.body,
        scheduledAt: notification.scheduledAt,
        executeAt: notification.executeAt
      })
    }
    return notifications
  }

  /**
   * 安排课程通知
   * @param {Object} course - 课程信息
   * @param {number} minutesBefore - 提前分钟数
   * @param {string} currentDate - 当前日期 (YYYY-MM-DD)
   * @returns {string|null} 通知ID，如果无法安排则返回null
   */
  scheduleCourseNotification(course, minutesBefore, currentDate) {
    try {
      // 解析课程时间
      const [startHour, startMinute] = course.startTime.split(':').map(Number)
      const courseDateTime = new Date(currentDate)
      courseDateTime.setHours(startHour, startMinute, 0, 0)

      // 计算通知时间
      const notificationTime = new Date(courseDateTime.getTime() - minutesBefore * 60 * 1000)
      const now = new Date()

      // 如果通知时间已过，不安排通知
      if (notificationTime <= now) {
        return null
      }

      const delay = notificationTime.getTime() - now.getTime()
      const notificationId = `course_${course.id}_${currentDate}`

      const title = course.name || course.course || '课程提醒'
      const body = `课程：${course.name || course.course}\n教室：${course.location || '未设置'}\n时间：${course.startTime} - ${course.endTime}`
      
      const options = {
        icon: '/icon.png',
        tag: notificationId,
        data: {
          courseId: course.id,
          courseName: course.name,
          startTime: course.startTime,
          endTime: course.endTime,
          location: course.location
        }
      }

      return this.scheduleNotification(title, body, options, delay, notificationId)
    } catch (error) {
      console.error('安排课程通知失败:', error)
      return null
    }
  }

  /**
   * 批量安排今日课程通知
   * @param {Array} courses - 课程列表
   * @param {number} minutesBefore - 提前分钟数
   * @param {string} currentDate - 当前日期 (YYYY-MM-DD)
   * @returns {Array} 成功安排的通知ID列表
   */
  scheduleTodayCoursesNotifications(courses, minutesBefore, currentDate) {
    const scheduledIds = []
    
    for (const course of courses) {
      const notificationId = this.scheduleCourseNotification(course, minutesBefore, currentDate)
      if (notificationId) {
        scheduledIds.push(notificationId)
      }
    }
    
    console.log(`已为今日 ${courses.length} 门课程安排通知，成功安排 ${scheduledIds.length} 个`)
    return scheduledIds
  }

  /**
   * 显示成功消息
   * @param {string} message - 消息内容
   */
  async showSuccess(message) {
    if (this.isMobile) {
      await toastService.showSuccess(message)
    } else {
      await this.showNotification('成功', message, { icon: '/icon.png' })
    }
  }

  /**
   * 显示错误消息
   * @param {string} message - 消息内容
   */
  async showError(message) {
    if (this.isMobile) {
      await toastService.showError(message)
    } else {
      await this.showNotification('错误', message, { icon: '/icon.png' })
    }
  }

  /**
   * 显示警告消息
   * @param {string} message - 消息内容
   */
  async showWarning(message) {
    if (this.isMobile) {
      await toastService.showWarning(message)
    } else {
      await this.showNotification('警告', message, { icon: '/icon.png' })
    }
  }

  /**
   * 显示信息消息
   * @param {string} message - 消息内容
   */
  async showInfo(message) {
    if (this.isMobile) {
      await toastService.showInfo(message)
    } else {
      await this.showNotification('信息', message, { icon: '/icon.png' })
    }
  }
}

// 创建并导出通知服务实例
export const notificationService = new NotificationService()