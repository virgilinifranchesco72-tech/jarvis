import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vantasystem.ai',
  appName: 'VANTA SYSTEM',
  webDir: 'www',
  bundledWebRuntime: false,
  android: { allowMixedContent: false }
};

export default config;
