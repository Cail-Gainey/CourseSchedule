/**
 * 本地通知服务
 * 用于移动端系统通知栏推送
 */

import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

class LocalNotificationService {
  constructor() {
    this.isInitialized = false
    this.notificationId = 1 // 通知ID计数器
    this.scheduledNotifications = new Map() // 存储已安排的通知
  }

  /**
   * 检查是否支持本地通知
   * @returns {boolean}
   */
  isLocalNotificationSupported() {
    return Capacitor.isNativePlatform()
  }

  /**
   * 初始化本地通知服务
   * @returns {Promise<boolean>} 是否初始化成功
   */
  async initialize() {
    if (this.isInitialized) {
      return true
    }

    if (!this.isLocalNotificationSupported()) {
      console.warn('当前平台不支持本地通知')
      return false
    }

    try {
      // 请求通知权限
      const permission = await this.requestPermission()
      if (permission.display !== 'granted') {
        console.warn('本地通知权限未授予')
        return false
      }

      this.isInitialized = true
      console.log('本地通知服务初始化成功')
      return true
    } catch (error) {
      console.error('本地通知服务初始化失败:', error)
      return false
    }
  }

  /**
   * 请求通知权限
   * @returns {Promise<Object>} 权限状态
   */
  async requestPermission() {
    try {
      const permission = await LocalNotifications.requestPermissions()
      console.log('本地通知权限状态:', permission)
      return permission
    } catch (error) {
      console.error('请求本地通知权限失败:', error)
      throw error
    }
  }

  /**
   * 检查通知权限状态
   * @returns {Promise<Object>} 权限状态
   */
  async checkPermissions() {
    try {
      return await LocalNotifications.checkPermissions()
    } catch (error) {
      console.error('检查本地通知权限失败:', error)
      throw error
    }
  }

  /**
   * 显示即时本地通知
   * @param {string} title - 通知标题
   * @param {string} body - 通知内容
   * @param {Object} options - 额外选项
   * @returns {Promise<void>}
   */
  async showNotification(title, body = '', options = {}) {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) {
        throw new Error('本地通知服务未初始化')
      }
    }

    const notificationId = this.notificationId++
    
    const notification = {
      id: notificationId,
      title: title,
      body: body,
      largeBody: body,
      summaryText: options.summaryText || '',
      smallIcon: options.smallIcon || 'ic_stat_icon_config_sample',
      iconColor: options.iconColor || '#488AFF',
      sound: options.sound || 'default',
      ...options
    }

    try {
      await LocalNotifications.schedule({
        notifications: [notification]
      })
      
      console.log('本地通知已发送:', notification)
    } catch (error) {
      console.error('发送本地通知失败:', error)
      throw error
    }
  }

  /**
   * 安排延时本地通知
   * @param {string} title - 通知标题
   * @param {string} body - 通知内容
   * @param {number} delay - 延时毫秒数
   * @param {Object} options - 额外选项
   * @returns {Promise<number>} 通知ID
   */
  async scheduleNotification(title, body = '', delay, options = {}) {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) {
        throw new Error('本地通知服务未初始化')
      }
    }

    const notificationId = this.notificationId++
    const scheduleTime = new Date(Date.now() + delay)
    
    const notification = {
      id: notificationId,
      title: title,
      body: body,
      largeBody: body,
      summaryText: options.summaryText || '',
      smallIcon: options.smallIcon || 'ic_stat_icon_config_sample',
      iconColor: options.iconColor || '#488AFF',
      sound: options.sound || 'default',
      schedule: {
        at: scheduleTime
      },
      ...options
    }

    try {
      await LocalNotifications.schedule({
        notifications: [notification]
      })
      
      // 存储通知信息
      this.scheduledNotifications.set(notificationId, {
        ...notification,
        scheduleTime: scheduleTime
      })
      
      console.log('本地通知已安排:', notification)
      return notificationId
    } catch (error) {
      console.error('安排本地通知失败:', error)
      throw error
    }
  }

  /**
   * 取消指定的本地通知
   * @param {number} notificationId - 通知ID
   * @returns {Promise<void>}
   */
  async cancelNotification(notificationId) {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: notificationId }]
      })
      
      this.scheduledNotifications.delete(notificationId)
      console.log('本地通知已取消:', notificationId)
    } catch (error) {
      console.error('取消本地通知失败:', error)
      throw error
    }
  }

  /**
   * 取消所有本地通知
   * @returns {Promise<void>}
   */
  async cancelAllNotifications() {
    try {
      const pending = await LocalNotifications.getPending()
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications
        })
      }
      
      this.scheduledNotifications.clear()
      console.log('所有本地通知已取消')
    } catch (error) {
      console.error('取消所有本地通知失败:', error)
      throw error
    }
  }

  /**
   * 获取待发送的本地通知
   * @returns {Promise<Array>} 待发送的通知列表
   */
  async getPendingNotifications() {
    try {
      const pending = await LocalNotifications.getPending()
      return pending.notifications
    } catch (error) {
      console.error('获取待发送通知失败:', error)
      throw error
    }
  }

  /**
   * 显示课程提醒本地通知
   * @param {Object} course - 课程信息
   * @param {number} minutesBefore - 提前分钟数
   * @returns {Promise<void>}
   */
  async showCourseNotification(course, minutesBefore = 0) {
    const courseName = course.name || course.course || '未知课程'
    const location = course.location || '未设置'
    const timeRange = course.startTime && course.endTime ? `${course.startTime} - ${course.endTime}` : '时间未设置'
    
    const title = courseName
    const body = `课程：${courseName}\n教室：${location}\n时间：${timeRange}`
    
    const options = {
      summaryText: '课程提醒',
      iconColor: '#409EFF',
      sound: 'default',
      data: {
        type: 'course_reminder',
        courseId: course.id,
        courseName: courseName,
        location: location,
        timeRange: timeRange
      }
    }

    if (minutesBefore > 0) {
      const delay = minutesBefore * 60 * 1000
      return await this.scheduleNotification(title, body, delay, options)
    } else {
      await this.showNotification(title, body, options)
    }
  }
}

// 创建并导出服务实例
export const localNotificationService = new LocalNotificationService()

// 自动初始化（如果支持）
if (localNotificationService.isLocalNotificationSupported()) {
  localNotificationService.initialize().catch(error => {
    console.error('本地通知服务自动初始化失败:', error)
  })
}