
# 课程表管理系统 (CourseSchedule)

一个基于 Vue 3 + Electron 的现代化课程表管理应用，支持桌面端和移动端多平台部署。

## ✨ 功能特性

- 📅 **直观的课程表界面** - 清晰的网格布局显示每周课程安排
- ➕ **课程管理** - 添加、编辑、删除课程信息
- 📊 **Excel 导入** - 支持从 Excel 文件导入课程数据
- 🌓 **主题切换** - 支持明暗主题模式
- 📱 **多平台支持** - Windows、macOS、Linux 桌面端 + Android、iOS 移动端
- ⚙️ **个性化设置** - 自定义课程时间、界面配置等
- 🔄 **数据持久化** - 本地数据存储，支持数据备份


## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 7.0.0

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd CourseSchedule

# 安装依赖
pnpm install
```

### 开发模式

```bash
# 启动开发服务器
pnpm dev
```

### 构建应用

#### 桌面端构建

```bash
# Windows
pnpm build:win

# macOS
pnpm build:mac

# Linux
pnpm build:linux
```

#### 移动端构建

```bash
# Android
pnpm build:android

# iOS
pnpm build:ios
```

## 📖 使用指南

### 基本操作

1. **添加课程**
   - 点击顶部「添加课程」按钮
   - 填写课程名称、教师、地点等信息
   - 选择上课时间和星期
   - 保存课程

2. **导入数据**
   - 点击「导入数据」下拉菜单
   - 选择「导入 Excel」上传课程表文件

3. **编辑课程**
   - 点击课程表中的任意课程卡片
   - 在弹出的对话框中修改课程信息
   - 保存更改

4. **主题切换**
   - 使用顶部右侧的主题切换开关
   - 在明暗主题间切换

5. **时间设置**
   - 点击顶部时钟图标
   - 自定义每节课的开始和结束时间

### Excel 导入格式

支持标准的课程表 Excel 格式，包含以下列：
- 课程名称
- 教师
- 地点
- 星期
- 节次
- 周次（可选）

## 🛠️ 技术栈

### 前端框架
- **Vue 3** - 渐进式 JavaScript 框架
- **Element Plus** - Vue 3 组件库
- **Pinia** - Vue 状态管理
- **VueUse** - Vue 组合式 API 工具集

### 桌面端
- **Electron** - 跨平台桌面应用框架
- **Electron Vite** - 基于 Vite 的 Electron 构建工具
- **Electron Builder** - Electron 应用打包工具

### 移动端
- **Capacitor** - 跨平台移动应用开发框架

### 工具库
- **XLSX** - Excel 文件处理
- **Electron Store** - 数据持久化存储

## 📁 项目结构

```
CourseSchedule/
├── src/
│   ├── main/           # Electron 主进程
│   ├── preload/        # Electron 预加载脚本
│   └── renderer/       # Vue 渲染进程
│       ├── src/
│       │   ├── components/  # Vue 组件
│       │   ├── stores/      # Pinia 状态管理
│       │   ├── services/    # 业务服务
│       │   └── utils/       # 工具函数
│       └── index.html
├── android/            # Android 项目文件
├── ios/               # iOS 项目文件
├── resources/         # 应用资源文件
└── build/            # 构建配置
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 开源协议

本项目基于 [MIT 协议](LICENSE) 开源。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Element Plus](https://element-plus.org/) - Vue 3 组件库
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Capacitor](https://capacitorjs.com/) - 跨平台移动应用框架

---

如果这个项目对你有帮助，请给个 ⭐️ 支持一下！