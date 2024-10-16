import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { colors, fonts, layout } from '../app/styles/globalStyles';
import Svg, { Path } from 'react-native-svg';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const SHAPE_SIZE = 48; // Adjust this value as needed to fit your design

interface ReadingEnergyDisplayProps {
  energy: number;
  sessionEnergy: number;
  recentGain: number;
  energyProgress: number;
}

const getYomiImage = (energy: number) => {
  if (energy >= 80) return require('../assets/images/yomi-max-energy.png');
  if (energy >= 60) return require('../assets/images/yomi-high-energy.png');
  if (energy >= 40) return require('../assets/images/yomi-medium-energy.png');
  if (energy >= 20) return require('../assets/images/yomi-low-energy.png');
  return require('../assets/images/yomi-very-low-energy.png');
};

const ReadingEnergyDisplay: React.FC<ReadingEnergyDisplayProps> = ({ 
  energy, 
  sessionEnergy, 
  recentGain, 
  energyProgress 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fillAnim = useRef(new Animated.Value(energy)).current;

  useEffect(() => {
    if (recentGain > 0) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [recentGain]);

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: energy + sessionEnergy,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [energy, sessionEnergy]);

  return (
    <View style={styles.container}>
      <View style={styles.yomiContainer}>
        <Svg width={SHAPE_SIZE} height={SHAPE_SIZE} viewBox="0 0 184 180" style={styles.shapeBackground}>
          <Path
            d="M147.296 34.918C128.753 16.8494 116.849 -0.00828492 91.0203 3.05478e-05C63.6175 0.00879629 53.4067 18.6067 34.255 38.3606C15.6594 57.5409 1.40808e-05 59.9999 0 89.9999C-1.40808e-05 120 16.4608 124.261 32.7869 141.147C51.8094 160.822 63.7238 179.919 91.0203 180C116.65 180.075 130.169 165.246 147.296 146.065C164.501 126.798 183.788 116.871 183.998 90.9835C184.211 64.776 166.019 53.1613 147.296 34.918Z"
            fill={colors.primary}
          />
        </Svg>
        <Image 
          source={getYomiImage(energy + sessionEnergy)}
          style={styles.yomiIcon}
        />
      </View>
      <View style={styles.energyBarContainer}>
        <Animated.View 
          style={[
            styles.energyBarFill, 
            { 
              width: fillAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              }) 
            }
          ]} 
        />
      </View>
      <Animated.Text style={[styles.energyGainText, { opacity: fadeAnim }]}>
        +{recentGain}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 40,
    marginBottom: 10,
  },
  yomiContainer: {
    width: SHAPE_SIZE,
    height: SHAPE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  shapeBackground: {
    position: 'absolute',
  },
  yomiIcon: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
  energyBarContainer: {
    flex: 1,
    height: 16,
    backgroundColor: colors.background02,
    borderRadius: 16,
    overflow: 'hidden',
  },
  energyBarFill: {
    height: '90%',  // Reduced from 100% to create space
    backgroundColor: colors.yellowDark,
    borderRadius: 16,  // Slightly reduced to maintain curved edges
    marginVertical: 2,  // Add a small vertical margin
  },
  energyGainText: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -20 }],
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
});

export default ReadingEnergyDisplay;
