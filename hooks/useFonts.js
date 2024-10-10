import * as Font from 'expo-font';
import { useEffect, useState } from 'react';

export default function useFonts() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Inter_400Regular': require('@expo-google-fonts/inter/Inter_400Regular.ttf'),
          'Inter_500Medium': require('@expo-google-fonts/inter/Inter_500Medium.ttf'),
          'Inter_600SemiBold': require('@expo-google-fonts/inter/Inter_600SemiBold.ttf'),
          'Inter_700Bold': require('@expo-google-fonts/inter/Inter_700Bold.ttf'),
        });
      } catch (error) {
        console.error('Error loading fonts:', error);
      } finally {
        setFontsLoaded(true);
      }
    }

    loadFonts();
  }, []);

  return fontsLoaded;
}
