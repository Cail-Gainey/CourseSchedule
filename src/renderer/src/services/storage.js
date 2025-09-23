import { debounce, formatDate } from '../utils/index.js'

/**
 * 存储服务类
 * 处理课程表数据的持久化存储
 */
class StorageService {
  constructor() {
    this.storageKey = 'courseScheduleData'
    this.settingsKey = 'courseScheduleSettings'
    this.autoSaveDelay = 1000 // 1秒防抖延迟

    // 创建防抖的自动保存函数
    this.debouncedSave = debounce(this._saveToStorage.bind(this), this.autoSaveDelay)
  }

  /**
   * 初始化存储服务
   * 检查是否在 Electron 环境中，选择合适的存储方式
   */
  init() {
    try {
      // 更安全的环境检测
      this.isElectron =
        typeof window !== 'undefined' &&
        window.electronAPI &&
        typeof window.electronAPI.storage === 'object'

      // 环境检测完成，选择合适的存储方式
    } catch (error) {
      console.warn('存储服务初始化时检测环境失败，使用 localStorage:', error)
      this.isElectron = false
    }
  }

  /**
   * 保存课程表数据
   * @param {Object} scheduleData - 课程表数据
   */
  async saveScheduleData(scheduleData) {
    try {
      const dataToSave = {
        courses: scheduleData.courses || [],
        metadata: {
          semester: scheduleData.metadata?.semester || '',
          year: scheduleData.metadata?.year || new Date().getFullYear().toString(),
          lastModified: new Date(),
          version: '1.0.0'
        }
      }

      await this._saveToStorage(this.storageKey, dataToSave)
      return true
    } catch (error) {
      console.error('保存课程表数据失败:', error)
      throw new Error(`保存失败: ${error.message}`)
    }
  }

  /**
   * 加载课程表数据
   * @returns {Object} 课程表数据
   */
  async loadScheduleData() {
    try {
      const data = await this._loadFromStorage(this.storageKey)

      if (!data) {
        return this._getDefaultScheduleData()
      }

      // 数据迁移和验证
      const validatedData = this._validateAndMigrateData(data)
      return validatedData
    } catch (error) {
      console.error('加载课程表数据失败:', error)
      return this._getDefaultScheduleData()
    }
  }

  /**
   * 保存应用设置
   * @param {Object} settings - 设置数据
   */
  async saveSettings(settings) {
    try {
      const settingsToSave = {
        theme: settings.theme || 'auto',
        language: settings.language || 'zh-CN',
        autoSave: settings.autoSave !== false,
        firstWeekStart: settings.firstWeekStart || '',
        periodTimes: settings.periodTimes || this._getDefaultPeriodTimes(),
        lastUpdated: new Date()
      }

      await this._saveToStorage(this.settingsKey, settingsToSave)
      return true
    } catch (error) {
      console.error('保存应用设置失败:', error)
      throw new Error(`保存设置失败: ${error.message}`)
    }
  }

  /**
   * 加载应用设置
   * @returns {Object} 设置数据
   */
  async loadSettings() {
    try {
      const settings = await this._loadFromStorage(this.settingsKey)

      if (!settings) {
        return this._getDefaultSettings()
      }

      return {
        theme: settings.theme || 'light',
        language: settings.language || 'zh-CN',
        autoSave: settings.autoSave !== false,
        firstWeekStart: settings.firstWeekStart || '',
        periodTimes: settings.periodTimes || this._getDefaultPeriodTimes(),
        lastUpdated: settings.lastUpdated || new Date()
      }
    } catch (error) {
      console.error('加载应用设置失败:', error)
      return this._getDefaultSettings()
    }
  }

  /**
   * 自动保存课程表数据（防抖）
   * @param {Object} scheduleData - 课程表数据
   */
  autoSaveScheduleData(scheduleData) {
    this.debouncedSave(this.storageKey, {
      courses: scheduleData.courses || [],
      metadata: {
        ...scheduleData.metadata,
        lastModified: new Date()
      }
    })
  }

