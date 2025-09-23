/**
 * Toast服务 - 用于移动端消息推送
 * 基于Capacitor Toast插件实现
 */

import { Toast } from '@capacitor/toast'
import { Capacitor } from '@capacitor/core'

class ToastService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform()
    this.platform = Capacitor.getPlatform()
  }

  /**
   * 检查是否支持Toast功能
   * @returns {boolean} 是否支持Toast
   */
  isToastSupported() {
    return this.isNative && (this.platform === 'android' || this.platform === 'ios')
  }

  /**
   * 显示短时间Toast消息
   * @param {string} text - 要显示的文本
   * @returns {Promise<void>}
   */
  async showShort(text) {
    if (!this.isToastSupported()) {
      console.warn('当前平台不支持Toast功能，使用控制台输出:', text)
      return
    }

    try {
      await Toast.show({
        text: text,
        duration: 'short',
        position: 'bottom'
      })
    } catch (error) {
      console.error('显示短Toast失败:', error)
      throw error
    }
  }

  /**
   * 显示长时间Toast消息
   * @param {string} text - 要显示的文本
   * @returns {Promise<void>}
   */
  async showLong(text) {
    if (!this.isToastSupported()) {
      console.warn('当前平台不支持Toast功能，使用控制台输出:', text)
      return
    }

    try {
      await Toast.show({
        text: text,
        duration: 'long',
        position: 'bottom'
      })
    } catch (error) {
      console.error('显示长Toast失败:', error)
      throw error
    }
  }

  /**
   * 显示自定义Toast消息
   * @param {Object} options - Toast选项
   * @param {string} options.text - 要显示的文本
   * @param {'short'|'long'} options.duration - 显示时长
   * @param {'top'|'center'|'bottom'} options.position - 显示位置
   * @returns {Promise<void>}
   */
  async show(options = {}) {
    if (!this.isToastSupported()) {
      console.warn('当前平台不支持Toast功能，使用控制台输出:', options.text)
      return
    }

    const defaultOptions = {
      text: '',
      duration: 'short',
      position: 'bottom'
    }

    const toastOptions = { ...defaultOptions, ...options }

    try {
      await Toast.show(toastOptions)
    } catch (error) {
      console.error('显示Toast失败:', error)
      throw error
    }
  }

  /**
   * 显示课程提醒Toast
   * @param {Object} course - 课程信息
   * @param {number} minutesBefore - 提前分钟数
   * @returns {Promise<void>}
   */
  async showCourseReminder(course, minutesBefore) {
    const courseName = course.name || course.course || '未知课程'
    const location = course.location || '未设置'
    const timeRange = course.startTime && course.endTime ? `${course.startTime} - ${course.endTime}` : '时间未设置'
    
    const text = `${courseName}\n教室：${location}\n时间：${timeRange}`
    
    try {
      await this.show({
        text: text,
        duration: 'long',
        position: 'top'
      })
    } catch (error) {
      console.error('显示课程提醒Toast失败:', error)
      throw error
    }
  }

  /**
   * 显示成功消息Toast
   * @param {string} message - 成功消息
   * @returns {Promise<void>}
   */
  async showSuccess(message) {
    try {
      await this.show({
        text: `✅ ${message}`,
        duration: 'short',
        position: 'bottom'
      })
    } catch (error) {
      console.error('显示成功Toast失败:', error)
      throw error
    }
  }

  /**
   * 显示错误消息Toast
   * @param {string} message - 错误消息
   * @returns {Promise<void>}
   */
  async showError(message) {
    try {
      await this.show({
        text: `❌ ${message}`,
        duration: 'long',
        position: 'bottom'
      })
    } catch (error) {
      console.error('显示错误Toast失败:', error)
      throw error
    }
  }

  /**
   * 显示警告消息Toast
   * @param {string} message - 警告消息
   * @returns {Promise<void>}
   */
  async showWarning(message) {
    try {
      await this.show({
        text: `⚠️ ${message}`,
        duration: 'short',
        position: 'bottom'
      })
    } catch (error) {
      console.error('显示警告Toast失败:', error)
      throw error
    }
  }

  /**
   * 显示信息消息Toast
   * @param {string} message - 信息消息
   * @returns {Promise<void>}
   */
  async showInfo(message) {
    try {
      await this.show({
        text: `ℹ️ ${message}`,
        duration: 'short',
        position: 'bottom'
      })
    } catch (error) {
      console.error('显示信息Toast失败:', error)
      throw error
    }
  }

  /**
   * 获取当前平台信息
   * @returns {Object} 平台信息
   */
  getPlatformInfo() {
    return {
      platform: this.platform,
      isNative: this.isNative,
      isToastSupported: this.isToastSupported()
    }
  }
}

// 创建并导出Toast服务实例
export const toastService = new ToastService()