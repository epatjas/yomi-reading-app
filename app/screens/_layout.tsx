import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'none'
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="create-profile" />
      <Stack.Screen name="choose-avatar" />
      <Stack.Screen name="select-profile" />
      <Stack.Screen name="celebration" />
      <Stack.Screen name="ReadingScreen" />
      <Stack.Screen name="QuizScreen" />
      <Stack.Screen name="ReadingResultsScreen" />
    </Stack>
  );
}
