import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.scale.app',
  appName: 'ScaleAPITest',
  webDir: 'www',
  bundledWebRuntime: false,
  "plugins": {
    "BluetoothLe": {
      "displayStrings": {
        "scanning": "Scanning",
        "cancel": "Cancel",
        "availableDevices": "Available ble devices",
        "noDeviceFound": "No ble device found"
      }
    }
  }
}

export default config;
