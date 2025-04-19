import * as Font from 'expo-font';
import { useEffect, useState } from 'react';

export default function useFonts() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        console.log('Loading fonts...');
        
        // Define the fonts to load
        const fontAssets = {
          'SFProRounded_400Regular': require('../assets/fonts/SFProRounded_400Regular.ttf'),
          'SFProRounded_500Medium': require('../assets/fonts/SFProRounded_500Medium.ttf'),  
          'SFProRounded_600SemiBold': require('../assets/fonts/SFProRounded_600SemiBold.ttf'),
          'SFProRounded_700Bold': require('../assets/fonts/SFProRounded_700Bold.ttf'),
          'OpenDyslexic-Regular': require('../assets/fonts/OpenDyslexic-Regular.otf'),
        };
        
        console.log('Font assets to load:', Object.keys(fontAssets));
        
        // Wait for fonts to load
        await Font.loadAsync(fontAssets);
        
        console.log('Fonts loaded successfully');
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
