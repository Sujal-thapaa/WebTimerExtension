const SUPABASE_URL = 'https://tnjdqipuegeuzpfbrxmv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuamRxaXB1ZWdldXpwZmJyeG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMzY1MjQsImV4cCI6MjA2NTcxMjUyNH0.56IkmlyQvR86D7be0TlRYxwLtlkfhse4jyCZehY6I90';

export const fetchMobileData = async (date) => {
  try {
    console.log('Extension: Fetching mobile data for date:', date);
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/device_usage?device=eq.mobile&date=eq.${date}`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Extension: Supabase fetch error:', errorData);
      throw new Error(`Failed to fetch mobile data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Extension: Fetch successful:', data);
    return data[0]?.data || null;
  } catch (error) {
    console.error('Extension: Error fetching mobile data:', error);
    return null;
  }
}; 