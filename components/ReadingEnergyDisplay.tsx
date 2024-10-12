import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { colors, fonts, layout } from '../app/styles/globalStyles';

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
      <Image 
        source={getYomiImage(energy + sessionEnergy)}
        style={styles.yomiIcon}
      />
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
  yomiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
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
