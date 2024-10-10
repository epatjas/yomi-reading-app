import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Link } from 'expo-router';
import { colors, fonts, layout } from '../styles/globalStyles';
import { Zap } from 'lucide-react-native'; // Import the Zap icon

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Top right avatar */}
      <Image
        source={require('../../assets/images/avatar.png')}
        style={styles.avatar}
      />

      {/* Main content */}
      <View style={styles.mainContent}>
        <Image
          source={require('../../assets/images/yomi.png')}
          style={styles.yomiImage}
        />
        <Text style={styles.message}>
          Can you please read to me?{'\n'}Reading makes Yomi happy.
        </Text>
        <Pressable style={styles.readButton}>
          <Text style={styles.readButtonText}>Read to Yomi</Text>
        </Pressable>
      </View>

      {/* Energy level card */}
      <View style={styles.energyCard}>
        <View style={styles.energyHeader}>
          <Image
            source={require('../../assets/images/yomi-small.png')}
            style={styles.yomiSmall}
          />
          <Zap
            size={24} // Adjust size as needed
            color={colors.energyBarFill} // Use the appropriate color from your globalStyles
            style={styles.energyIcon}
          />
        </View>
        <Text style={styles.energyLevel}>56%</Text>
        <Text style={styles.energyText}>Energy level</Text>
        <View style={styles.energyBar}>
          <View style={[styles.energyFill, { width: '56%' }]} />
        </View>
        <Text style={styles.careText}>Care for Yomi</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: layout.padding,
  },
  avatar: {
    position: 'absolute',
    top: layout.padding,
    right: layout.padding,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yomiImage: {
    width: 120,
    height: 120,
    marginBottom: layout.spacing,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: layout.spacing,
  },
  readButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  readButtonText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.buttonText,
  },
  energyCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: layout.padding,
    marginTop: layout.spacing,
  },
  energyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing / 2,
  },
  yomiSmall: {
    width: 30,
    height: 30,
  },
  energyIcon: {
    width: 20,
    height: 20,
  },
  energyLevel: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: colors.text,
  },
  energyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: layout.spacing / 2,
  },
  energyBar: {
    height: 4,
    backgroundColor: colors.energyBarBackground,
    borderRadius: 2,
    marginBottom: layout.spacing / 2,
  },
  energyFill: {
    height: '100%',
    backgroundColor: colors.energyBarFill,
    borderRadius: 2,
  },
  careText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
  },
});
