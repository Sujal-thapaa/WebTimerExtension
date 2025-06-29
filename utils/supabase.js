const SUPABASE_URL = 'https://tnjdqipuegeuzpfbrxmv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuamRxaXB1ZWdldXpwZmJyeG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMzY1MjQsImV4cCI6MjA2NTcxMjUyNH0.56IkmlyQvR86D7be0TlRYxwLtlkfhse4jyCZehY6I90';

// Function to get app domain for favicon
function getAppDomain(appName) {
  const domainMap = {
    'Instagram': 'instagram.com',
    'YouTube': 'youtube.com',
    'LinkedIn': 'linkedin.com',
    'Facebook': 'facebook.com',
    'WhatsApp': 'whatsapp.com',
    'Messenger': 'messenger.com',
    'ChatGPT': 'openai.com',
    'Spotify': 'spotify.com',
    'Discord': 'discord.com',
    'Outlook': 'outlook.com',
    'Chrome': 'google.com',
    'Google': 'google.com',
    'Clash of Clans': 'supercell.com',
    'Clash Royale': 'supercell.com',
    'Chess': 'chess.com',
    'Uber': 'uber.com',
    'Grubhub': 'grubhub.com',
    'Chase': 'chase.com',
    'Walmart': 'walmart.com'
  };
  return domainMap[appName] || 'example.com';
}

// Function to get app category
function getAppCategory(appName) {
  const categoryMap = {
    'Instagram': 'Social Media',
    'LinkedIn': 'Social Media',
    'Facebook': 'Social Media',
    'WhatsApp': 'Social Media',
    'Messenger': 'Social Media',
    'Discord': 'Social Media',
    'YouTube': 'Entertainment',
    'Spotify': 'Entertainment',
    'Netflix': 'Entertainment',
    'Clash of Clans': 'Games',
    'Clash Royale': 'Games',
    'Chess': 'Games',
    'Google': 'Productive / Educational',
    'Chrome': 'Productive / Educational',
    'Outlook': 'Productive / Educational',
    'ChatGPT': 'Productive / Educational',
    'Settings': 'Other',
    'Camera': 'Other',
    'Clock': 'Other',
    'Gallery': 'Other',
    'Phone': 'Other',
    'Calculator': 'Other',
    'Messages': 'Other',
    'CamScanner': 'Other',
    'Grubhub': 'Other',
    'Chase': 'Other',
    'Mint Mobile': 'Other',
    'Wallet': 'Other',
    'Uber': 'Other',
    'Expo Go': 'Development',
    'DeepSeek': 'Development',
    'Walmart': 'Other'
  };
  return categoryMap[appName] || 'Other';
}

export const fetchMobileData = async (date) => {
  try {
    console.log('Extension: Fetching mobile data for date:', date);
    const encodedDate = encodeURIComponent(date);
    const url = `${SUPABASE_URL}/rest/v1/mobile_data?device_type=eq.mobile&date=eq.${encodedDate}&select=*&order=minutes.desc`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Extension: Supabase fetch error:', errorData);
      throw new Error(`Failed to fetch mobile data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Extension: Fetch successful:', data);
    
    // Transform the data to match the expected format
    const transformedData = data.map(row => ({
      app: row.app_name,
      time: row.time_spent,
      domain: getAppDomain(row.app_name),
      category: getAppCategory(row.app_name),
      minutes: row.minutes
    }));
    
    return transformedData.length > 0 ? transformedData : null;
  } catch (error) {
    console.error('Extension: Error fetching mobile data:', error);
    return null;
  }
};

export async function syncMobileData(payload) {
  const today = new Date().toISOString().slice(0, 10);

  // Transform payload to match the mobile_data table structure
  const mobileDataRows = payload.map(app => ({
    device_type: 'mobile',
    date: today,
    app_name: app.app,
    time_spent: app.time,
    minutes: app.minutes || 0
  }));

  // First, delete existing data for today to avoid duplicates
  const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/mobile_data?device_type=eq.mobile&date=eq.${today}`, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!deleteResponse.ok && deleteResponse.status !== 404) {
    console.error('Error deleting existing data:', await deleteResponse.text());
  }

  // Insert new data
  const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/mobile_data`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(mobileDataRows)
  });

  if (!insertResponse.ok) {
    throw new Error(await insertResponse.text());
  }

  return await insertResponse.json();
} 