import { useState, useEffect, useCallback } from 'react';
import { useIsFocused } from '@react-navigation/native';
import AccessibilityManager, { SwipeStatistics } from '../native/AccessibilityManager';

export function useAccessibility() {
  const isFocused = useIsFocused();
  const [isAccessibilityEnabled, setIsAccessibilityEnabled] = useState(false);
  const [currentPackage, setCurrentPackage] = useState('');
  const [stats, setStats] = useState<SwipeStatistics>({
    totalSwipes: 0,
    todaySwipes: 0,
    averageInterval: 0,
    runningTime: 0,
    isRunning: false,
    isAccessibilityConnected: false,
  });

  const checkState = useCallback(async () => {
    try {
      const enabled = await AccessibilityManager.isAccessibilityEnabled();
      setIsAccessibilityEnabled(enabled);

      const activePkg = await AccessibilityManager.getCurrentPackage();
      setCurrentPackage(activePkg);

      const currentStats = await AccessibilityManager.getStatistics();
      setStats(currentStats);
    } catch (e) {
      console.warn('Error fetching accessibility state:', e);
    }
  }, []);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    checkState();
    // Poll the native stats every 1.5 seconds for live dashboard updates
    const interval = setInterval(checkState, 1500);

    return () => {
      clearInterval(interval);
    };
  }, [isFocused, checkState]);

  return {
    isAccessibilityEnabled,
    currentPackage,
    stats,
    refreshState: checkState,
  };
}
