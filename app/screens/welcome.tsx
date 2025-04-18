import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { globalStyles, colors, fonts, layout } from '../styles/globalStyles';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/shared/LanguageSwitcher';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const SHAPE_SIZE = Math.min(140, width * 0.35);

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation('common');

  return (
    <View style={[globalStyles.container, styles.screenLayout]}>
      <View style={styles.header}>
        <LanguageSwitcher />
      </View>
      
      <View style={styles.mainContent}>
        {/* Absolutely positioned elements */}
        <View style={styles.absoluteContainer}>
          {/* Yellow shape and Yomi (rendered first, appears at bottom) */}
          <View style={styles.shapeContainer}>
            <Svg width={SHAPE_SIZE} height={SHAPE_SIZE} viewBox="0 0 184 180" style={styles.shapeBackground}>
              <Path
                d="M147.296 34.918C128.753 16.8494 116.849 -0.00828492 91.0203 3.05478e-05C63.6175 0.00879629 53.4067 18.6067 34.255 38.3606C15.6594 57.5409 1.40808e-05 59.9999 0 89.9999C-1.40808e-05 120 16.4608 124.261 32.7869 141.147C51.8094 160.822 63.7238 179.919 91.0203 180C116.65 180.075 130.169 165.246 147.296 146.065C164.501 126.798 183.788 116.871 183.998 90.9835C184.211 64.776 166.019 53.1613 147.296 34.918Z"
                fill={colors.yellowLight}
              />
            </Svg>
            <Image
              source={require('../../assets/images/yomi-character.png')}
              style={styles.yomiImage}
            />
          </View>
          
          {/* Speech bubble (rendered second, appears on top) */}
          <View style={styles.speechBubbleContainer}>
            <View style={styles.speechBubble}>
              <Text style={styles.welcomeText}>
                {t('welcome.message')}
              </Text>
            </View>
            
            <Svg height="30" width="60" style={styles.speechBubblePointer}>
              <Path
                d="M 0,0 Q 25,15 10,30 L 60,0 Z"
                fill={colors.background02}
              />
            </Svg>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[globalStyles.button, styles.wideButton]} 
        onPress={() => router.push('/screens/create-profile')}
        activeOpacity={0.7}
      >
        <Text style={[globalStyles.buttonText, styles.centeredButtonText]}>{t('welcome.button')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screenLayout: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.paddingHorizontal,
    paddingVertical: layout.paddingVertical,
  },
  header: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: layout.spacing,
    marginTop: 24,
  },
  mainContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  absoluteContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shapeContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: SHAPE_SIZE,
    height: SHAPE_SIZE,
  },
  shapeBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  yomiImage: {
    width: SHAPE_SIZE * 0.85,
    height: SHAPE_SIZE * 0.85,
  },
  speechBubbleContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    top: '30%',
    transform: [{ translateY: -120 }],
  },
  speechBubble: {
    backgroundColor: colors.background02,
    borderRadius: 50,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
  speechBubblePointer: {
    position: 'absolute',
    bottom: -20,
    right: '25%',
  },
  welcomeText: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 28,
  },
  wideButton: {
    width: '80%',
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  centeredButtonText: {
    textAlign: 'center',
    fontFamily: fonts.medium,
  },
});
