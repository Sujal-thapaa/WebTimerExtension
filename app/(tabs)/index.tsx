import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useScreenTimeData } from '@/hooks/useScreenTimeData';
import ScreenTimeCard from '@/components/ScreenTimeCard';
import CircularProgress from '@/components/CircularProgress';
import SyncButton from '@/components/SyncButton';

export default function DailyScreen() {
  const { data, loading, formatTotalTime, getTotalMinutes } = useScreenTimeData();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalMinutes = getTotalMinutes();
  const maxAppMinutes = Math.max(...data.map(app => app.minutes));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Daily Screen Time</Text>
          <Text style={styles.subtitle}>Today's usage overview</Text>
        </View>

        <View style={styles.summaryCard}>
          <CircularProgress
            size={120}
            strokeWidth={8}
            progress={Math.min((totalMinutes / 300) * 100, 100)}
            color="#3B82F6"
          >
            <View style={styles.summaryContent}>
              <Text style={styles.totalTime}>{formatTotalTime()}</Text>
              <Text style={styles.totalLabel}>Total</Text>
            </View>
          </CircularProgress>
        </View>

        <View style={styles.appsSection}>
          <Text style={styles.sectionTitle}>App Usage</Text>
          {data.map((app, index) => (
            <ScreenTimeCard 
              key={index} 
              app={app} 
              maxMinutes={maxAppMinutes}
            />
          ))}
        </View>

        <SyncButton data={data} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
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
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryContent: {
    alignItems: 'center',
  },
  totalTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
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
});