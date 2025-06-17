import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export const useMobileData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);

  // Initial dummy data
  const initialData = [
    { 
      app: 'Instagram', 
      time: '1h 37m', 
      domain: 'instagram.com',
      category: 'Social Media'
    },
    { 
      app: 'YouTube', 
      time: '23m', 
      domain: 'youtube.com',
      category: 'Entertainment'
    },
    { 
      app: 'Clash of Clans', 
      time: '1h 08m', 
      domain: 'supercell.com',
      category: 'Games'
    },
    { 
      app: 'Clash Royale', 
      time: '44m', 
      domain: 'supercell.com',
      category: 'Games'
    },
    { 
      app: 'LinkedIn', 
      time: '7m', 
      domain: 'linkedin.com',
      category: 'Social Media'
    }
  ];

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      console.log('Loading data for date:', today);
      
      const { data: result, error: fetchError } = await supabase
        .from('device_usage')
        .select('*')
        .eq('device', 'mobile')
        .eq('date', today)
        .single();
      
      console.log('Fetch result:', result);
      
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('No data found, using initial data');
          setData(initialData);
        } else {
          throw fetchError;
        }
      } else if (result?.data) {
        setData(result.data);
      } else {
        console.log('No data found, using initial data');
        setData(initialData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message);
      setData(initialData);
    } finally {
      setLoading(false);
    }
  };

  const updateAppTime = (appName, time) => {
    console.log('Updating app time:', { appName, time });
    setData(prevData => {
      const newData = prevData.map(app => 
        app.app === appName ? { ...app, time } : app
      );
      return newData;
    });
  };

  const syncDataToServer = async () => {
    try {
      console.log('Starting data sync...');
      const today = new Date().toISOString().split('T')[0];
      
      // First try to get existing data
      const { data: existingData, error: fetchError } = await supabase
        .from('device_usage')
        .select('*')
        .eq('device', 'mobile')
        .eq('date', today)
        .single();
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      // Prepare data for upsert
      const upsertData = {
        device: 'mobile',
        date: today,
        data: existingData ? [...existingData.data, ...data] : data
      };
      
      console.log('Upserting data:', upsertData);
      
      const { error: upsertError } = await supabase
        .from('device_usage')
        .upsert(upsertData, {
          onConflict: 'device,date'
        });
        
      if (upsertError) {
        throw upsertError;
      }
      
      console.log('Sync successful');
      setLastSynced(new Date());
      return { success: true };
    } catch (error) {
      console.error('Sync error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  return {
    data,
    loading,
    error,
    lastSynced,
    updateAppTime,
    syncDataToServer,
    refreshData: loadData
  };
}; 