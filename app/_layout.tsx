import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from '@/hooks/useColorScheme';
import useFonts from '../hooks/useFonts'; // Adjust the path as necessary
import { registerBackgroundFetchAsync } from '../services/backgroundTasks';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const fontsLoaded = useFonts();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
    // Register background task
    registerBackgroundFetchAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // or return a loading indicator
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="reading-results" options={{ headerShown: false }} />
        {/* Add other non-tab screens here */}
      </Stack>
    </ThemeProvider>
  );
}
