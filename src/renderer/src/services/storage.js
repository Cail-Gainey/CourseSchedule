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
    this.isElectron = typeof window !== 'undefined' && window.electronAPI
    
    if (this.isElectron) {
      console.log('使用 Electron Store 进行数据存储')
    } else {
      console.log('使用 localStorage 进行数据存储')
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
      console.log('课程表数据保存成功')
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
        console.log('未找到保存的课程表数据，返回空数据')
        return this._getDefaultScheduleData()
      }

      // 数据迁移和验证
      const validatedData = this._validateAndMigrateData(data)
      console.log('课程表数据加载成功')
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
        theme: settings.theme || 'light',
        language: settings.language || 'zh-CN',
        autoSave: settings.autoSave !== false,
        firstWeekStart: settings.firstWeekStart || '',
        periodTimes: settings.periodTimes || this._getDefaultPeriodTimes(),
        lastUpdated: new Date()
      }

      await this._saveToStorage(this.settingsKey, settingsToSave)
      console.log('应用设置保存成功')
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
      if (this.isElectron) {
        await window.electronAPI.storage.clear()
      } else {
        localStorage.removeItem(this.storageKey)
        localStorage.removeItem(this.settingsKey)
      }
      console.log('所有数据已清除')
      return true
    } catch (error) {
      console.error('清除数据失败:', error)
      throw new Error(`清除数据失败: ${error.message}`)
    }
  }

  /**
   * 导出数据为 JSON
   * @returns {string} JSON 字符串
   */
  async exportToJSON() {
    try {
      const scheduleData = await this.loadScheduleData()
      const settings = await this.loadSettings()
      
      const exportData = {
        scheduleData,
        settings,
        exportInfo: {
          exportDate: new Date(),
          version: '1.0.0',
          source: 'CourseScheduleManager'
        }
      }

      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('导出数据失败:', error)
      throw new Error(`导出失败: ${error.message}`)
    }
  }

  /**
   * 从 JSON 导入数据
   * @param {string} jsonString - JSON 字符串
   */
  async importFromJSON(jsonString) {
    try {
      const importData = JSON.parse(jsonString)
      
      if (importData.scheduleData) {
        await this.saveScheduleData(importData.scheduleData)
      }
      
      if (importData.settings) {
        await this.saveSettings(importData.settings)
      }

      console.log('数据导入成功')
      return true
    } catch (error) {
      console.error('导入数据失败:', error)
      throw new Error(`导入失败: ${error.message}`)
    }
  }

  // 私有方法

  /**
   * 保存数据到存储
   * @private
   */
  async _saveToStorage(key, data) {
    try {
      const plainData = JSON.parse(JSON.stringify(data))
      if (this.isElectron) {
        await window.electronAPI.storage.set(key, plainData)
      } else {
        localStorage.setItem(key, JSON.stringify(plainData))
      }
    } catch (error) {
      console.error('Error in _saveToStorage:', error)
      console.error('Data that failed to save:', data)
      throw error
    }
  }

  /**
   * 从存储加载数据
   * @private
   */
  async _loadFromStorage(key) {
    if (this.isElectron) {
      return await window.electronAPI.storage.get(key)
    } else {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
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
      theme: 'light',
      language: 'zh-CN',
      autoSave: true,
      firstWeekStart: '',
      periodTimes: this._getDefaultPeriodTimes(),
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
        lastModified: data.metadata?.lastModified ? new Date(data.metadata.lastModified) : new Date(),
        version: data.metadata?.version || '1.0.0'
      }
    }

    // 验证每个课程的数据结构
    validatedData.courses = validatedData.courses.filter(course => {
      return course && 
             typeof course.id === 'string' &&
             typeof course.day === 'string' &&
             typeof course.period === 'string' &&
             typeof course.course === 'string'
    })

    return validatedData
  }
}

// 创建单例实例
export const storageService = new StorageService()

// 初始化存储服务
storageService.init()