import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Searchbar, Text } from 'react-native-paper';
import AccessibilityManager, { InstalledApp } from '../native/AccessibilityManager';
import { AppListItem } from '../components/AppListItem';
import { storage } from '../storage/storage';
import { useAppTheme } from '../theme/theme';

export function AppSelectionScreen() {
  const navigation = useNavigation();
  const theme = useAppTheme();

  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');

  useEffect(() => {
    const loadApps = async () => {
      try {
        const selected = storage.getString('selectedPackage') || '';
        setSelectedPackage(selected);

        const list = await AccessibilityManager.getInstalledApps();
        // Sort alphabetically
        const sortedList = list.sort((a, b) => a.name.localeCompare(b.name));
        setApps(sortedList);
      } catch (e) {
        console.warn('Failed to load apps:', e);
      } finally {
        setLoading(false);
      }
    };

    loadApps();
  }, []);

  const filteredApps = useMemo(() => {
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.packageName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [apps, searchQuery]);

  const handleSelectApp = async (app: InstalledApp) => {
    try {
      storage.set('selectedPackage', app.packageName);
      storage.set('selectedAppName', app.name);
      setSelectedPackage(app.packageName);

      const currentSettings = await AccessibilityManager.getSettings();
      await AccessibilityManager.saveSettings({
        ...currentSettings,
        selectedPackage: app.packageName,
      });

      navigation.goBack();
    } catch (e) {
      console.warn('Failed to save selected app package:', e);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search applications..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Reading installed apps...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredApps}
          keyExtractor={(item) => item.packageName}
          renderItem={({ item }) => (
            <AppListItem
              app={item}
              isSelected={selectedPackage === item.packageName}
              onSelect={() => handleSelectApp(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={{ color: theme.colors.outline }}>
                No applications match your search.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchbar: {
    margin: 16,
    borderRadius: 28,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
});
