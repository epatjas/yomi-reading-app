import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '../../app/styles/globalStyles';

interface SparkleProps {
  size?: number;
  color?: string;
  style?: any;
}

const Sparkle: React.FC<SparkleProps> = ({ 
  size = 4, 
  color = colors.yellowDark,
  style 
}) => {
  return (
    <Animated.View style={[styles.sparkle, { width: size, height: size, backgroundColor: color }, style]} />
  );
};

const styles = StyleSheet.create({
  sparkle: {
    position: 'absolute',
    borderRadius: 2,
  },
});

export default Sparkle;
