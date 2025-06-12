import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/config/supabase';

export const clearAllStorage = async () => {
  try {
    console.log('🧹 Clearing all storage...');
    
    // Clear AsyncStorage
    await AsyncStorage.clear();
    console.log('✅ AsyncStorage cleared');
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    console.log('✅ Supabase session cleared');
    
    // Force reload the session state
    await supabase.auth.getSession();
    
    console.log('✅ All storage cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear storage:', error);
    return false;
  }
};

// Register this in the developer menu
if (__DEV__) {
  const DevMenu = require('react-native').DevSettings;
  DevMenu.addMenuItem('Clear All Storage', async () => {
    const success = await clearAllStorage();
    if (success) {
      const { Alert } = require('react-native');
      Alert.alert('Storage Cleared', 'Please reload the app to see changes.');
    }
  });
} 