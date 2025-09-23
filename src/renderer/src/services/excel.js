import { DAYS_OF_WEEK, PERIODS } from '../types/index.js'
import { createCourse, validateCourse } from '../utils/index.js'
import * as XLSX from 'xlsx'

/**
 * Excel 处理服务
 */
export class ExcelService {
  constructor() {
    this.supportedFormats = ['.xlsx', '.xls']
  }

  /**
   * 导入 Excel 文件并转换为课程数据
   */
  static async importExcel(file) {
    try {
      // 使用 FileReader 读取文件
      const arrayBuffer = await this.readFileAsArrayBuffer(file)

      // 转换为 JSON 数据
      const jsonData = await this.convertExcelToJSON(arrayBuffer)

      // 解析 JSON 数据为课程
      return this.parseJSONData(jsonData)
    } catch (error) {
      console.error('Excel 导入失败:', error)
      throw new Error(`导入失败: ${error.message}`)
    }
  }

  /**
   * 读取文件为 ArrayBuffer
   */
  static readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * 将 Excel 转换为 JSON 数据
   */
  static async convertExcelToJSON(arrayBuffer) {
    return new Promise((resolve, reject) => {
      try {
        console.log('=== Excel解析开始 ===')
        console.log('文件大小:', arrayBuffer.byteLength, 'bytes')

        // 使用 xlsx 库解析 Excel 文件
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0] // 使用第一个工作表

        if (!sheetName) {
          throw new Error('Excel文件中没有找到工作表')
        }

        const worksheet = workbook.Sheets[sheetName]

        // 转换为JSON数组
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
        console.log('Excel解析成功，数据行数:', jsonData.length)
        console.log('前5行数据:', jsonData.slice(0, 5))

        resolve(jsonData)
      } catch (error) {
        console.error('Excel解析错误:', error)
        console.error('错误堆栈:', error.stack)
        reject(error)
      }
    })
  }

  /**
   * 解析 JSON 数据为课程
   */
  static parseJSONData(jsonData) {
    const courses = []
    let headerRowIndex = -1
    let periodColumnIndex = -1

    // 查找表头行 - 进一步降低检测要求
    console.log('开始查找表头行，数据行数:', jsonData.length)

    for (let i = 0; i < Math.min(jsonData.length, 15); i++) {
      const row = jsonData[i] || []
      console.log(`检查第${i}行:`, row.slice(0, 10)) // 只显示前10列

      // 检测星期信息 - 支持更多格式
      const dayCount = DAYS_OF_WEEK.filter((day) => {
        const dayShort = day.replace('星期', '')
        return row.some((cell) => {
          if (!cell) return false
          const cellStr = cell.toString().toLowerCase()
          return (
            cellStr.includes(day) ||
            cellStr.includes(dayShort) ||
            cellStr.includes('周' + dayShort) ||
            cellStr === dayShort || // 精确匹配简称
            (dayShort === '一' && (cellStr.includes('monday') || cellStr === '1')) ||
            (dayShort === '二' && (cellStr.includes('tuesday') || cellStr === '2')) ||
            (dayShort === '三' && (cellStr.includes('wednesday') || cellStr === '3')) ||
            (dayShort === '四' && (cellStr.includes('thursday') || cellStr === '4')) ||
            (dayShort === '五' && (cellStr.includes('friday') || cellStr === '5')) ||
            (dayShort === '六' && (cellStr.includes('saturday') || cellStr === '6')) ||
            (dayShort === '日' &&
              (cellStr.includes('sunday') || cellStr === '7' || cellStr === '0'))
          )
        })
      }).length

      const hasPeriodHeader = row.some(
        (cell) =>
          cell &&
          (cell.toString().includes('节次') ||
            cell.toString().includes('时间') ||
            cell.toString().includes('节') ||
            cell.toString().includes('课时') ||
            cell.toString().includes('时段'))
      )

      // 检测是否有课程内容（非空且不全是数字）
      const hasCourseContent = row.some((cell) => {
        if (!cell) return false
        const cellStr = cell.toString().trim()
        return (
          cellStr.length > 0 && !/^\d+$/.test(cellStr) && cellStr !== '节次' && cellStr !== '时间'
        )
      })

      console.log(
        `第${i}行检测结果: 星期数=${dayCount}, 有节次标题=${hasPeriodHeader}, 有课程内容=${hasCourseContent}`
      )

      // 优先检测标准表头：有节次标题且有星期信息
      if (hasPeriodHeader && dayCount >= 2) {
        headerRowIndex = i
        console.log(`找到标准表头行: 第${i}行`)

        // 查找节次列
        for (let j = 0; j < row.length; j++) {
          const cell = row[j]
          if (
            cell &&
            (cell.toString().includes('节次') ||
              cell.toString().includes('时间') ||
              cell.toString().includes('课时'))
          ) {
            periodColumnIndex = j
            console.log(`找到节次列: 第${j}列`)
            break
          }
        }
        break
      }
      // 次要检测：有节次标题或多个星期信息
      else if (hasPeriodHeader || dayCount >= 3) {
        headerRowIndex = i
        console.log(`找到可能的表头行: 第${i}行`)

        // 查找节次列
        for (let j = 0; j < row.length; j++) {
          const cell = row[j]
          if (
            cell &&
            (cell.toString().includes('节') ||
              cell.toString().includes('时间') ||
              cell.toString().includes('课时'))
          ) {
            periodColumnIndex = j
            console.log(`找到节次列: 第${j}列`)
            break
          }
        }
        break
      }
    }

    // 如果还是没找到，使用第一行作为表头
    if (headerRowIndex === -1 && jsonData.length > 0) {
      console.log('未找到明确的表头行，使用第一行作为表头')
      headerRowIndex = 0
    }

    if (headerRowIndex === -1) {
      console.error('完全无法解析数据格式')
      throw new Error('未找到有效的课程表格式')
    }

    const headerRow = jsonData[headerRowIndex] || []
    const dayColumnMap = new Map()

    headerRow.forEach((cell, index) => {
      if (cell) {
        const cellStr = cell.toString().toLowerCase()
        DAYS_OF_WEEK.forEach((day) => {
          const dayShort = day.replace('星期', '')
          if (
            cellStr.includes(day) ||
            cellStr.includes(dayShort) ||
            cellStr.includes('周' + dayShort) ||
            (dayShort === '一' && cellStr.includes('monday')) ||
            (dayShort === '二' && cellStr.includes('tuesday')) ||
            (dayShort === '三' && cellStr.includes('wednesday')) ||
            (dayShort === '四' && cellStr.includes('thursday')) ||
            (dayShort === '五' && cellStr.includes('friday')) ||
            (dayShort === '六' && cellStr.includes('saturday')) ||
            (dayShort === '日' && cellStr.includes('sunday'))
          ) {
            dayColumnMap.set(day, index)
            console.log(`检测到星期列: ${day} -> 第${index}列`)
          }
        })
      }
    })

    console.log('=== 开始解析课程数据 ===')
    console.log('表头行索引:', headerRowIndex)
    console.log('节次列索引:', periodColumnIndex)
    console.log('星期列映射:', Array.from(dayColumnMap.entries()))

    // 解析课程数据
    for (let rowIndex = headerRowIndex + 1; rowIndex < jsonData.length; rowIndex++) {
      const row = jsonData[rowIndex] || []
      console.log(`\n--- 解析第${rowIndex}行 ---`)
      console.log('行内容:', row.slice(0, 10)) // 只显示前10列

      let period = ''

      if (periodColumnIndex >= 0 && row[periodColumnIndex]) {
        const periodCell = row[periodColumnIndex].toString().trim()

        // 处理数字格式的节次
        const periodMatch = periodCell.match(/第?(\d+)节?/)
        if (periodMatch) {
          period = `第${periodMatch[1]}节`
        }
        // 处理中文数字格式的节次
        else {
          const chineseNumbers = {
            一: '1',
            二: '2',
            三: '3',
            四: '4',
            五: '5',
            六: '6',
            七: '7',
            八: '8',
            九: '9',
            十: '10',
            十一: '11',
            十二: '12'
          }

          if (chineseNumbers[periodCell]) {
            period = `第${chineseNumbers[periodCell]}节`
          }
        }

        console.log('解析到节次:', period, '来源:', periodCell)
      }

      if (!period) {
        const inferredPeriod = rowIndex - headerRowIndex
        if (inferredPeriod <= 12) {
          period = `第${inferredPeriod}节`
        }
        console.log('使用推断节次:', period)
      }

      if (!period) {
        console.log('无法确定节次，跳过该行')
        continue
      }

      let rowCourseCount = 0
      dayColumnMap.forEach((columnIndex, day) => {
        const cell = row[columnIndex]
        console.log(`检查${day}(第${columnIndex}列):`, cell)

        if (cell && cell.toString().trim()) {
          console.log(`解析${day}的课程内容:`, cell.toString())
          const courseInfos = this.parseCourseCell(cell.toString())
          console.log(`${day}解析出${courseInfos.length}门课程:`, courseInfos)

          for (const courseInfo of courseInfos) {
            if (courseInfo.course) {
              try {
                const finalPeriod = courseInfo.period || period

                const course = createCourse({
                  day,
                  period: finalPeriod,
                  course: courseInfo.course,
                  teacher: courseInfo.teacher || '',
                  location: courseInfo.location || '',
                  weeks: courseInfo.weeks || '1-16'
                })

                console.log('创建的课程对象:', course)

                // 使用非严格模式验证课程，提高导入成功率
                const validation = validateCourse(course, false)
                if (validation.isValid) {
                  courses.push(course)
                  rowCourseCount++
                  console.log('✓ 课程验证通过，已添加到课程列表')
                } else {
                  console.warn(`✗ 课程验证失败: ${validation.errors.join(', ')}`, course)
                }
              } catch (error) {
                console.warn(`跳过无效课程: ${error.message}`, courseInfo)
              }
            } else {
              console.log('课程信息中缺少课程名称，跳过')
            }
          }
        } else {
          console.log(`${day}列为空或无内容`)
        }
      })

      console.log(`第${rowIndex}行共添加${rowCourseCount}门课程`)
    }

    return courses
  }

  /**
   * 解析课程单元格内容
   */
  static parseCourseCell(cellText, otherCells = []) {
    console.log('\n=== 解析课程单元格 ===')
    console.log('原始内容:', cellText)

    const cleanText = cellText.replace(/&#13;/g, '\n').replace(/&#10;/g, '\n')
    const courses = []

    // 如果单元格为空或只包含空白字符，返回空数组
    if (!cleanText || !cleanText.trim()) {
      console.log('单元格为空，返回空数组')
      return courses
    }

    console.log('清理后的内容:', cleanText)

    // 尝试识别课程块（以课程名称开头的完整信息块）
    const courseBlocks = []
    const lines = cleanText
      .trim()
      .split(/[\r\n]+/)
      .map((line) => line.trim())
      .filter((line) => line)
    console.log('分割后的行数:', lines.length)
    console.log('各行内容:', lines)

    // 识别课程名称行（包含课程信息的行）
    let currentBlock = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // 判断是否为课程名称行（包含[考查]、[必修]、[选修]、[考试]等标记）
      if (line.match(/\[(考查|必修|选修|实践|理论|考试)\]/)) {
        // 如果当前块不为空，保存它
        if (currentBlock.length > 0) {
          courseBlocks.push(currentBlock.join(' '))
        }

        // 开始新的课程块
        currentBlock = [line]
      } else {
        // 添加到当前课程块
        if (currentBlock.length > 0) {
          currentBlock.push(line)
        }
      }
    }

    // 保存最后一个块
    if (currentBlock.length > 0) {
      courseBlocks.push(currentBlock.join(' '))
    }

    console.log('识别到的课程块数量:', courseBlocks.length)
    console.log('课程块内容:', courseBlocks)

    // 如果没有识别到课程块，回退到原有逻辑
    if (courseBlocks.length === 0) {
      courseBlocks.push(cleanText)
    }

    for (let blockIndex = 0; blockIndex < courseBlocks.length; blockIndex++) {
      const blockText = courseBlocks[blockIndex]
      console.log(`\n--- 处理第${blockIndex + 1}个课程块: "${blockText}" ---`)

      if (!blockText.trim()) {
        console.log('空块，跳过')
        continue
      }

      // 更宽松的课程名称提取
      let courseName = blockText
      console.log('初始课程名称:', courseName)

      // 提取课程名称（只保留课程名称部分）
      const originalName = courseName
      // 提取课程名称（在第一个方括号之前的内容）
      const courseNameMatch = courseName.match(/^([^\[]+)\[(考查|必修|选修|实践|理论|考试)\]/)
      if (courseNameMatch) {
        courseName = courseNameMatch[1].trim()
      } else {
        // 移除常见的非课程信息
        courseName = courseName.replace(/\[[^\]]*\]/g, '') // 移除方括号内容
        courseName = courseName.replace(/\([^)]*\)/g, '') // 移除括号内容
        courseName = courseName.replace(/[：:].*/g, '') // 移除冒号后的内容
        courseName = courseName.replace(/\s+\w+-\w+\[.*?\].*$/g, '') // 移除教师信息
        courseName = courseName.replace(/\s+[\u4e00-\u9fa5]+实验室.*$/g, '') // 移除地点信息
        courseName = courseName.replace(/\s+[\u4e00-\u9fa5]+教室.*$/g, '') // 移除地点信息
        courseName = courseName.replace(/\s+组班.*$/g, '') // 移除组班信息
        courseName = courseName.trim()
      }

      if (originalName !== courseName) {
        console.log('清理后的课程名称:', courseName)
      }

      // 过滤无效的课程名称
      const invalidReasons = []
      if (!courseName) invalidReasons.push('名称为空')
      if (/^\d+$/.test(courseName)) invalidReasons.push('纯数字')
      if (courseName.length < 2) invalidReasons.push('太短')
      if (/^[\s\-_]+$/.test(courseName)) invalidReasons.push('只有空格或符号')
      if (
        ['节次', '时间', '课时', '时段', '星期', '周'].some((keyword) =>
          courseName.includes(keyword)
        )
      ) {
        invalidReasons.push('包含时间关键词')
      }

      if (invalidReasons.length > 0) {
        console.log('跳过无效课程名称:', courseName, '原因:', invalidReasons.join(', '))
        continue
      }

      console.log('✓ 有效课程名称:', courseName)

      // 从课程块中提取教师信息
      let teacher = ''
      console.log('开始提取教师信息...')

      // 匹配教师姓名模式（如：肖道玲-swsm3827[主讲]）
      const teacherMatch = blockText.match(/([\u4e00-\u9fa5]{2,4})-\w+\[(主讲|辅讲)\]/)
      if (teacherMatch) {
        teacher = teacherMatch[1]
        console.log('找到教师:', teacher)
      } else {
        // 尝试匹配更多教师格式：姓名-工号、姓名[角色]等
        const teacherPatterns = [
          /([\u4e00-\u9fa5]{2,4})-\w+/, // 姓名-工号
          /([\u4e00-\u9fa5]{2,4})\[(主讲|辅讲|教师)\]/, // 姓名[角色]
          /教师[：:]\s*([\u4e00-\u9fa5]{2,4})/, // 教师：姓名
          /([\u4e00-\u9fa5]{2,4})(?:老师|教师)/ // 姓名老师/教师
        ]

        for (const pattern of teacherPatterns) {
          const match = blockText.match(pattern)
          if (match && match[1] !== courseName.replace(/\s+/g, '')) {
            teacher = match[1]
            console.log('通过模式找到教师:', teacher)
            break
          }
        }
      }

      if (!teacher) {
        console.log('未找到教师信息，使用默认值')
      }

      // 从课程块中提取地点信息
      console.log('开始提取地点信息...')
      let location = ''

      // 匹配地点模式（如：鸿蒙开发实验室 A8307、多媒体教室 A7202）
      const locationPatterns = [
        /(\w+实验室|\w+教室)\s+([A-Z]?\d{3,4}[A-Z]?)/, // 实验室/教室 + 房间号
        /([A-Z]?\d{3,4}[A-Z]?)\([^)]+\)/, // 房间号(描述)
        /地点[：:]\s*([A-Z]?\d{3,4}[A-Z]?)/, // 地点：房间号
        /教室[：:]\s*([A-Z]?\d{3,4}[A-Z]?)/, // 教室：房间号
        /([A-Z]?\d{3,4}[A-Z]?)(?!\d)/ // 独立的房间号
      ]

      for (const pattern of locationPatterns) {
        const match = blockText.match(pattern)
        if (match) {
          if (match[2]) {
            location = match[2] // 提取房间号
          } else if (match[1] && /^[A-Z]?\d{3,4}[A-Z]?$/.test(match[1])) {
            location = match[1]
          }
          if (location) {
            console.log('找到地点:', location)
            break
          }
        }
      }

      if (!location) {
        // 尝试提取中文地点信息
        const chineseLocationMatch = blockText.match(/(\w+实验室|\w+教室|\w+机房)/)
        if (chineseLocationMatch) {
          location = chineseLocationMatch[1]
          console.log('找到中文地点:', location)
        }
      }

      if (!location) {
        console.log('未找到地点信息，使用默认值')
      }

      // 从课程块中提取周次信息
      console.log('开始提取周次信息...')
      let weeks = '1-16'

      // 匹配各种周次格式
      const weekPatterns = [
        /\[([\d,-]+)周\]/, // [1-3,5-16周] 复杂格式
        /\[(\d+)-(\d+)周\]/, // [9-16周] 简单范围
        /\[(\d+)周\]/, // [1周] 单周
        /(\d+)-(\d+)周/, // 9-16周 无方括号
        /第(\d+)周/, // 第1周
        /周次[：:]\s*([\d,-]+)/, // 周次：1-3,5-16
        /([\d,-]+)周/ // 1-3,5-16周
      ]

      let weekMatch = null
      let matchedPattern = ''

      for (const pattern of weekPatterns) {
        weekMatch = blockText.match(pattern)
        if (weekMatch) {
          matchedPattern = pattern.toString()
          break
        }
      }

      if (weekMatch) {
        const weekStr = weekMatch[1]
        console.log('找到周次格式:', weekStr, '匹配模式:', matchedPattern)

        if (weekStr.includes(',') || weekStr.includes('-')) {
          // 解析复杂周次格式
          const weekRanges = weekStr.split(',')
          const allWeeks = []

          weekRanges.forEach((range) => {
            range = range.trim()
            if (range.includes('-')) {
              // 处理范围格式，如"1-3"或"5-16"
              const [start, end] = range.split('-').map((num) => parseInt(num.trim()))
              if (!isNaN(start) && !isNaN(end) && start <= end) {
                for (let i = start; i <= end; i++) {
                  allWeeks.push(i)
                }
              }
            } else {
              // 处理单个周次
              const weekNum = parseInt(range)
              if (!isNaN(weekNum)) {
                allWeeks.push(weekNum)
              }
            }
          })

          // 排序并去重
          const uniqueWeeks = [...new Set(allWeeks)].sort((a, b) => a - b)

          if (uniqueWeeks.length > 0) {
            // 检查是否为连续周次
            let isConsecutive = true
            for (let i = 1; i < uniqueWeeks.length; i++) {
              if (uniqueWeeks[i] !== uniqueWeeks[i - 1] + 1) {
                isConsecutive = false
                break
              }
            }

            if (isConsecutive) {
              // 连续周次，使用范围格式
              weeks = `${uniqueWeeks[0]}-${uniqueWeeks[uniqueWeeks.length - 1]}`
            } else {
              // 不连续周次，保持原格式或转换为最大范围
              const minWeek = Math.min(...uniqueWeeks)
              const maxWeek = Math.max(...uniqueWeeks)
              weeks = `${minWeek}-${maxWeek}`
              console.log('不连续周次转换为范围:', weeks, '实际包含:', uniqueWeeks)
            }
            console.log('解析后的周次范围:', weeks, '包含周次:', uniqueWeeks)
          }
        } else {
          // 单个数字
          const weekNum = parseInt(weekStr)
          if (!isNaN(weekNum)) {
            weeks = `${weekNum}-${weekNum}`
            console.log('单周次:', weeks)
          }
        }
      } else {
        console.log('未找到周次信息，使用默认值:', weeks)
      }

      // 从课程块中提取节次信息
      console.log('开始提取节次信息...')
      let periods = []

      // 优先匹配方括号中的节次信息，如[1-4]、[2]
      const bracketPeriodMatch = blockText.match(/\[(\d+)-(\d+)\]/)
      if (bracketPeriodMatch) {
        const startPeriod = parseInt(bracketPeriodMatch[1])
        const endPeriod = parseInt(bracketPeriodMatch[2])
        // 将跨节次拆分为多个单独的节次
        for (let i = startPeriod; i <= endPeriod; i++) {
          periods.push(`第${i}节`)
        }
        console.log('从方括号中找到节次范围，拆分为:', periods)
      } else {
        const singleBracketPeriodMatch = blockText.match(/\[(\d+)\]/)
        if (singleBracketPeriodMatch) {
          periods.push(`第${singleBracketPeriodMatch[1]}节`)
          console.log('从方括号中找到单节次:', periods[0])
        } else {
          console.log('未找到节次信息')
        }
      }

      // 为每个节次创建一个课程记录
      if (periods.length > 0) {
        periods.forEach((period) => {
          const courseInfo = {
            course: courseName,
            teacher: teacher || '',
            location: location || '',
            weeks: weeks,
            period: period
          }

          console.log('✓ 课程信息提取完成:', courseInfo)
          courses.push(courseInfo)
        })
      } else {
        // 如果没有找到节次信息，创建一个没有节次的记录
        const courseInfo = {
          course: courseName,
          teacher: teacher || '',
          location: location || '',
          weeks: weeks,
          period: ''
        }

        console.log('✓ 课程信息提取完成（无节次）:', courseInfo)
        courses.push(courseInfo)
      }
    }

    console.log(`=== 单元格解析完成，共提取${courses.length}门课程 ===`)
    return courses
  }

  /**
   * 提取地点信息
   */
  static extractLocation(content, otherCells = []) {
    if (!content) return ''

    const text = content.toString().trim()

    // 地点关键词匹配
    const locationKeywords = ['教室', '楼', '实验室', '机房', '会议室', '大厅', '礼堂']

    // 按行分割检查
    const lines = text.split(/[\n\r]+/)

    for (const line of lines) {
      const trimmedLine = line.trim()

      // 关键词匹配
      for (const keyword of locationKeywords) {
        if (trimmedLine.includes(keyword)) {
          return trimmedLine
        }
      }

      // 教室编号模式匹配
      const patterns = [
        /([A-Z]\d{3,4}[A-Z]?)/, // A101, B205A
        /(\d+楼\d+)/, // 3楼201
        /(教\d+)/, // 教101
        /(实验室\d*)/, // 实验室1
        /([A-Z]{2,}\d+)/, // LAB101, ROOM205
        /(\d{3,4})/ // 简单的3-4位数字
      ]

      for (const pattern of patterns) {
        const match = trimmedLine.match(pattern)
        if (match) {
          return match[1]
        }
      }
    }

    // 检查其他单元格
    for (const cell of otherCells) {
      if (cell) {
        const cellStr = cell.toString().trim()
        for (const keyword of locationKeywords) {
          if (cellStr.includes(keyword)) {
            return cellStr
          }
        }
      }
    }

    return ''
  }

  /**
   * 生成示例Excel文件并下载
   */
  static async generateAndDownloadExcel() {
    try {
      // 导入assets目录中的example.xlsx文件
      const exampleFileUrl = new URL('../assets/example.xlsx', import.meta.url)
      const response = await fetch(exampleFileUrl)

      if (!response.ok) {
        throw new Error('无法获取示例文件')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = '课程表示例.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

      console.log('示例Excel文件下载成功')
    } catch (error) {
      console.error('下载示例Excel文件失败:', error)
      throw new Error(`下载示例文件失败: ${error.message}`)
    }
  }
}

export default ExcelService
