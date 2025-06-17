import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useScreenTimeData } from '@/hooks/useScreenTimeData';
import ProgressBar from '@/components/ProgressBar';

export default function WeeklyScreen() {
  const { data, formatTotalTime } = useScreenTimeData();

  // Generate mock weekly data
  const weeklyData = data.map(app => ({
    ...app,
    weeklyMinutes: app.minutes * 7 + Math.floor(Math.random() * 100),
    weeklyTime: formatWeeklyTime(app.minutes * 7 + Math.floor(Math.random() * 100)),
    trend: Math.random() > 0.5 ? 'up' : 'down',
    trendPercentage: Math.floor(Math.random() * 30) + 5,
  }));

  const totalWeeklyMinutes = weeklyData.reduce((sum, app) => sum + app.weeklyMinutes, 0);
  const maxWeeklyMinutes = Math.max(...weeklyData.map(app => app.weeklyMinutes));

  function formatWeeklyTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  const weeklyTotalTime = formatWeeklyTime(totalWeeklyMinutes);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Overview</Text>
          <Text style={styles.subtitle}>Last 7 days summary</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{weeklyTotalTime}</Text>
              <Text style={styles.summaryLabel}>Total Time</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{Math.floor(totalWeeklyMinutes / 7 / 60)}h {Math.floor((totalWeeklyMinutes / 7) % 60)}m</Text>
              <Text style={styles.summaryLabel}>Daily Average</Text>
            </View>
          </View>
        </View>

        <View style={styles.appsSection}>
          <Text style={styles.sectionTitle}>Weekly App Usage</Text>
          {weeklyData.map((app, index) => (
            <View key={index} style={styles.appCard}>
              <View style={styles.appHeader}>
                <View style={styles.appIcon}>
                  <View style={[styles.iconBackground, { backgroundColor: app.color }]}>
                    <Text style={styles.appInitial}>{app.app.charAt(0)}</Text>
                  </View>
                  <View style={styles.appInfo}>
                    <Text style={styles.appName}>{app.app}</Text>
                    <Text style={styles.appTime}>{app.weeklyTime}</Text>
                  </View>
                </View>
                <View style={styles.trendContainer}>
                  <Text style={[styles.trend, { color: app.trend === 'up' ? '#EF4444' : '#10B981' }]}>
                    {app.trend === 'up' ? '↑' : '↓'} {app.trendPercentage}%
                  </Text>
                </View>
              </View>
              <ProgressBar 
                progress={(app.weeklyMinutes / maxWeeklyMinutes) * 100}
                color={app.color}
                height={8}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  appsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  appCard: {
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
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBackground: {
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
  trendContainer: {
    alignItems: 'flex-end',
  },
  trend: {
    fontSize: 14,
    fontWeight: '600',
  },
});