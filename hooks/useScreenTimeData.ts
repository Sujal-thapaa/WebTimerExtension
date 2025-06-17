import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppUsage } from '@/types/screentime';

const STORAGE_KEY = 'screentime_data';

const DEFAULT_DATA: AppUsage[] = [
  { app: 'Instagram', time: '1h 37m', minutes: 97, color: '#E91E63' },
  { app: 'YouTube', time: '23m', minutes: 23, color: '#FF5722' },
  { app: 'Clash of Clans', time: '1h 08m', minutes: 68, color: '#4CAF50' },
  { app: 'Clash Royale', time: '44m', minutes: 44, color: '#2196F3' },
  { app: 'LinkedIn', time: '7m', minutes: 7, color: '#0077B5' },
];

export function useScreenTimeData() {
  const [data, setData] = useState<AppUsage[]>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newData: AppUsage[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setData(newData);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const updateAppTime = (app: string, newTime: string, newMinutes: number) => {
    const updatedData = data.map(item =>
      item.app === app 
        ? { ...item, time: newTime, minutes: newMinutes }
        : item
    );
    saveData(updatedData);
  };

  const getTotalMinutes = () => {
    return data.reduce((total, app) => total + app.minutes, 0);
  };

  const formatTotalTime = () => {
    const total = getTotalMinutes();
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return {
    data,
    loading,
    updateAppTime,
    getTotalMinutes,
    formatTotalTime,
    resetToDefault: () => saveData(DEFAULT_DATA),
  };
}