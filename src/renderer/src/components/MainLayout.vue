<template>
  <el-config-provider :locale="zhCn">
    <el-container class="main-layout">
      <el-header class="header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="title">课程表</h1>
          </div>

          <div class="header-actions">
            <div class="action-group">
              <el-button @click="handleAddCourse" :icon="Plus" type="primary">添加课程</el-button>
              <el-dropdown @command="handleImportCommand" trigger="click">
                <el-button :icon="Upload">
                  导入数据 <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="import-excel" :icon="Upload">导入 Excel</el-dropdown-item>
                    <el-dropdown-item command="generate-sample" :icon="DocumentAdd">生成示例数据</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            
            <el-divider direction="vertical" />
            
            <div class="action-group">
              <WeekSelector />
            </div>
            
            <el-divider direction="vertical" />
            
            <div class="action-group">
              <el-button @click="handleRefresh" :icon="Refresh" circle title="刷新" />
              <el-button @click="handleTimeSettings" :icon="Clock" circle title="课程时间设置" />
              <el-button @click="handleSettings" :icon="Setting" circle title="设置" />
              <div class="theme-toggle">
                <el-switch
                  v-model="isDark"
                  inline-prompt
                  :active-icon="MoonIcon"
                  :inactive-icon="SunIcon"
                  @change="handleThemeToggle"
                  size="large"
                />
              </div>
            </div>
          </div>
        </div>
      </el-header>

      <el-main class="content">
        <div class="content-wrapper">
          <ScheduleTable />
        </div>
      </el-main>
    </el-container>

    <!-- 全局对话框 -->
    <CourseEditDialog ref="courseEditDialogRef" />
    <SettingsDialog ref="settingsDialogRef" />
    <TimeSettingsDialog ref="timeSettingsDialogRef" />
  </el-config-provider>
</template>

<script setup>
import { ref, provide, watch } from 'vue'
import { useScheduleStore } from '../stores/schedule'
import ScheduleTable from './ScheduleTable.vue'
import WeekSelector from './WeekSelector.vue'
import CourseEditDialog from './CourseEditDialog.vue'
import SettingsDialog from './SettingsDialog.vue'
import TimeSettingsDialog from './TimeSettingsDialog.vue'
import { ElConfigProvider, ElContainer, ElHeader, ElMain, ElButton, ElButtonGroup, ElIcon, ElSwitch, ElDropdown, ElDropdownMenu, ElDropdownItem, ElDivider, ElMessage, ElMessageBox } from 'element-plus'
import { Moon as MoonIcon, Sunny as SunIcon, Upload, Plus, Refresh, Setting, DocumentAdd, ArrowDown, Clock } from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { validateCourse } from '../utils/index.js'
import ExcelService from '../services/excel.js'
import * as XLSX from 'xlsx'

const scheduleStore = useScheduleStore()

// 组件引用
const courseEditDialogRef = ref(null)
const settingsDialogRef = ref(null)
const timeSettingsDialogRef = ref(null)

// 提供对话框引用给子组件
provide('courseEditDialog', courseEditDialogRef)
provide('settingsDialog', settingsDialogRef)

// 暗黑模式
const isDark = ref(scheduleStore.currentTheme === 'dark')

