import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import ErrorBoundary from './components/shared/ErrorBoundary';

export default function App() {
  const [fontsLoaded] = useFonts({
    // Your fonts here
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Slot />
    </ErrorBoundary>
  );
} 