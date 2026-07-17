import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { InstalledApp } from '../native/AccessibilityManager';
import { useAppTheme } from '../theme/theme';

interface AppListItemProps {
  app: InstalledApp;
  isSelected: boolean;
  onSelect: () => void;
}

export function AppListItem({ app, isSelected, onSelect }: AppListItemProps) {
  const theme = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onSelect}
      style={[
        styles.container,
        {
          backgroundColor: isSelected ? theme.colors.secondaryContainer : theme.colors.surface,
          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
        },
      ]}
    >
      <View style={styles.imageContainer}>
        {app.icon ? (
          <Image
            source={{ uri: `data:image/png;base64,${app.icon}` }}
            style={styles.iconImage}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.iconPlaceholder, { backgroundColor: theme.colors.border }]}>
            <MaterialCommunityIcons name="android" size={24} color={theme.colors.outline} />
          </View>
        )}
      </View>

      <View style={styles.textContainer}>
        <Text variant="titleMedium" numberOfLines={1} style={[styles.name, { color: theme.colors.text }]}>
          {app.name}
        </Text>
        <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.outline }}>
          {app.packageName}
        </Text>
      </View>

      {isSelected && (
        <View style={styles.checkedIcon}>
          <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
  },
  imageContainer: {
    marginRight: 16,
  },
  iconImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
  },
  checkedIcon: {
    marginLeft: 8,
  },
});