const handleThemeToggle = (value) => {
  console.log('Theme toggle triggered:', value)
  const newTheme = value ? 'dark' : 'light'
  scheduleStore.currentTheme = newTheme
  
  // 直接操作DOM类名
  if (value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// 初始化主题
if (scheduleStore.currentTheme === 'dark') {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

// 同步 Pinia store 中的主题状态
watch(() => scheduleStore.currentTheme, (newTheme) => {
  const shouldBeDark = newTheme === 'dark'
  if (shouldBeDark !== isDark.value) {
    isDark.value = shouldBeDark
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
})


// 初始化加载数据和设置
scheduleStore.loadFromStorage()
scheduleStore.loadSettings()

// 从 Sidebar.vue 移动过来的逻辑
const handleImportCommand = async (command) => {
  if (command === 'import-excel') {
    await handleImportExcel()
  } else if (command === 'generate-sample') {
    handleGenerateSample()
  }
}



const handleImportExcel = async () => {
  try {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls'
    
    input.onchange = async (event) => {
      try {
        const file = event.target.files[0]
        if (!file) return
        
        console.log('=== Excel导入开始 ===')
        console.log('文件信息:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified)
        })
        
        // 显示加载提示
        const loadingMessage = ElMessage({
          message: '正在解析Excel文件，请稍候...',
          type: 'info',
          duration: 0
        })
        
        try {
          const courses = await ExcelService.importExcel(file)
          loadingMessage.close()
          
          console.log('Excel解析完成，课程数量:', courses ? courses.length : 0)
          console.log('解析结果预览:', courses ? courses.slice(0, 3) : [])
          
          if (courses && courses.length > 0) {
            console.log('=== 开始导入课程到存储 ===')
            
            await ElMessageBox.confirm(
              `即将导入 ${courses.length} 门课程，这将覆盖现有数据。是否继续？`,
              '确认导入',
              {
                confirmButtonText: '继续',
                cancelButtonText: '取消',
                type: 'warning',
              }
            )

            // 直接批量导入课程，跳过时间冲突检测
            scheduleStore.courses.length = 0
            let successCount = 0
            let failedCount = 0
            const failedCourses = []
            
            courses.forEach((course, index) => {
              try {
                console.log(`添加第${index + 1}门课程:`, course)
                // 直接验证课程数据，不检查时间冲突
                const validation = validateCourse(course, false)
                if (validation.isValid) {
                  scheduleStore.courses.push(course)
                  successCount++
                  console.log(`✓ 第${index + 1}门课程添加成功`)
                } else {
                  throw new Error(`课程数据无效: ${validation.errors.join(', ')}`)
                }
              } catch (error) {
                console.warn(`✗ 第${index + 1}门课程添加失败:`, error.message, course)
                failedCourses.push({ course, error: error.message })
                failedCount++
              }
            })
            
            // 更新元数据
            scheduleStore.metadata.lastModified = new Date()
            
            console.log('=== 导入完成 ===')
            console.log(`成功: ${successCount}, 失败: ${failedCount}`)
            if (failedCourses.length > 0) {
              console.log('失败的课程详情:', failedCourses)
            }
            
            if (successCount > 0) {
              const statusMsg = failedCount > 0 
                ? `成功导入 ${successCount} 门课程，跳过 ${failedCount} 门无效课程`
                : `成功导入 ${successCount} 门课程`
              ElMessage.success(statusMsg)
              
              if (failedCount > 0) {
                console.warn('部分课程导入失败，详细信息请查看控制台')
              }
            } else {
              ElMessage.warning('所有课程数据都无效，请检查Excel格式')
              console.error('所有课程验证失败，失败详情:', failedCourses)
            }
          } else {
            console.warn('未解析到任何课程数据')
            ElMessage.warning(`成功解析但未找到有效课程信息。\n\n请检查：\n1. Excel文件包含正确的表头（星期一、周一等）\n2. 课程单元格包含课程名称\n3. 文件不为空白或纯数字内容\n\n详细解析过程请查看浏览器控制台（F12）`)
          }
        } catch (parseError) {
          loadingMessage.close()
          throw parseError
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('=== Excel导入失败 ===')
          console.error('错误详情:', error)
          console.error('错误堆栈:', error.stack)
          
          ElMessage.error(`解析失败: ${error.message}\n\n详细错误信息请查看浏览器控制台（F12）`)
        }
      }
    }
    
    input.click()
  } catch (error) {
    ElMessage.error(`导入失败: ${error.message}`)
    console.error('Excel 导入错误:', error)
  }
}





const handleAddCourse = () => {
  if (courseEditDialogRef.value) {
    courseEditDialogRef.value.openAddDialog()
  }
}

const handleRefresh = async () => {
  try {
    await scheduleStore.loadFromStorage()
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error(`刷新失败: ${error.message}`)
  }
}

const handleSettings = () => {
  if (settingsDialogRef.value) {
    settingsDialogRef.value.openDialog()
  }
}

const handleTimeSettings = () => {
  if (timeSettingsDialogRef.value) {
    timeSettingsDialogRef.value.openDialog()
  }
}
 
const handleGenerateSample = async () => {
  try {
    const sampleCourses = [
      {
        id: '1',
        day: '星期一',
        period: '第1节',
        course: '数据结构',
        teacher: '张三',
        location: 'A301',
        weeks: '1-16'
      },
      {
        id: '2',
        day: '星期一',
        period: '第2节',
        course: '数据结构',
        teacher: '张三',
        location: 'A301',
        weeks: '1-16'
      },
      {
        id: '3',
        day: '星期二',
        period: '第2节',
        course: '操作系统',
        teacher: '王五',
        location: 'C103',
        weeks: '1-16'
      },
      {
        id: '4',
        day: '星期三',
        period: '第1节',
        course: '计算机网络',
        teacher: '李四',
        location: 'B202',
        weeks: '1-16'
      },
      {
        id: '5',
        day: '星期四',
        period: '第3节',
        course: '软件工程',
        teacher: '赵六',
        location: 'D404',
        weeks: '1-16'
      },
      {
        id: '6',
        day: '星期五',
        period: '第1节',
        course: '数据库原理',
        teacher: '陈七',
        location: 'E505',
        weeks: '1-16'
      },
      {
        id: '7',
        day: '星期五',
        period: '第2节',
        course: '数据库原理',
        teacher: '陈七',
        location: 'E505',
        weeks: '1-16'
      },
      {
        id: '8',
        day: '星期二',
        period: '第3节',
        course: '算法设计',
        teacher: '刘八',
        location: 'F606',
        weeks: '1-16'
      }
    ]

    // 生成Excel文件并下载
    await generateAndDownloadExcel(sampleCourses)
    
    ElMessage.success('示例Excel文件已生成并下载到您的系统')
  } catch (error) {
    ElMessage.error(`生成示例数据失败: ${error.message}`)
    console.error('生成示例数据错误:', error)
  }
}

const generateAndDownloadExcel = async (courses) => {
  try {
    // 创建课程表数据结构
    const scheduleData = ExcelService.createScheduleData(courses)
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    
    // 将数据转换为工作表
    const worksheet = XLSX.utils.json_to_sheet(scheduleData)
    
    // 设置列宽
    const colWidths = [
      { wch: 10 }, // 节次列
      { wch: 20 }, // 星期一
      { wch: 20 }, // 星期二
      { wch: 20 }, // 星期三
      { wch: 20 }, // 星期四
      { wch: 20 }, // 星期五
      { wch: 20 }, // 星期六
      { wch: 20 }  // 星期日
    ]
    worksheet['!cols'] = colWidths
    
    // 设置行高
    const rowHeights = []
    for (let i = 0; i <= 12; i++) {
      rowHeights.push({ hpt: i === 0 ? 25 : 60 }) // 表头行25，数据行60
    }
    worksheet['!rows'] = rowHeights
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '课程表')
    
    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    
    // 创建Blob对象
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'example.xlsx'
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    
    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    console.log('Excel文件已生成并下载')
  } catch (error) {
    console.error('生成Excel文件失败:', error)
    throw error
  }
}

</script>

<style scoped>
.main-layout {
  height: 100vh;
  background-color: var(--el-bg-color-page);
  font-family: var(--el-font-family);
}

.header {
  height: var(--el-header-height, 60px);
  display: flex;
  align-items: center;
  padding: 0 var(--el-main-padding, 20px);
  border-bottom: 1px solid var(--el-border-color);
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-lighter);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.title {
  margin: 0;
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-primary);
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--el-margin-medium, 16px);
}

