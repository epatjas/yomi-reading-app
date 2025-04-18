import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, layout } from '../styles/globalStyles';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const YOMI_SIZE = Math.min(width * 0.5, height * 0.3);
const SHAPE_SIZE = YOMI_SIZE * 1.2;

export default function CelebrationScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const { t } = useTranslation('common');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const yomiAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Create sparkle animations
  const sparkleCount = 12;
  const sparkleAnims = useRef(
    Array(sparkleCount).fill(0).map(() => ({
      position: new Animated.ValueXY({ x: 0, y: 0 }),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      rotation: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Start all animations in parallel
    Animated.parallel([
      // Fade in the content
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      
      // Scale up the text
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      
      // Bounce animation for Yomi
      Animated.sequence([
        Animated.timing(yomiAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(yomiAnim, {
          toValue: 0.95,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(yomiAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      
      // Gentle rotation back and forth
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 0.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -0.05,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      
      // Sparkle animations
      ...sparkleAnims.map((anim, i) => {
        const angle = (i / sparkleAnims.length) * Math.PI * 2;
        const distance = YOMI_SIZE + Math.random() * 50;
        const randomRotation = Math.random() * 360;
        
        return Animated.parallel([
          // Position animation - move outward
          Animated.timing(anim.position, {
            toValue: {
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
            },
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
          }),
          
          // Opacity animation - fade in then out
          Animated.sequence([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 800,
              delay: 500,
              useNativeDriver: true,
            }),
          ]),
          
          // Scale animation - grow then shrink
          Animated.sequence([
            Animated.spring(anim.scale, {
              toValue: 0.5 + Math.random() * 0.5,
              friction: 5,
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 0,
              duration: 500,
              delay: 800,
              useNativeDriver: true,
            }),
          ]),
          
          // Rotation animation
          Animated.timing(anim.rotation, {
            toValue: 1,
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
          }),
        ]);
      }),
    ]).start();

    // Navigate to home after animation completes
    const timer = setTimeout(() => {
      router.replace({
        pathname: '/(tabs)',
        params: { userId }
      });
    }, 4500);
    
    return () => clearTimeout(timer);
  }, [router, userId, fadeAnim, scaleAnim, yomiAnim, rotateAnim, sparkleAnims]);

  return (
    <View style={styles.container}>
      {/* Yellow shape and Yomi with animations */}
      <Animated.View 
        style={[
          styles.yomiContainer, 
          {
            opacity: yomiAnim,
            transform: [
              { scale: yomiAnim },
              { translateY: yomiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })},
              { rotate: rotateAnim.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: ['-15deg', '0deg', '15deg']
              })}
            ]
          }
        ]}
      >
        {/* Yellow background shape */}
        <Svg width={SHAPE_SIZE} height={SHAPE_SIZE} viewBox="0 0 184 180" style={styles.shapeBackground}>
          <Path
            d="M147.296 34.918C128.753 16.8494 116.849 -0.00828492 91.0203 3.05478e-05C63.6175 0.00879629 53.4067 18.6067 34.255 38.3606C15.6594 57.5409 1.40808e-05 59.9999 0 89.9999C-1.40808e-05 120 16.4608 124.261 32.7869 141.147C51.8094 160.822 63.7238 179.919 91.0203 180C116.65 180.075 130.169 165.246 147.296 146.065C164.501 126.798 183.788 116.871 183.998 90.9835C184.211 64.776 166.019 53.1613 147.296 34.918Z"
            fill={colors.yellowLight}
          />
        </Svg>
        
        {/* Yomi character */}
        <Image
          source={require('../../assets/images/yomi-character.png')}
          style={styles.yomiImage}
        />
        
        {/* Sparkles */}
        {sparkleAnims.map((anim, i) => (
          <Animated.View 
            key={i}
            style={[
              styles.sparkle,
              {
                opacity: anim.opacity,
                transform: [
                  { translateX: anim.position.x },
                  { translateY: anim.position.y },
                  { scale: anim.scale },
                  { rotate: anim.rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })}
                ]
              }
            ]}
          >
            <View style={[
              styles.sparkleItem, 
              { backgroundColor: i % 3 === 0 ? colors.yellowDark : colors.yellowLight }
            ]} />
          </Animated.View>
        ))}
      </Animated.View>
      
      {/* Animated text */}
      <Animated.Text 
        style={[
          styles.celebrationText,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
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
    position: 'relative',
    width: SHAPE_SIZE,
    height: SHAPE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.08,
  },
  shapeBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  yomiImage: {
    width: YOMI_SIZE,
    height: YOMI_SIZE,
    resizeMode: 'contain',
  },
  celebrationText: {
    fontFamily: fonts.semiBold,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 38,
    maxWidth: '80%',
  },
  sparkle: {
    position: 'absolute',
    width: 10,
    height: 10,
    zIndex: 10,
  },
  sparkleItem: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
