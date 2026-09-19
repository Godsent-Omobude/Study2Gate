import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.study2gate.app',
  appName: 'Study2Gate',
  webDir: 'build',
  server: {
    url: 'https://studyshare-backend-1-vopy.onrender.com',
    cleartext: true
  }
};

export default config;