  /**
   * 清除所有存储数据
   */
  async clearAllData() {
    try {
      if (this.isElectron && window.electronAPI && window.electronAPI.storage) {
        await window.electronAPI.storage.clear()
      } else {
        localStorage.removeItem(this.storageKey)
        localStorage.removeItem(this.settingsKey)
      }
      return true
    } catch (error) {
      console.error('清除数据失败:', error)
      // 如果Electron清除失败，尝试使用localStorage作为备用
      if (this.isElectron) {
        try {
          localStorage.removeItem(this.storageKey)
          localStorage.removeItem(this.settingsKey)
          return true
        } catch (fallbackError) {
          console.error('localStorage备用清除也失败:', fallbackError)
          throw new Error(`清除数据失败: ${fallbackError.message}`)
        }
      } else {
        throw new Error(`清除数据失败: ${error.message}`)
      }
    }
  }

  /**
   * 保存数据到存储
   * @private
   */
  async _saveToStorage(key, data) {
    try {
      const plainData = JSON.parse(JSON.stringify(data))
      if (this.isElectron && window.electronAPI && window.electronAPI.storage) {
        await window.electronAPI.storage.set(key, plainData)
      } else {
        localStorage.setItem(key, JSON.stringify(plainData))
      }
    } catch (error) {
      // 如果Electron存储失败，尝试使用localStorage作为备用
      if (this.isElectron) {
        try {
          localStorage.setItem(key, JSON.stringify(plainData))
        } catch (fallbackError) {
          console.error('localStorage备用存储也失败:', fallbackError)
          throw fallbackError
        }
      } else {
        throw error
      }
    }
  }

  /**
   * 从存储加载数据
   * @private
   */
  async _loadFromStorage(key) {
    try {
      if (this.isElectron && window.electronAPI && window.electronAPI.storage) {
        return await window.electronAPI.storage.get(key)
      } else {
        const data = localStorage.getItem(key)
        return data ? JSON.parse(data) : null
      }
    } catch (error) {
      // 如果Electron存储失败，尝试使用localStorage作为备用
      if (this.isElectron) {
        try {
          const data = localStorage.getItem(key)
          return data ? JSON.parse(data) : null
        } catch (fallbackError) {
          console.error('localStorage备用存储也失败:', fallbackError)
          return null
        }
      } else {
        console.error('localStorage读取失败:', error)
        return null
      }
    }
  }

  /**
   * 获取默认课程表数据
   * @private
   */
  _getDefaultScheduleData() {
    return {
      courses: [],
      metadata: {
        semester: '',
        year: new Date().getFullYear().toString(),
        lastModified: new Date(),
        version: '1.0.0'
      }
    }
  }

  /**
   * 获取默认设置
   * @private
   */
  _getDefaultSettings() {
    return {
      theme: 'auto',
      language: 'zh-CN',
      autoSave: true,
      firstWeekStart: '',
      periodTimes: this._getDefaultPeriodTimes(),
      notificationEnabled: false,
      notificationMinutes: 10,
      lastUpdated: new Date()
    }
  }

  /**
   * 获取默认课程时间配置
   * @private
   */
  _getDefaultPeriodTimes() {
    return [
      { startTime: '08:00', endTime: '08:45' },
      { startTime: '08:55', endTime: '09:40' },
      { startTime: '10:00', endTime: '10:45' },
      { startTime: '10:55', endTime: '11:40' },
      { startTime: '14:00', endTime: '14:45' },
      { startTime: '14:55', endTime: '15:40' },
      { startTime: '16:00', endTime: '16:45' },
      { startTime: '16:55', endTime: '17:40' },
      { startTime: '19:00', endTime: '19:45' },
      { startTime: '19:55', endTime: '20:40' },
      { startTime: '20:50', endTime: '21:35' }
    ]
  }

  /**
   * 验证和迁移数据
   * @private
   */
  _validateAndMigrateData(data) {
    // 确保数据结构正确
    const validatedData = {
      courses: Array.isArray(data.courses) ? data.courses : [],
      metadata: {
        semester: data.metadata?.semester || '',
        year: data.metadata?.year || new Date().getFullYear().toString(),
        lastModified: data.metadata?.lastModified
          ? new Date(data.metadata.lastModified)
          : new Date(),
        version: data.metadata?.version || '1.0.0'
      }
    }

    // 验证每个课程的数据结构
    validatedData.courses = validatedData.courses.filter((course) => {
      return (
        course &&
        typeof course.id === 'string' &&
        typeof course.day === 'string' &&
        typeof course.period === 'string' &&
        typeof course.course === 'string'
      )
    })

    return validatedData
  }
}

// 创建单例实例
export const storageService = new StorageService()

// 初始化存储服务
storageService.init()
