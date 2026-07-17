import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../theme/theme';

interface StatsGridProps {
  todaySwipes: number;
  totalSwipes: number;
  runningTime: number;
  averageInterval: number;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export function StatsGrid({
  todaySwipes,
  totalSwipes,
  runningTime,
  averageInterval,
}: StatsGridProps) {
  const theme = useAppTheme();

  const formatTime = (ms: number): string => {
    if (ms <= 0) {
      return '00:00:00';
    }
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':');
  };

  const renderStatCard = (
    title: string,
    value: string | number,
    icon: string,
    color: string
  ) => (
    <Card style={[styles.card, { width: CARD_WIDTH, backgroundColor: theme.colors.card }]}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.header}>
          <Text variant="labelMedium" style={{ color: theme.colors.outline }}>
            {title}
          </Text>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
        </View>
        <Text variant="headlineMedium" style={[styles.value, { color: theme.colors.text }]}>
          {value}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {renderStatCard("Today's Swipes", todaySwipes, 'calendar-check', '#4CAF50')}
        {renderStatCard('Total Swipes', totalSwipes, 'history', '#2196F3')}
      </View>
      <View style={styles.row}>
        {renderStatCard('Running Time', formatTime(runningTime), 'clock-outline', '#9C27B0')}
        {renderStatCard(
          'Avg Interval',
          averageInterval > 0 ? `${averageInterval.toFixed(1)}s` : '--',
          'speedometer',
          '#FF9800'
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    elevation: 1,
  },
  cardContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  value: {
    fontWeight: 'bold',
    fontSize: 22,
    marginTop: 4,
  },
});
