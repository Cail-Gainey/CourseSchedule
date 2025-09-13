/**
 * 课程数据模型
 * @typedef {Object} Course
 * @property {string} id - 课程唯一标识符
 * @property {string} day - 星期 ("星期一" to "星期日")
 * @property {string} period - 节次 ("第1节" to "第12节")
 * @property {string} course - 课程名称
 * @property {string} teacher - 教师姓名
 * @property {string} location - 教室/地点
 * @property {string} weeks - 周次范围 ("1-16" or "1-8,10-16")
 */

/**
 * 课程表数据模型
 * @typedef {Object} ScheduleData
 * @property {Course[]} courses - 课程列表
 * @property {Object} metadata - 元数据
 * @property {string} metadata.semester - 学期
 * @property {string} metadata.year - 年份
 * @property {Date} metadata.lastModified - 最后修改时间
 */

/**
 * Excel 导入配置
 * @typedef {Object} ExcelConfig
 * @property {number} dayRowIndex - 包含星期标题的行索引
 * @property {number} periodColumnIndex - 包含节次标签的列索引
 * @property {number} dataStartRow - 课程数据开始行
 * @property {number} dataStartColumn - 课程数据开始列
 */

// 常量定义
export const DAYS_OF_WEEK = [
  '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'
]

export const PERIODS = [
  '第1节', '第2节', '第3节', '第4节', '第5节', '第6节',
  '第7节', '第8节', '第9节', '第10节', '第11节', '第12节'
]

export const THEME_OPTIONS = ['light', 'dark']

// 默认配置
export const DEFAULT_EXCEL_CONFIG = {
  dayRowIndex: 0,
  periodColumnIndex: 0,
  dataStartRow: 1,
  dataStartColumn: 1
}