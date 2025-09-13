import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.courseschedule.app',
  appName: 'CourseSchedule',
  webDir: 'out/renderer',
  server: {
    androidScheme: 'https'
  }
};

export default config;
