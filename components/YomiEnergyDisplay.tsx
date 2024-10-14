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
        <View style={[
          styles.energyBarFill, 
          { width: `${energy}%` },
          energy === 100 ? { borderRadius: 8 } : { borderTopRightRadius: 0, borderBottomRightRadius: 0 }
        ]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.yellowMedium,
    borderRadius: 16,
    padding: 20, // Increased from 16 to 20
    paddingTop: 24, // Add extra padding to the top
    paddingBottom: 24, // Add extra padding to the bottom
    width: '100%',
    marginBottom: 12,
    // You can also add a fixed height if needed:
    // height: 180, // Adjust this value as needed
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
    aspectRatio: 4/3, // Adjust this ratio to match your image's aspect ratio
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
    marginBottom: 8, // Increased from 4 to 8
    marginTop: 4, // Add some space above the energy info
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
    padding: 2, // Add this line to create space for the gap
  },
  energyBarFill: {
    height: '100%',
    backgroundColor: colors.yellowDark,
    borderRadius: 8, // Slightly smaller than the container's borderRadius
  },
});

export default YomiEnergyDisplay;
