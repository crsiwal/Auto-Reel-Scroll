import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Card, Text, Switch, List, useTheme, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AccessibilityManager, { NativeSettings } from '../native/AccessibilityManager';
import { storage } from '../storage/storage';

const INTERVAL_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120];

export function SettingsScreen() {
  const theme = useTheme();

  const [settings, setSettings] = useState<NativeSettings>({
    darkMode: false,
    randomMode: false,
    vibration: true,
    keepAwake: true,
    startOnBoot: false,
    autoResume: false,
    swipeInterval: 10,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const current = await AccessibilityManager.getSettings();
        setSettings(current);
      } catch (e) {
        console.warn('Failed to load settings:', e);
      }
    };
    loadSettings();
  }, []);

  const handleToggle = async (key: keyof NativeSettings) => {
    const updated = {
      ...settings,
      [key]: !settings[key],
    };
    setSettings(updated);

    try {
      await AccessibilityManager.saveSettings(updated);
      
      // If toggling dark mode, save to MMKV so React Native UI can toggle instantly if needed
      if (key === 'darkMode') {
        storage.set('darkMode', !settings.darkMode);
      }
    } catch (e) {
      console.warn(`Failed to save settings for key ${key}:`, e);
    }
  };

  const handleSelectInterval = async (interval: number) => {
    const updated = {
      ...settings,
      swipeInterval: interval,
    };
    setSettings(updated);

    try {
      await AccessibilityManager.saveSettings(updated);
    } catch (e) {
      console.warn('Failed to save swipe interval setting:', e);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
            General
          </Text>

          <List.Item
            title="Dark Theme"
            description="Toggle application dark mode"
            left={(props) => (
              <List.Icon {...props} icon={() => <MaterialCommunityIcons name="theme-light-dark" size={24} color={theme.colors.primary} />} />
            )}
            right={() => (
              <Switch
                value={settings.darkMode}
                onValueChange={() => handleToggle('darkMode')}
                color={theme.colors.primary}
              />
            )}
          />

          <List.Item
            title="Vibrate on Scroll"
            description="Vibrate the phone briefly when a swipe occurs"
            left={(props) => (
              <List.Icon {...props} icon={() => <MaterialCommunityIcons name="vibrate" size={24} color={theme.colors.primary} />} />
            )}
            right={() => (
              <Switch
                value={settings.vibration}
                onValueChange={() => handleToggle('vibration')}
                color={theme.colors.primary}
              />
            )}
          />

          <List.Item
            title="Keep Screen Awake"
            description="Prevent the screen from turning off while service is active"
            left={(props) => (
              <List.Icon {...props} icon={() => <MaterialCommunityIcons name="brightness-7" size={24} color={theme.colors.primary} />} />
            )}
            right={() => (
              <Switch
                value={settings.keepAwake}
                onValueChange={() => handleToggle('keepAwake')}
                color={theme.colors.primary}
              />
            )}
          />
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Scroll Setup
          </Text>

          <List.Item
            title="Randomize Delay"
            description="Introduce a ±2s random variance on intervals"
            left={(props) => (
              <List.Icon {...props} icon={() => <MaterialCommunityIcons name="shuffle-variant" size={24} color={theme.colors.primary} />} />
            )}
            right={() => (
              <Switch
                value={settings.randomMode}
                onValueChange={() => handleToggle('randomMode')}
                color={theme.colors.primary}
              />
            )}
          />

          <Text variant="bodyMedium" style={[styles.intervalTitle, { color: theme.colors.text }]}>
            Swipe Interval (Seconds)
          </Text>
          <View style={styles.chipsContainer}>
            {INTERVAL_OPTIONS.map((option) => {
              const isSelected = settings.swipeInterval === option;
              return (
                <Button
                  key={option}
                  mode={isSelected ? 'contained' : 'outlined'}
                  compact
                  onPress={() => handleSelectInterval(option)}
                  style={styles.chipButton}
                  labelStyle={styles.chipLabel}
                >
                  {option}s
                </Button>
              );
            })}
          </View>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.text }]}>
            System Persistence
          </Text>

          <List.Item
            title="Start on Boot"
            description="Launch services automatically after device restarts"
            left={(props) => (
              <List.Icon {...props} icon={() => <MaterialCommunityIcons name="power" size={24} color={theme.colors.primary} />} />
            )}
            right={() => (
              <Switch
                value={settings.startOnBoot}
                onValueChange={() => handleToggle('startOnBoot')}
                color={theme.colors.primary}
              />
            )}
          />

          <List.Item
            title="Auto Resume"
            description="Resume the service automatically if it was previously active"
            left={(props) => (
              <List.Icon {...props} icon={() => <MaterialCommunityIcons name="play-pause" size={24} color={theme.colors.primary} />} />
            )}
            right={() => (
              <Switch
                value={settings.autoResume}
                onValueChange={() => handleToggle('autoResume')}
                color={theme.colors.primary}
              />
            )}
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
  },
  cardContent: {
    paddingBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  intervalTitle: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    fontWeight: '600',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  chipButton: {
    margin: 4,
    borderRadius: 8,
  },
  chipLabel: {
    fontSize: 12,
  },
});
