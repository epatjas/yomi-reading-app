import { useEffect } from 'react';
import { Slot } from 'expo-router';
import ErrorBoundary from './components/shared/ErrorBoundary';
import useFonts from './hooks/useFonts';
// Import translation configuration
import './translation';

export default function App() {
  const fontsLoaded = useFonts();

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Slot />
    </ErrorBoundary>
  );
} 