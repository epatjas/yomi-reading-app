import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, layout } from './styles/globalStyles';

export default function CelebrationScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      router.replace({
        pathname: '/(tabs)',
        params: { userId }
      });
    }, 4000);
    return () => clearTimeout(timer);
  }, [router, userId]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.celebrationText, { opacity: fadeAnim }]}>
        Your reading adventure is about to begin
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background01,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.paddingHorizontal,
    paddingVertical: layout.paddingVertical,
  },
  celebrationText: {
    fontFamily: fonts.regular,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 32,
  },
});
