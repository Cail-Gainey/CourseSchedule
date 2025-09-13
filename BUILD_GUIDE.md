# 多平台构建指南

本项目支持构建为 Windows、macOS、iOS 和 Android 平台的应用程序。

## 前置要求

### Windows 构建
- Node.js 16+
- npm 或 pnpm

### macOS 构建
- macOS 系统
- Xcode Command Line Tools
- Node.js 16+

### Android 构建
- Android Studio
- Android SDK
- Java 11+

### iOS 构建
- macOS 系统
- Xcode 12+
- iOS Developer Account（用于发布）

## 构建命令

### 单平台构建

```bash
# Windows 安装包
npm run build:win

# macOS 安装包
npm run build:mac

# Linux 安装包
npm run build:linux

# 移动端项目同步
npm run build:mobile

# Android APK（需要 Android Studio）
npm run build:android

# iOS IPA（需要 Xcode）
npm run build:ios
```

### 一键构建（Windows）

运行 `build-all.bat` 脚本：

```cmd
build-all.bat
```

## 构建输出

### 桌面平台
- **Windows**: `dist/courseschedule-1.0.0-setup.exe`
- **macOS**: `dist/courseschedule-1.0.0.dmg`
- **Linux**: `dist/courseschedule-1.0.0.AppImage`

### 移动平台

#### Android
1. 运行 `npm run build:mobile` 同步项目
2. 使用 Android Studio 打开 `android` 文件夹
3. 在 Android Studio 中构建 APK：
   - Build → Generate Signed Bundle / APK
   - 选择 APK
   - 配置签名信息
   - 构建完成后 APK 位于 `android/app/build/outputs/apk/`

#### iOS
1. 运行 `npm run build:mobile` 同步项目
2. 在 macOS 上使用 Xcode 打开 `ios/App/App.xcworkspace`
3. 在 Xcode 中构建 IPA：
   - Product → Archive
   - 配置开发者账户和证书
   - 导出 IPA 文件

## 注意事项

1. **跨平台构建限制**：
   - Windows 和 Linux 可以在任何平台构建
   - macOS 和 iOS 只能在 macOS 系统上构建
   - Android 可以在任何平台构建，但需要 Android Studio

2. **代码签名**：
   - Windows: 需要代码签名证书（可选）
   - macOS: 需要 Apple Developer 证书
   - iOS: 需要 iOS Developer 证书
   - Android: 需要生成签名密钥

3. **应用商店发布**：
   - iOS: 需要通过 App Store Connect
   - Android: 可以通过 Google Play Store 或其他应用商店
   - macOS: 可以通过 Mac App Store 或直接分发
   - Windows: 可以通过 Microsoft Store 或直接分发

## 故障排除

### 常见问题

1. **构建失败**：检查 Node.js 版本和依赖安装
2. **Android 构建问题**：确保 Android SDK 和 Java 版本正确
3. **iOS 构建问题**：确保 Xcode 和证书配置正确
4. **权限问题**：确保有足够的文件系统权限

### 清理构建缓存

```bash
# 清理 npm 缓存
npm run clean

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 清理 Capacitor 缓存
npx cap clean
```

## 技术栈

- **桌面应用**: Electron + Vue 3 + Element Plus
- **移动应用**: Capacitor + Vue 3 + Element Plus
- **构建工具**: electron-builder + Capacitor CLI