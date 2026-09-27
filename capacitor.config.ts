import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.study2gate.app',
  appName: 'Study2Gate',
  webDir: 'build',
  server: {
    url: 'https://study-2gate.vercel.app',
    cleartext: true
  },

  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#0d1f1c'
    }
  }
};

export default config;
