import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useScreenTimeData } from '@/hooks/useScreenTimeData';
import { CreditCard as Edit3, Save, X, RotateCcw } from 'lucide-react-native';

export default function SettingsScreen() {
  const { data, updateAppTime, resetToDefault } = useScreenTimeData();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEditing = (index: number, currentTime: string) => {
    setEditingIndex(index);
    setEditValue(currentTime);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const saveEdit = (app: string) => {
    if (!editValue.trim()) {
      Alert.alert('Error', 'Please enter a valid time value');
      return;
    }

    // Parse time format (e.g., "1h 37m" or "23m")
    const timeMatch = editValue.match(/(?:(\d+)h\s*)?(\d+)m/);
    if (!timeMatch) {
      Alert.alert('Error', 'Please use format like "1h 30m" or "45m"');
      return;
    }

    const hours = parseInt(timeMatch[1] || '0');
    const minutes = parseInt(timeMatch[2] || '0');
    const totalMinutes = hours * 60 + minutes;

    updateAppTime(app, editValue.trim(), totalMinutes);
    setEditingIndex(null);
    setEditValue('');
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Data',
      'Are you sure you want to reset all screen time data to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: resetToDefault
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Edit your screen time data</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How to Edit</Text>
          <Text style={styles.infoText}>
            Tap the edit button next to any app to modify its screen time. 
            Use formats like "1h 30m" for 1 hour 30 minutes or "45m" for 45 minutes.
          </Text>
        </View>

        <View style={styles.appsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>App Screen Time</Text>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={handleReset}
            >
              <RotateCcw size={16} color="#6B7280" />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {data.map((app, index) => (
            <View key={index} style={styles.appCard}>
              <View style={styles.appHeader}>
                <View style={[styles.appIcon, { backgroundColor: app.color }]}>
                  <Text style={styles.appInitial}>{app.app.charAt(0)}</Text>
                </View>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>{app.app}</Text>
                  {editingIndex === index ? (
                    <View style={styles.editContainer}>
                      <TextInput
                        style={styles.editInput}
                        value={editValue}
                        onChangeText={setEditValue}
                        placeholder="e.g., 1h 30m"
                        autoFocus
                      />
                      <View style={styles.editActions}>
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.saveButton]}
                          onPress={() => saveEdit(app.app)}
                        >
                          <Save size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.cancelButton]}
                          onPress={cancelEditing}
                        >
                          <X size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.timeContainer}>
                      <Text style={styles.appTime}>{app.time}</Text>
                      <TouchableOpacity 
                        style={styles.editButton}
                        onPress={() => startEditing(index, app.time)}
                      >
                        <Edit3 size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Changes are automatically saved and will be reflected in the Daily and Weekly tabs.
          </Text>
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
  infoCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  appsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
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
    alignItems: 'center',
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
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appTime: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  editActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});