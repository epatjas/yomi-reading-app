import { Stack } from 'expo-router';
import { loadSavedLanguage } from '../translation';
import { useEffect } from 'react';

export default function RootLayout() {
  console.log('Root layout mounted');
  
  // Load language on app start
  useEffect(() => {
    loadSavedLanguage();
  }, []);
  
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: false,
        animation: 'none'
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="screens" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
} 