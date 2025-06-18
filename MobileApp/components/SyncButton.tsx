import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, View } from 'react-native';
import { Upload, Check, CircleAlert as AlertCircle } from 'lucide-react-native';
import { AppUsage, ScreenTimeData } from '@/types/screentime';

interface SyncButtonProps {
  data: AppUsage[];
  apiUrl?: string;
}

export default function SyncButton({ data, apiUrl = 'https://your-api-url.com/api/mobiledata' }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const syncData = async () => {
    setSyncing(true);
    setLastSyncStatus('idle');

    try {
      const payload: ScreenTimeData = {
        device: 'mobile',
        date: new Date().toISOString().split('T')[0],
        data: data.map(app => ({
          app: app.app,
          time: app.time,
        })),
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setLastSyncStatus('success');
        Alert.alert('Success', 'Screen time data synced successfully!');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      setLastSyncStatus('error');
      console.error('Sync error:', error);
      Alert.alert(
        'Sync Failed', 
        'Could not sync data to dashboard. Please check your connection and try again.'
      );
    } finally {
      setSyncing(false);
    }
  };

  const getButtonColor = () => {
    switch (lastSyncStatus) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      default: return '#3B82F6';
    }
  };

  const getIcon = () => {
    switch (lastSyncStatus) {
      case 'success': return <Check size={20} color="#FFFFFF" />;
      case 'error': return <AlertCircle size={20} color="#FFFFFF" />;
      default: return <Upload size={20} color="#FFFFFF" />;
    }
  };

  const getButtonText = () => {
    if (syncing) return 'Syncing...';
    switch (lastSyncStatus) {
      case 'success': return 'Synced Successfully';
      case 'error': return 'Sync Failed - Retry';
      default: return 'Sync to Dashboard';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: getButtonColor() }]}
      onPress={syncData}
      disabled={syncing}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {getIcon()}
        <Text style={styles.buttonText}>{getButtonText()}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});