.action-group {
  display: flex;
  align-items: center;
  gap: var(--el-margin-small, 8px);
}

.theme-toggle {
  margin-left: var(--el-margin-small, 8px);
}

.content {
  padding: var(--el-main-padding, 20px);
  overflow: auto;
  background-color: var(--el-bg-color-page);
}

.content-wrapper {
  max-width: 100%;
  margin: 0 auto;
}



.el-divider--vertical {
  height: 2em;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header {
    height: auto;
    min-height: var(--el-header-height, 60px);
    padding: var(--el-padding-small, 10px) var(--el-padding-medium, 15px);
  }

  .header-content {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .header-actions {
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--el-margin-small, 8px);
  }

  .action-group {
    flex-wrap: wrap;
    gap: var(--el-margin-extra-small, 4px);
  }

  .header-actions .el-button {
    font-size: var(--el-font-size-small);
    padding: var(--el-button-padding-vertical) var(--el-button-padding-horizontal);
  }

  .el-divider--vertical {
    display: none;
  }

  .title {
    font-size: var(--el-font-size-large);
  }

  .content {
    padding: var(--el-padding-small, 10px);
  }


}

@media (max-width: 480px) {
  .header {
    padding: var(--el-padding-extra-small, 8px) var(--el-padding-small, 10px);
  }

  .header-actions {
    gap: var(--el-margin-extra-small, 6px);
  }

  .action-group {
    gap: var(--el-margin-extra-small, 2px);
  }

  .header-actions .el-button {
    font-size: var(--el-font-size-extra-small);
    padding: var(--el-padding-extra-small, 6px) var(--el-padding-small, 10px);
    min-height: var(--el-component-size-small);
  }

  .header-actions .el-button span {
    display: none;
  }

  .title {
    font-size: var(--el-font-size-base);
  }

  .theme-toggle {
    margin-left: 0;
  }

  .content {
    padding: var(--el-padding-extra-small, 8px);
  }
}
</style>