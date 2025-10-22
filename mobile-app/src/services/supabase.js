import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get environment variables from app config
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

// Validate that credentials are present
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please check your app.config.js and .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
