import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Library, CircleUserRound } from 'lucide-react-native';
import { colors, layout } from '../../app/styles/globalStyles';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const tabs = [
    { name: 'index', icon: Home },
    { name: 'reading', icon: Library },
    { name: 'profile', icon: CircleUserRound }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const isFocused = state.index === index;
          const Icon = tab.icon;
          
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => navigation.navigate(tab.name)}
              style={styles.tabItem}
            >
              <Icon size={24} color={isFocused ? colors.primary : colors.textSecondary} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background02,
    paddingBottom: 16, 
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background02,
    borderTopWidth: 1,
    borderTopColor: colors.stroke,
    height: 60,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
