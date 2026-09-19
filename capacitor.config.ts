import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.study2gate.app',
  appName: 'Study2Gate',
  webDir: 'build',
  server: {
    url: 'https://study-2gate.vercel.app',
    cleartext: true
  }
};

export default config;
