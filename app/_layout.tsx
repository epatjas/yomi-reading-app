import { Stack } from 'expo-router';

export default function RootLayout() {
  console.log('Root layout mounted');
  
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
      <Stack.Screen name="screens" />
    </Stack>
  );
} 