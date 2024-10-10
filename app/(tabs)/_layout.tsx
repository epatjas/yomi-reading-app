import React from 'react';
import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../components/CustomTabBar';  // Corrected import path

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // This removes the top bar
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="reading"
        options={{
          title: 'Reading',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
