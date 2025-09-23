// 简单的测试函数，用于验证我们的工具函数
import {
  validateCourse,
  validateWeeksFormat,
  validateTimeConflict,
  hasWeekOverlap,
  parseWeeksRange
} from '../validation.js'

// 测试数据
const validCourse = {
  id: 'test-1',
  day: '星期一',
  period: '第1节',
  course: '数据结构',
  teacher: '张三',
  location: 'A301',
  weeks: '1-16'
}

const invalidCourse = {
  id: 'test-2',
  day: '',
  period: '',
  course: '',
  teacher: '',
  location: '',
  weeks: 'invalid'
}

// 运行测试的函数
export function runValidationTests() {
  console.log('开始运行验证测试...')

  // 测试课程验证
  const validResult = validateCourse(validCourse)
  console.log('有效课程验证:', validResult.isValid ? '✓ 通过' : '✗ 失败', validResult.errors)

  const invalidResult = validateCourse(invalidCourse)
  console.log('无效课程验证:', !invalidResult.isValid ? '✓ 通过' : '✗ 失败', invalidResult.errors)

  // 测试周次格式验证
  console.log('周次格式验证:')
  console.log('  "1-16":', validateWeeksFormat('1-16') ? '✓' : '✗')
  console.log('  "1,3,5":', validateWeeksFormat('1,3,5') ? '✓' : '✗')
  console.log('  "1-8,10-16":', validateWeeksFormat('1-8,10-16') ? '✓' : '✗')
  console.log('  "invalid":', !validateWeeksFormat('invalid') ? '✓' : '✗')

  // 测试周次重叠
  console.log('周次重叠测试:')
  console.log('  "1-8" vs "5-12":', hasWeekOverlap('1-8', '5-12') ? '✓ 重叠' : '✗ 不重叠')
  console.log('  "1-8" vs "10-16":', !hasWeekOverlap('1-8', '10-16') ? '✓ 不重叠' : '✗ 重叠')

  // 测试周次解析
  console.log('周次解析测试:')
  console.log('  "1-5":', JSON.stringify(parseWeeksRange('1-5')))
  console.log('  "1,3,5":', JSON.stringify(parseWeeksRange('1,3,5')))
  console.log('  "1-3,5-7":', JSON.stringify(parseWeeksRange('1-3,5-7')))

  console.log('验证测试完成!')
}
