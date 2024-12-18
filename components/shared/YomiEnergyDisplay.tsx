import React, { memo, useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Zap } from 'lucide-react-native';
import { colors, fonts, layout } from '../../app/styles/globalStyles';
import { MAX_ENERGY } from '../../services/yomiEnergyService';

// Correct imports
import YomiMaxEnergy from '../../assets/images/yomi-max-energy.png';
import YomiHighEnergy from '../../assets/images/yomi-high-energy.png';
import YomiMediumEnergy from '../../assets/images/yomi-medium-energy.png';
import YomiLowEnergy from '../../assets/images/yomi-low-energy.png';
import YomiVeryLowEnergy from '../../assets/images/yomi-very-low-energy.png';

interface YomiEnergyDisplayProps {
  energy: number;
  sessionEnergy?: number;
  onStatusPress?: () => void;
}

const getYomiImage = (energy: number) => {
  if (energy >= 80) return YomiMaxEnergy;
  if (energy >= 60) return YomiHighEnergy;
  if (energy >= 40) return YomiMediumEnergy;
  if (energy >= 20) return YomiLowEnergy;
  return YomiVeryLowEnergy;
};

const YomiEnergyDisplay: React.FC<YomiEnergyDisplayProps> = memo(({ 
  energy, 
  sessionEnergy = 0, 
  onStatusPress 
}) => {
  // Calculate total energy including session gains
  const totalEnergy = useMemo(() => {
    const total = Math.min(MAX_ENERGY, Math.max(0, Math.round(Number(energy) + Number(sessionEnergy))));
    return total;
  }, [energy, sessionEnergy]);

  // Calculate base energy percentage
  const baseEnergyPercentage = useMemo(() => {
    return Math.min(100, Math.max(0, Math.round(Number(energy) || 0)));
  }, [energy]);

  // Memoize the Yomi image selection based on total energy
  const yomiImage = useMemo(() => getYomiImage(totalEnergy), [totalEnergy]);

  return (
    <TouchableOpacity style={styles.container} onPress={onStatusPress}>
      <View style={styles.topRow}>
        <Image 
          source={yomiImage} 
          style={styles.yomiIcon} 
        />
        <View style={styles.energyIconContainer}>
          <Zap size={20} color={colors.background} />
        </View>
      </View>
      <View style={styles.energyInfo}>
        <Text style={styles.energyNumber}>
          {totalEnergy}<Text style={styles.percentSign}>%</Text>
        </Text>
        {sessionEnergy > 0 && (
          <Text style={styles.energyGained}>+{sessionEnergy}%</Text>
        )}
        <Text style={styles.energyText}>Energy level</Text>
      </View>
      <View style={styles.energyBarContainer}>
        {/* Base energy bar */}
        <View style={[
          styles.energyBarFill,
          { width: `${baseEnergyPercentage}%` },
          styles.baseEnergyBar
        ]} />
        {/* Session energy bar */}
        {sessionEnergy > 0 && (
          <View style={[
            styles.energyBarFill,
            styles.sessionEnergyBar,
            { 
              width: `${Math.min(sessionEnergy, MAX_ENERGY - baseEnergyPercentage)}%`,
              left: `${baseEnergyPercentage}%`
            }
          ]} />
        )}
      </View>
    </TouchableOpacity>
  );
});

// Add display name for debugging purposes
YomiEnergyDisplay.displayName = 'YomiEnergyDisplay';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.yellowMedium,
    borderRadius: 16,
    padding: 16,
    paddingTop: 16,
    paddingBottom: 24,
    width: '100%',
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  yomiIcon: {
    width: 56,
    height: undefined,
    aspectRatio: 1/1,
    resizeMode: 'contain',
  },
  energyIconContainer: {
    backgroundColor: colors.yellowDark,
    borderRadius: 8,
    padding: 12,
  },
  energyInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    marginTop: 4,
  },
  energyNumber: {
    fontSize: 48,
    fontFamily: fonts.regular,
    color: colors.background,
  },
  percentSign: {
    fontSize: 32,
    fontFamily: fonts.regular,
    color: colors.background,
  },
  energyText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.background,
    marginLeft: 4,
  },
  energyBarContainer: {
    height: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 8,
    marginTop: 4,
    padding: 2,
  },
  energyBarFill: {
    height: '100%',
    backgroundColor: colors.yellowDark,
    borderRadius: 8,
  },
  energyGained: {
    fontSize: 24,
    fontFamily: fonts.medium,
    color: colors.background,
    marginLeft: 8,
    opacity: 0.8,
  },
  baseEnergyBar: {
    position: 'absolute',
    left: 2,
    top: 2,
    backgroundColor: colors.yellowDark,
  },
  sessionEnergyBar: {
    position: 'absolute',
    top: 2,
    backgroundColor: colors.primary,
    opacity: 0.8,
  },
});

export default YomiEnergyDisplay;
