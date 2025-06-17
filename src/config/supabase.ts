import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { ENV } from './env';

// Create a single supabase client for interacting with your database
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Initialize anonymous session
const initializeAnonymousSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return;
    }
    
    if (!session) {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'anonymous@example.com',
        password: 'anonymous123',
      });
      
      if (signInError) {
        console.error('Error signing in anonymously:', signInError);
      } else {
        console.log('Anonymous session initialized:', data);
      }
    } else {
      console.log('Existing session found:', session);
    }
  } catch (error) {
    console.error('Error initializing anonymous session:', error);
  }
};

// Verify Supabase connection
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state changed:', event, session);
});

// Test the connection
const testConnection = async () => {
  try {
    // First ensure we have a session
    await initializeAnonymousSession();
    
    // Then test the connection
    const { data, error } = await supabase
      .from('device_usage')
      .select('count')
      .limit(1);
      
    if (error) {
      console.error('Supabase connection test failed:', error);
    } else {
      console.log('Supabase connection test successful');
    }
  } catch (error) {
    console.error('Supabase connection test error:', error);
  }
};

// Run connection test
testConnection();

export const syncMobileData = async (data: any[]) => {
  try {
    console.log('Starting sync with data:', data);
    const today = new Date().toISOString().split('T')[0];
    
    // Format data for sync
    const formattedData = {
      device: 'mobile',
      date: today,
      data: data
    };
    
    console.log('Formatted data for sync:', formattedData);
    
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
      data: existingData ? [...existingData.data, ...data] : data
    };
    
    console.log('Upserting data:', upsertData);
    
    // Upsert the data
    const { data: upsertedData, error: upsertError } = await supabase
      .from('device_usage')
      .upsert(upsertData, {
        onConflict: 'device,date'
      })
      .select();
      
    if (upsertError) {
      console.error('Error upserting data:', upsertError);
      throw new Error(`Failed to upsert data: ${upsertError.message}`);
    }
    
    console.log('Sync successful, upserted data:', upsertedData);
    return { success: true, data: upsertedData };
  } catch (error) {
    console.error('Sync error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred during sync'
    };
  }
};

export const fetchMobileData = async (date: string) => {
  try {
    console.log('Fetching mobile data for date:', date);
    const { data, error } = await supabase
      .from('device_usage')
      .select('*')
      .eq('device', 'mobile')
      .eq('date', date)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('No data found for date:', date);
        return null;
      }
      console.error('Error fetching data:', error);
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
    
    console.log('Fetched data:', data);
    return data?.data || null;
  } catch (error) {
    console.error('Error in fetchMobileData:', error);
    throw new Error(`Failed to fetch mobile data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}; 