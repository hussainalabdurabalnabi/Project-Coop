import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hussain.excelgraphsite',
  appName: 'Excel Graph Site',
  webDir: 'public',
  server: {
    url: 'https://project-coop-peach.vercel.app',
    cleartext: false,
  },
};

export default config;