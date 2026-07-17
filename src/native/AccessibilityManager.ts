import { NativeModules } from 'react-native';

const { AccessibilityManager } = NativeModules;

export interface SwipeStatistics {
  totalSwipes: number;
  todaySwipes: number;
  averageInterval: number;
  runningTime: number;
  isRunning: boolean;
  isAccessibilityConnected: boolean;
}

export interface InstalledApp {
  name: string;
  packageName: string;
  icon: string; // Base64 PNG string
}

export interface NativeSettings {
  darkMode: boolean;
  randomMode: boolean;
  vibration: boolean;
  keepAwake: boolean;
  startOnBoot: boolean;
  autoResume: boolean;
  swipeInterval: number;
  selectedPackage?: string;
}

interface AccessibilityManagerInterface {
  isAccessibilityEnabled(): Promise<boolean>;
  openAccessibilitySettings(): void;
  isOverlayPermissionGranted(): Promise<boolean>;
  openOverlaySettings(): void;
  startAutoScroll(
    packageName: string,
    intervalSeconds: number,
    randomMode: boolean
  ): Promise<boolean>;
  stopAutoScroll(): Promise<boolean>;
  performSwipe(): Promise<boolean>;
  getCurrentPackage(): Promise<string>;
  getStatistics(): Promise<SwipeStatistics>;
  getInstalledApps(): Promise<InstalledApp[]>;
  saveSettings(settings: NativeSettings): Promise<boolean>;
  getSettings(): Promise<NativeSettings>;
}

export default AccessibilityManager as AccessibilityManagerInterface;
