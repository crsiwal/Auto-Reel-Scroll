import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { IconButton, useTheme, Card, Text } from 'react-native-paper';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAccessibility } from '../hooks/useAccessibility';
import { StatusCard } from '../components/StatusCard';
import { StatsGrid } from '../components/StatsGrid';
import { ActionButtons } from '../components/ActionButtons';
import AccessibilityManager from '../native/AccessibilityManager';
import { storage } from '../storage/storage';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

export function DashboardScreen() {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const isFocused = useIsFocused();
  const theme = useTheme();

  const { isAccessibilityEnabled, currentPackage, stats, refreshState } = useAccessibility();

  const [selectedPackage, setSelectedPackage] = useState('');
  const [selectedAppName, setSelectedAppName] = useState('');
  const [swipeInterval, setSwipeInterval] = useState(10);
  const [randomMode, setRandomMode] = useState(false);

  // Configure settings gear icon on header right
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          icon="cog"
          size={24}
          iconColor={theme.colors.onSurface}
          onPress={() => navigation.navigate('Settings')}
        />
      ),
    });
  }, [navigation, theme]);

  const loadLocalSettings = useCallback(async () => {
    try {
      const config = await AccessibilityManager.getSettings();
      setSwipeInterval(config.swipeInterval);
      setRandomMode(config.randomMode);

      const pkg = config.selectedPackage || storage.getString('selectedPackage') || '';
      setSelectedPackage(pkg);

      const name = storage.getString('selectedAppName') || '';
      setSelectedAppName(name);
    } catch (e) {
      console.warn('Failed loading dashboard local settings:', e);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadLocalSettings();
      refreshState();
    }
  }, [isFocused, loadLocalSettings, refreshState]);

  const handleEnableAccessibility = () => {
    AccessibilityManager.openAccessibilitySettings();
  };

  const handleStartService = async () => {
    if (!selectedPackage) {
      return;
    }
    try {
      await AccessibilityManager.startAutoScroll(selectedPackage, swipeInterval, randomMode);
      refreshState();
    } catch (e) {
      console.warn('Failed to start scroll engine:', e);
    }
  };

  const handleStopService = async () => {
    try {
      await AccessibilityManager.stopAutoScroll();
      refreshState();
    } catch (e) {
      console.warn('Failed to stop scroll engine:', e);
    }
  };

  const handleChooseTargetApp = () => {
    navigation.navigate('AppSelection');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusCard
        isAccessibilityEnabled={isAccessibilityEnabled}
        isServiceRunning={stats.isRunning}
        selectedAppName={selectedAppName}
        selectedPackage={selectedPackage}
        activePackage={currentPackage}
      />

      <Card style={[styles.configCard, { backgroundColor: theme.colors.card }]}>
        <Card.Content style={styles.configContent}>
          <View style={styles.configItem}>
            <Text variant="labelMedium" style={{ color: theme.colors.outline }}>
              Swipe Delay
            </Text>
            <Text variant="bodyLarge" style={styles.bold}>
              {swipeInterval} seconds
            </Text>
          </View>
          <View style={[styles.verticalDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.configItem}>
            <Text variant="labelMedium" style={{ color: theme.colors.outline }}>
              Delay Mode
            </Text>
            <Text variant="bodyLarge" style={styles.bold}>
              {randomMode ? 'Random (±2s)' : 'Fixed'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <StatsGrid
        todaySwipes={stats.todaySwipes}
        totalSwipes={stats.totalSwipes}
        runningTime={stats.runningTime}
        averageInterval={stats.averageInterval}
      />

      <ActionButtons
        isAccessibilityEnabled={isAccessibilityEnabled}
        isServiceRunning={stats.isRunning}
        selectedPackage={selectedPackage}
        onEnableAccessibility={handleEnableAccessibility}
        onStartService={handleStartService}
        onStopService={handleStopService}
        onChooseTargetApp={handleChooseTargetApp}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
  },
  configCard: {
    marginVertical: 8,
    borderRadius: 16,
    elevation: 1,
  },
  configContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  configItem: {
    alignItems: 'center',
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: 32,
  },
  bold: {
    fontWeight: 'bold',
    marginTop: 4,
  },
});
