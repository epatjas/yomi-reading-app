import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, layout } from '../styles/globalStyles';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');
const YOMI_SIZE = Math.min(width * 0.5, height * 0.3);

export default function CelebrationScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const { t } = useTranslation('common');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const yomiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(yomiAnim, {
        toValue: 1,
        duration: 1000,
        delay: 500,
        useNativeDriver: true,
      })
    ]).start();

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
      <Animated.View style={[styles.yomiContainer, {
        opacity: yomiAnim,
        transform: [{ translateY: yomiAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0]
        })}]
      }]}>
        <Image
          source={require('../../assets/images/yomi-character.png')}
          style={styles.yomiImage}
        />
      </Animated.View>
      <Animated.Text style={[
        styles.celebrationText,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}>
        {t('celebration.message')}
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
  yomiContainer: {
    marginBottom: height * 0.05,
  },
  yomiImage: {
    width: YOMI_SIZE,
    height: YOMI_SIZE,
    resizeMode: 'contain',
  },
  celebrationText: {
    fontFamily: fonts.regular,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 32,
  },
});
