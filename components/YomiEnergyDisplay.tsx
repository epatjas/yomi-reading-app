import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Zap } from 'lucide-react-native';
import { colors, fonts, layout } from '../app/styles/globalStyles';

// Correct imports
import YomiMaxEnergy from '../assets/images/yomi-max-energy.png';
import YomiHighEnergy from '../assets/images/yomi-high-energy.png';
import YomiMediumEnergy from '../assets/images/yomi-medium-energy.png';
import YomiLowEnergy from '../assets/images/yomi-low-energy.png';
import YomiVeryLowEnergy from '../assets/images/yomi-very-low-energy.png';

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

const YomiEnergyDisplay: React.FC<YomiEnergyDisplayProps> = ({ energy, onStatusPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Image 
          source={getYomiImage(energy)} 
          style={styles.yomiIcon} 
        />
        <View style={styles.energyIconContainer}>
          <Zap size={20} color={colors.background} />
        </View>
      </View>
      <View style={styles.energyInfo}>
        <Text style={styles.energyNumber}>{energy}<Text style={styles.percentSign}>%</Text></Text>
        <Text style={styles.energyText}>Energy level</Text>
      </View>
      <View style={styles.energyBarContainer}>
        <View style={[styles.energyBarFill, { width: `${energy}%` }]} />
      </View>
      <View style={styles.bottomRow}>
        <Text style={styles.careText}>Care for Yomi</Text>
        <TouchableOpacity onPress={onStatusPress}>
          <Text style={styles.statusLink}>View Yomi's Status</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.yellowMedium,
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  yomiIcon: {
    width: 56,
    height: 56,
  },
  energyIconContainer: {
    backgroundColor: colors.yellowMedium,
    borderRadius: 8,
    padding: 12,
  },
  energyInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
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
    marginBottom: 4,
  },
  energyBarFill: {
    height: '100%',
    backgroundColor: colors.yellowDark,
    borderRadius: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  careText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.background,
  },
  statusLink: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.background,
    textDecorationLine: 'underline',
  },
});

export default YomiEnergyDisplay;
