import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.courseschedule.app',
  appName: 'CourseSchedule',
  webDir: 'out/renderer',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    allowsLinkPreview: false,
    webContentsDebuggingEnabled: true
  }
};

export default config;
