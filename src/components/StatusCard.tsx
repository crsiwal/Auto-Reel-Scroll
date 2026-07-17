import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Chip, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface StatusCardProps {
  isAccessibilityEnabled: boolean;
  isServiceRunning: boolean;
  selectedAppName: string;
  selectedPackage: string;
  activePackage: string;
}

export function StatusCard({
  isAccessibilityEnabled,
  isServiceRunning,
  selectedAppName,
  selectedPackage,
  activePackage,
}: StatusCardProps) {
  const theme = useTheme();

  const isCurrentTargetActive = activePackage === selectedPackage && selectedPackage !== '';

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <Card.Content>
        <Text variant="titleMedium" style={[styles.title, { color: theme.colors.text }]}>
          System Status
        </Text>

        <View style={styles.row}>
          <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
            Accessibility Permission
          </Text>
          <Chip
            icon={() => (
              <MaterialCommunityIcons
                name={isAccessibilityEnabled ? 'check-circle' : 'alert-circle'}
                color={isAccessibilityEnabled ? '#4CAF50' : '#F44336'}
                size={16}
              />
            )}
            selectedColor={isAccessibilityEnabled ? '#4CAF50' : '#F44336'}
            style={isAccessibilityEnabled ? styles.chipEnabled : styles.chipDisabled}
          >
            {isAccessibilityEnabled ? 'Connected' : 'Disconnected'}
          </Chip>
        </View>

        <View style={styles.row}>
          <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
            Scroll Engine
          </Text>
          <Chip
            icon={() => (
              <MaterialCommunityIcons
                name={isServiceRunning ? 'play-circle' : 'stop-circle'}
                color={isServiceRunning ? theme.colors.primary : '#757575'}
                size={16}
              />
            )}
            selectedColor={isServiceRunning ? theme.colors.primary : '#757575'}
            style={isServiceRunning ? styles.chipActive : styles.chipInactive}
          >
            {isServiceRunning ? 'Running' : 'Stopped'}
          </Chip>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.targetRow}>
          <MaterialCommunityIcons
            name="application-cog"
            size={28}
            color={theme.colors.primary}
            style={styles.targetIcon}
          />
          <View style={styles.targetTexts}>
            <Text variant="labelMedium" style={{ color: theme.colors.outline }}>
              Target Application
            </Text>
            <Text variant="bodyLarge" style={[styles.boldText, { color: theme.colors.text }]}>
              {selectedAppName || 'No App Selected'}
            </Text>
            {selectedPackage ? (
              <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.outline }}>
                {selectedPackage}
              </Text>
            ) : null}
          </View>
          {selectedPackage ? (
            <Chip
              compact
              style={isCurrentTargetActive ? styles.chipTargetActive : styles.chipTargetInactive}
              textStyle={{ fontSize: 10 }}
            >
              {isCurrentTargetActive ? 'Active Foreground' : 'Backgrounded'}
            </Chip>
          ) : null}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 16,
    elevation: 2,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetIcon: {
    marginRight: 12,
  },
  targetTexts: {
    flex: 1,
  },
  boldText: {
    fontWeight: 'bold',
  },
  chipEnabled: {
    backgroundColor: '#E8F5E9',
  },
  chipDisabled: {
    backgroundColor: '#FFEBEE',
  },
  chipActive: {
    backgroundColor: '#E8EAF6',
  },
  chipInactive: {
    backgroundColor: '#F5F5F5',
  },
  chipTargetActive: {
    backgroundColor: '#E8F5E9',
  },
  chipTargetInactive: {
    backgroundColor: '#FFF8E1',
  },
});
