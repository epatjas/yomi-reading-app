import * as Font from 'expo-font';
import { useEffect, useState } from 'react';

export default function useFonts() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'SFProRounded_400Regular': require('../assets/fonts/SFProRounded_400Regular.ttf'),
          'SFProRounded_500Medium': require('../assets/fonts/SFProRounded_500Medium.ttf'),  
          'SFProRounded_600SemiBold': require('../assets/fonts/SFProRounded_600SemiBold.ttf'),
          'SFProRounded_700Bold': require('../assets/fonts/SFProRounded_700Bold.ttf'),
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
