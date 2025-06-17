import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Alert } from 'react-native';
import { supabase } from '../src/config/supabase';

interface SyncButtonProps {
  data: any[];
  onSyncComplete?: (success: boolean) => void;
}

export default function SyncButton({ data, onSyncComplete }: SyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const appDomainMap: Record<string, string> = {
    Instagram: 'instagram.com',
    YouTube: 'youtube.com',
    'Clash of Clans': 'supercell.com',
    'Clash Royale': 'supercell.com',
    LinkedIn: 'linkedin.com',
  };

  const appCategoryMap: Record<string, string> = {
    Instagram: 'Social Media',
    YouTube: 'Entertainment',
    'Clash of Clans': 'Games',
    'Clash Royale': 'Games',
    LinkedIn: 'Social Media',
  };

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Auth check error:', error);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(!!session);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSync = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if we have a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // Try to sign in anonymously
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: 'anonymous@example.com',
          password: 'anonymous123',
        });

        if (signInError) {
          throw new Error('Failed to authenticate: ' + signInError.message);
        }
      }

      // Map data to expected format
      const formattedData = data.map(app => ({
        app: app.app,
        time: app.time,
        domain: appDomainMap[app.app] || '',
        category: appCategoryMap[app.app] || 'Other',
      }));

      // Now proceed with sync
      console.log('Starting sync with data:', formattedData);
      const today = new Date().toISOString().split('T')[0];
      
      // First try to get existing data
      const { data: existingData, error: fetchError } = await supabase
        .from('device_usage')
        .select('*')
        .eq('device', 'mobile')
        .eq('date', today)
        .single();
        
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('No existing data found, will create new record');
        } else {
          console.error('Error fetching existing data:', fetchError);
          throw new Error(`Failed to fetch existing data: ${fetchError.message}`);
        }
      }
      
      // Prepare data for upsert
      const upsertData = {
        device: 'mobile',
        date: today,
        data: formattedData
      };
      
      console.log('Upserting data:', upsertData);
      
      const { data: upsertedData, error: upsertError } = await supabase
        .from('device_usage')
        .upsert(upsertData, {
          onConflict: 'device,date'
        })
        .select();
        
      if (upsertError) {
        throw new Error(`Failed to sync data: ${upsertError.message}`);
      }
      
      console.log('Sync successful, upserted data:', upsertedData);
      setLastSyncTime(new Date().toLocaleTimeString());
      onSyncComplete?.(true);
    } catch (error) {
      console.error('Sync error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync data';
      setError(errorMessage);
      Alert.alert(
        'Sync Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
      onSyncComplete?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[
          styles.button, 
          isLoading && styles.buttonDisabled
        ]} 
        onPress={handleSync}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {error ? 'Retry Sync' : 'Sync Data'}
          </Text>
        )}
      </TouchableOpacity>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      {lastSyncTime && !error && (
        <Text style={styles.successText}>Last synced: {lastSyncTime}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  successText: {
    color: '#34C759',
    fontSize: 12,
    marginTop: 4,
  },
});