import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppUsage } from '@/types/screentime';
import ProgressBar from './ProgressBar';

interface ScreenTimeCardProps {
  app: AppUsage;
  maxMinutes: number;
}

export default function ScreenTimeCard({ app, maxMinutes }: ScreenTimeCardProps) {
  const percentage = maxMinutes > 0 ? (app.minutes / maxMinutes) * 100 : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.appIcon, { backgroundColor: app.color }]}>
          <Text style={styles.appInitial}>{app.app.charAt(0)}</Text>
        </View>
        <View style={styles.appInfo}>
          <Text style={styles.appName}>{app.app}</Text>
          <Text style={styles.appTime}>{app.time}</Text>
        </View>
      </View>
      <ProgressBar 
        progress={percentage} 
        color={app.color}
        height={6}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  appTime: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});