import React, { memo, useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Zap } from 'lucide-react-native';
import { colors, fonts, layout } from '../../app/styles/globalStyles';

// Correct imports
import YomiMaxEnergy from '../../assets/images/yomi-max-energy.png';
import YomiHighEnergy from '../../assets/images/yomi-high-energy.png';
import YomiMediumEnergy from '../../assets/images/yomi-medium-energy.png';
import YomiLowEnergy from '../../assets/images/yomi-low-energy.png';
import YomiVeryLowEnergy from '../../assets/images/yomi-very-low-energy.png';

interface YomiEnergyDisplayProps {
  energy: number;
  onStatusPress?: () => void;
}

const getYomiImage = (energy: number) => {
  if (energy >= 80) return YomiMaxEnergy;
  if (energy >= 60) return YomiHighEnergy;
  if (energy >= 40) return YomiMediumEnergy;
  if (energy >= 20) return YomiLowEnergy;
  return YomiVeryLowEnergy;
};

const YomiEnergyDisplay: React.FC<YomiEnergyDisplayProps> = memo(({ energy, onStatusPress }) => {
  // Memoize the energy calculation
  const displayEnergy = useMemo(() => {
    return Math.min(100, Math.max(0, Math.round(Number(energy) || 0)));
  }, [energy]);

  // Memoize the Yomi image selection
  const yomiImage = useMemo(() => getYomiImage(displayEnergy), [displayEnergy]);

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
        <Text style={styles.energyNumber}>{displayEnergy}<Text style={styles.percentSign}>%</Text></Text>
        <Text style={styles.energyText}>Energy level</Text>
      </View>
      <View style={styles.energyBarContainer}>
        <View style={[
          styles.energyBarFill, 
          { width: `${displayEnergy}%` },
          displayEnergy === 100 ? { borderRadius: 8 } : { borderTopRightRadius: 0, borderBottomRightRadius: 0 }
        ]} />
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
});

export default YomiEnergyDisplay;
