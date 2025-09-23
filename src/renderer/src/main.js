import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import './assets/main.css'

try {
  // 创建Vue应用实例
  const app = createApp(App)

  // 创建Pinia状态管理
  const pinia = createPinia()

  // 使用插件
  app.use(pinia)
  app.use(ElementPlus)

  // 挂载应用
  app.mount('#app')
} catch (error) {
  console.error('Vue应用初始化失败:', error)
  console.error('错误堆栈:', error.stack)

  // 在页面上显示错误信息
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: red;">应用初始化失败</h2>
      <p><strong>错误信息:</strong> ${error.message}</p>
      <p><strong>错误堆栈:</strong></p>
      <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error.stack}</pre>
    </div>
  `
}
