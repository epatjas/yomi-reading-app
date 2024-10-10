import React from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import useFonts from './hooks/useFonts'; // Adjust the path as necessary
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import your screen components
import HomeScreen from './screens/HomeScreen'; // Adjust the path as necessary
// Import other screens as needed

const Stack = createStackNavigator();

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text>Loading...</Text>
    </View>
  );
}

export default function App() {
  const fontsLoaded = useFonts();

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        {/* Add other screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}