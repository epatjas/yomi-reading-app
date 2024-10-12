import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, fonts, layout } from './styles/globalStyles';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
const SHAPE_SIZE = width * 0.5;
const IMAGE_SIZE = SHAPE_SIZE * 0.8;

export default function CelebrationScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace({
        pathname: '/(tabs)',
        params: { userId }
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [router, userId]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Svg width={SHAPE_SIZE} height={SHAPE_SIZE} viewBox="0 0 184 180">
            <Path
              d="M147.296 34.918C128.753 16.8494 116.849 -0.00828492 91.0203 3.05478e-05C63.6175 0.00879629 53.4067 18.6067 34.255 38.3606C15.6594 57.5409 1.40808e-05 59.9999 0 89.9999C-1.40808e-05 120 16.4608 124.261 32.7869 141.147C51.8094 160.822 63.7238 179.919 91.0203 180C116.65 180.075 130.169 165.246 147.296 146.065C164.501 126.798 183.788 116.871 183.998 90.9835C184.211 64.776 166.019 53.1613 147.296 34.918Z"
              fill={colors.primary}
            />
          </Svg>
          <Image
            source={require('../assets/images/yomi-character.png')}
            style={styles.characterImage}
          />
        </View>
        <Text style={styles.celebrationText}>
          Your reading adventure is{'\n'}about to begin
        </Text>
      </View>
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
  content: {
    alignItems: 'center',
  },
  imageContainer: {
    width: SHAPE_SIZE,
    height: SHAPE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  characterImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    position: 'absolute',
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
