import type { CapacitorConfig } from '@capacitor/cli'
const config: CapacitorConfig = {
  appId: 'com.jarasporn.porkshop',
  appName: 'จรัสพรหมูสด',
  webDir: 'dist',
  plugins: { CapacitorSQLite: { iosIsEncryption: false, androidIsEncryption: false } },
}
export default config
